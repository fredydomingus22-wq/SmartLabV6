import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { SafeUser } from "./auth";
import { cache } from "react";

/**
 * Gets the authenticated and profiled user from the server context.
 * Strict selection of organization_id and plant_id to ensure tenant scoping.
 * Redirects to login if session or profile is missing.
 * 
 * NOTE: Wrapped with React cache() to ensure single execution per request,
 * preventing duplicate getUser() calls that cause refresh token race conditions.
 */
/**
 * Gets the authenticated and profiled user from the server context.
 * Strict selection of organization_id and plant_id to ensure tenant scoping.
 * Redirects to login if session or profile is missing.
 * 
 * NOTE: Wrapped with React cache() to ensure single execution per request.
 */
export const getSafeUser = cache(async (): Promise<SafeUser> => {
    // 1. Initialize RSC Client (Red-Only)
    const supabase = await createClient();

    // 2. Check Auth User
    // We trust valid session cookies validated by Middleware
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    // 3. Check Profile & Context
    // Use Admin Client to bypass potential recursive RLS in get_my_org_id()
    // This is safe because we already verified the User ID via auth.getUser above.
    const adminClient = createAdminClient();

    const { data: profile, error: profileError } = await adminClient
        .from("user_profiles")
        .select("organization_id, plant_id, role, full_name")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
        console.error("Critical: User has no profile or DB error", {
            error: profileError,
            userId: user.id
        });
        redirect("/login?error=no_profile");
    }

    if (!profile.organization_id && profile.role !== 'system_owner') {
        console.error("Critical: User belongs to no organization", {
            userId: user.id
        });
        redirect("/login?error=no_org");
    }

    const safeUser: SafeUser = {
        id: user.id,
        email: user.email!,
        organization_id: profile.organization_id || "",
        plant_id: profile.plant_id || "",
        role: profile.role || "user",
        full_name: profile.full_name || "Utilizador",
    };

    return safeUser;
});

