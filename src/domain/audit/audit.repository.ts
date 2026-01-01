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
                full_name,
                email
            ),
            ai_insight:ai_insights (
                status,
                message,
                confidence
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

    const { data, error, count } = await query;

    if (error) {
        console.error('[AuditRepo] Fetch failed:', error);
        throw error;
    }

    return {
        data,
        total: count
    };
}
