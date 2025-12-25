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
}
