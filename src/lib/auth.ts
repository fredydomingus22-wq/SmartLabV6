import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type SafeUser = {
    id: string;
    email: string;
    organization_id: string;
    plant_id: string;
    role: string;
    full_name: string;
};

export async function getSafeUser(): Promise<SafeUser> {
    const supabase = await createClient();

    // 1. Check Auth User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect("/login");
    }

    // 2. Check Profile & Context
    // We strictly select organization_id and plant_id to ensure every action is tenant-scoped.
    const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id, role, full_name")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
        // Log this critical error (missing profile for auth user)
        console.error("Critical: User has no profile or DB error", {
            error: profileError,
            userId: user.id,
            email: user.email
        });
        redirect("/login?error=no_profile");
    }

    if (!profile.organization_id) {
        console.error("Critical: User belongs to no organization", {
            userId: user.id
        });
        redirect("/login?error=no_org");
    }

    const safeUser = {
        id: user.id,
        email: user.email!, // Supabase auth user always has email
        organization_id: profile.organization_id,
        plant_id: profile.plant_id || "", // Optional strictly typed
        role: profile.role || "user",
        full_name: profile.full_name || "Utilizador",
    };

    // Special Case: System Owner might not be bound to a single Org in the future, 
    // but for now our schema enforces organization_id NOT NULL on user_profiles.
    // So even System Owners belong to a "Admin Org" (e.g. the SaaS Provider itself).
    // This simplifies tenancy logic: The Admin connects to "SmartLab HQ" Org.

    return safeUser;
}
