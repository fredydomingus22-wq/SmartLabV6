import { createClient } from '@/lib/supabase/server';
import { getSafeUser } from '@/lib/auth.server';

export type AuditEntity = 'documents' | 'samples' | 'training' | 'inventory' | 'capa' | 'nc' | 'materials' | 'production' | 'suppliers';

export interface AuditEventPayload {
    old?: any;
    new?: any;
    reason?: string;
    [key: string]: any;
}

/**
 * Universal Audit Engine Service
 * Follows ALCOA+ standards for data integrity
 */
export async function createAuditEvent(params: {
    eventType: string;
    entityType: AuditEntity;
    entityId: string;
    payload?: AuditEventPayload;
    metadata?: Record<string, any>;
}) {
    try {
        const supabase = await createClient();
        const user = await getSafeUser();

        console.log(`[Audit] Logging ${params.eventType} for ${params.entityType}:${params.entityId}`);

        const { data, error } = await supabase
            .from('audit_events')
            .insert({
                organization_id: user.organization_id,
                user_id: user.id,
                event_type: params.eventType,
                entity_type: params.entityType,
                entity_id: params.entityId,
                payload: params.payload || {},
                metadata: {
                    ip: 'system-server', // In a real production environment, extract from headers
                    user_agent: 'next-server-action',
                    ...params.metadata
                }
            })
            .select("id")
            .single();

        if (error) {
            console.error('[Audit] Failed to log event:', error);
        } else if (data?.id) {
            // Asynchronously trigger AI Risk Analysis
            // We don't 'await' it to avoid blocking the caller
            import("@/lib/ai/triggers").then(m => {
                m.triggerAuditAnalysis(
                    data.id,
                    params.entityType,
                    params.entityId,
                    user.id,
                    params.eventType,
                    params.payload
                ).catch(e => console.error("[Audit] AI Trigger failed:", e));
            });
        }

        return { success: !error };
    } catch (error) {
        console.error('[Audit] Unexpected error:', error);
        return { success: false, error };
    }
}
