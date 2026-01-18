import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 1. Initialize Supabase Client
    // This client is responsible for refreshing the token if needed.
    // The 'setAll' method ensures updated cookies are passed to BOTH:
    // - The Browser (via response)
    // - The Server Components (via request)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // Sync cookies to Request (for RSC downstream)
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )

                    // Sync cookies to Response (for Browser)
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 2. Refresh the Session
    // getUser() sends a request to Supabase Auth.
    // If the token is expired, Supabase refreshes it, calling setAll above.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 3. Protected Routes Logic
    // Exclude auth routes from protection
    if (request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/error')) {
        return response
    }

    // Redirect unauthenticated users
    if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return response
}

export default updateSession

// 4. Matcher Configuration
// Exclude static files, images, and API routes that don't need auth
export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * 1. /_next/ (Next.js internals)
         * 2. /static (static files)
         * 3. /api/ (API routes - handled separately or by RLS)
         * 4. .*\\..* (Files with extensions like .png, .jpg, .css)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
