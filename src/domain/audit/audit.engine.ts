import { SupabaseClient } from "@supabase/supabase-js";
import { DomainContext } from "../shared/industrial.context";

export interface AuditLogParams {
    action: string;
    entityType: 'samples' | 'analysis' | 'inventory' | 'production' | 'haccp' | 'users' | 'documents';
    entityId: string;
    payload?: any;
    metadata?: Record<string, any>;
}

/**
 * Universal Industrial Audit Engine
 * Ensures every domain action is traceable and immutable.
 */
export class AuditEngine {
    static async logAction(
        supabase: SupabaseClient,
        ctx: DomainContext,
        params: AuditLogParams
    ) {
        const { action, entityType, entityId, payload, metadata } = params;

        console.log(`[IndustrialAudit] ${ctx.user_id} performed ${action} on ${entityType}:${entityId}`);

        const { error } = await supabase
            .from('audit_events')
            .insert({
                organization_id: ctx.organization_id,
                user_id: ctx.user_id,
                event_type: action,
                entity_type: entityType,
                entity_id: entityId,
                payload: payload || {},
                metadata: {
                    correlation_id: ctx.correlation_id,
                    timestamp: new Date().toISOString(),
                    source: 'industrial-domain-core',
                    ...metadata
                }
            });

        if (error) {
            console.error('[IndustrialAudit] ERROR:', error);
            // In a mission-critical system, we might want to throw here 
            // to block the primary action if audit fails.
        }

        return !error;
    }
}
