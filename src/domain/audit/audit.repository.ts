import { createClient } from '@/lib/supabase/server';
import { getSafeUser } from '@/lib/auth.server';

export interface AuditFilter {
    entityId?: string;
    entityType?: string;
    userId?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export interface AuditEvent {
    id: string;
    event_type: string;
    entity_type: string;
    entity_id: string;
    user_id: string;
    organization_id: string;
    created_at: string;
    payload?: any;
    metadata?: any;
    user?: {
        full_name: string;
    };
    ai_insight?: {
        status: string;
        message: string;
        confidence: number;
        entity_id: string;
    };
}

/**
 * Universal Audit Engine Repository
 * Logic for fetching and filtering the immutable audit trail
 */
export async function getAuditEvents(filters: AuditFilter = {}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from('audit_events')
        .select(`
            *,
            user:user_profiles (
                full_name
            )
        `)
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false });

    // Apply Filters
    if (filters.entityId) query = query.eq('entity_id', filters.entityId);
    if (filters.entityType) query = query.eq('entity_type', filters.entityType);
    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.eventType) query = query.eq('event_type', filters.eventType);

    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);

    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data: rawEvents, error, count } = await query;
    const data = (rawEvents || []) as AuditEvent[];

    if (error) {
        console.error('[AuditRepo] Fetch failed:', error);
        throw error;
    }

    // Secondary Enrichment: AI Insights (Resilient Polymorphic Join)
    const entityIds = data.map(e => e.entity_id).filter(Boolean) as string[];
    if (entityIds.length > 0) {
        const { data: insights } = await supabase
            .from('ai_insights')
            .select('status, message, confidence, entity_id')
            .in('entity_id', entityIds);

        if (insights) {
            data.forEach(event => {
                event.ai_insight = insights.find(i => i.entity_id === event.entity_id);
            });
        }
    }

    return {
        data,
        total: count
    };
}
