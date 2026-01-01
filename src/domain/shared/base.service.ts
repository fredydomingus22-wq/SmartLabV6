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
}
