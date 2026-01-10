import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Industrial Edge Proxy (formerly Middleware)
 * Enforces strict Route Guard Protection and Deep Role Verification.
 * 
 * @security CAPA-A-01, CAPA-A-02
 */
export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // 1. Initialize Supabase Client for Edge
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 2. Optimistic Session Check
    const { data: { user } } = await supabase.auth.getUser();

    // 3. Define Protected Routes & Logic
    const path = request.nextUrl.pathname;
    const isProtected = path.startsWith("/dashboard") || path.startsWith("/lab") || path.startsWith("/admin") || path.startsWith("/micro");

    if (isProtected && !user) {
        // Redirection to login for unauthenticated users
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // 4. Deep Role Verification (If Authenticated)
    if (user && isProtected) {
        // Fetch Profile for Role Enforcement
        // Note: This adds latency but satisfies "Deep Check" requirement.
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        const role = profile?.role || "user";

        // Route Guards Strategy (Strict)
        if (path.startsWith("/admin")) {
            if (!['admin', 'system_owner', 'qa_manager', 'qc_supervisor', 'quality'].includes(role)) {
                return NextResponse.redirect(new URL("/unauthorized", request.url));
            }
        }

        if (path.startsWith("/micro")) {
            if (!['micro_analyst', 'qa_manager', 'qc_supervisor', 'quality', 'admin', 'system_owner'].includes(role)) {
                return NextResponse.redirect(new URL("/unauthorized", request.url));
            }
        }

        // Lab routes are generally open to all analysts, but we block pure 'user' role if needed
        if (path.startsWith("/lab")) {
            if (['user'].includes(role)) { // Example restriction
                return NextResponse.redirect(new URL("/unauthorized", request.url));
            }
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - login (auth page)
         * - unauthorized (access denied page)
         * - api/auth (auth endpoints)
         */
        "/((?!_next/static|_next/image|favicon.ico|login|unauthorized|api/auth).*)",
    ],
};
