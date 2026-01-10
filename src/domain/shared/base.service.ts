import { SupabaseClient } from "@supabase/supabase-js";
import { DomainContext, DomainResponse } from "./industrial.context";
import { AuditEngine } from "../audit/audit.engine";

/**
 * Base class for all industrial domain services.
 * Enforces audit logging and context consistency.
 */
export abstract class BaseDomainService {
    constructor(
        protected supabase: SupabaseClient,
        protected context: DomainContext
    ) { }

    /**
     * Mandatory audit wrapper for service methods.
     */
    protected async auditAction(
        action: string,
        entityType: string,
        entityId: string,
        payload: any = {}
    ) {
        return AuditEngine.logAction(this.supabase, this.context, {
            action,
            entityType: entityType as any,
            entityId,
            payload
        });
    }

    protected success<T>(data?: T, message?: string): DomainResponse<T> {
        return { success: true, data, message };
    }

    protected failure(message: string, error?: any): DomainResponse {
        return { success: false, message, error };
    }

    /**
     * Enforces Role-Based Access Control (RBAC) at the service level.
     * Throws an error if the user's role is not allowed.
     * @param allowedRoles List of roles permitted to execute the action.
     */
    protected enforceRole(allowedRoles: string[]) {
        const userRole = this.context.role;
        // System Owner is always allowed (Super Admin)
        if (userRole === 'system_owner') return;

        if (!allowedRoles.includes(userRole)) {
            const errorMsg = `ACCESS DENIED: Role '${userRole}' is not authorized. Required: ${allowedRoles.join(", ")}`;
            console.error(`[Security] ${errorMsg} | User: ${this.context.user_id}`);
            throw new Error(errorMsg);
        }
    }

    /**
     * Enforces strict tenancy and ownership checks.
     * Throws an error if the user attempts to access a resource outside their scope.
     * @param resourceOrgId The organization_id of the target resource.
     */
    protected enforceResourceOwnership(resourceOrgId: string) {
        // System Owner can access all organizations
        if (this.context.role === 'system_owner') return;

        if (this.context.organization_id !== resourceOrgId) {
            const errorMsg = `SECURITY ALERT: Cross-Tenant Access Attempt. User Org: ${this.context.organization_id} vs Resource Org: ${resourceOrgId}`;
            console.error(`[Security] ${errorMsg} | User: ${this.context.user_id}`);
            throw new Error("Resource access denied (Organization mismatch).");
        }
    }

    /**
     * Standardized soft-delete for regulated entities.
     */
    async softDelete(params: {
        table: string;
        id: string;
        reason: string;
        allowedRoles?: string[];
    }): Promise<DomainResponse> {
        const { table, id, reason, allowedRoles = ['admin', 'qa_manager', 'system_owner', 'qc_supervisor'] } = params;

        // 1. Security: RBAC
        this.enforceRole(allowedRoles);

        try {
            // 2. Fetch record to verify existence and ownership
            const { data: record, error: fetchError } = await this.supabase
                .from(table)
                .select("organization_id, status")
                .eq("id", id)
                .single();

            if (fetchError || !record) return this.failure(`Record not found in table '${table}'.`);

            // 3. Tenancy Check
            this.enforceResourceOwnership(record.organization_id);

            // 4. Immutability Check (Optional, but recommended for samples/analysis)
            if (['samples', 'lab_analysis'].includes(table)) {
                if (['approved', 'rejected', 'released', 'archived'].includes(record.status)) {
                    return this.failure(`IMMUTABILITY VIOLATION: Cannot delete record in '${record.status}' state.`);
                }
            }

            // 5. Soft Delete Execution
            const { error: deleteError } = await this.supabase
                .from(table)
                .update({
                    deleted_at: new Date().toISOString(),
                    deleted_by: this.context.user_id,
                    deletion_reason: reason
                })
                .eq("id", id);

            if (deleteError) throw deleteError;

            // 6. Audit Trail
            await this.auditAction('SOFT_DELETE', table, id, { reason });

            return this.success({ id, deleted: true });

        } catch (error: any) {
            console.error(`[DomainService] SoftDelete Error on ${table}:`, error);
            return this.failure(`Failed to soft-delete record on ${table}.`, error);
        }
    }
}
