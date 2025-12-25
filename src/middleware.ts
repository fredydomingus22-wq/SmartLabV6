import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/auth/callback", // For OAuth callbacks
];

// Routes accessible without redirect (static assets, api, etc.)
const BYPASS_ROUTES = [
    "/_next",
    "/api",
    "/favicon.ico",
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Bypass static assets and API routes
    if (BYPASS_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

    // If user is NOT logged in and trying to access a protected route
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
    }

    // If user IS logged in and trying to access login page
    if (user && pathname === "/login") {
        const url = request.nextUrl.clone();
        // Check for 'next' parameter to redirect to intended page
        const next = request.nextUrl.searchParams.get("next");
        url.pathname = next || "/dashboard";
        url.searchParams.delete("next");
        return NextResponse.redirect(url);
    }

    // Root redirect
    if (pathname === "/") {
        const url = request.nextUrl.clone();
        url.pathname = user ? "/dashboard" : "/login";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};

