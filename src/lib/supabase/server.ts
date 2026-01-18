import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for Server Components.
 * This client uses the cookies() function from 'next/headers' to read the
 * session established by the Middleware.
 * 
 * IMPORTANT: This client should NOT attempt to refresh tokens (autoRefreshToken: false)
 * because the Middleware is the single source of truth for session management.
 */
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can happen if you have some middleware that refreshes the token
                        // and you accidentally use this client to write cookies.
                        // In Next.js Server Components, we can't write cookies, so we ignore this
                        // or let the Middleware handle it.
                    }
                },
            },
        }
    )
}
