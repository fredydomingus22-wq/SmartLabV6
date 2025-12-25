import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with the SERVICE ROLE key.
 * This client BYPASSES ALL Row Level Security (RLS).
 * Use only for administrative tasks in trusted Server Actions.
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Missing Supabase Service Role configuration');
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
