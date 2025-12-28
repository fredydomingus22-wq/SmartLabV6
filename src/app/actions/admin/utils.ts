"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSafeUser } from "@/lib/auth.server";

/**
 * Ensures that the current user has the 'system_owner' role.
 * Throws an error if not authorized.
 * @returns The safe user object for the authorized system owner.
 */
export async function ensureSystemOwner() {
    const user = await getSafeUser();
    if (user.role !== 'system_owner') {
        throw new Error('Unauthorized: System Owner privileges required');
    }
    return user;
}

/**
 * Logs a system-level administrative action for audit purposes.
 * Required for ISO 27701 compliance.
 */
export async function logSystemAction({
    actorId,
    action,
    entityType,
    entityId,
    oldData,
    newData,
    metadata = {}
}: {
    actorId: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldData?: any;
    newData?: any;
    metadata?: any;
}) {
    const supabase = createAdminClient();

    const { error } = await supabase
        .from('system_audit_logs')
        .insert({
            actor_id: actorId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            old_data: oldData,
            new_data: newData,
            metadata
        });

    if (error) {
        console.error("Failed to log system action:", error);
        // We don't throw here to avoid failing the primary action, 
        // but in a strict compliance env, we might want to.
    }
}

