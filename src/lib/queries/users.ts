import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";

/**
 * Get all users in the organization for select dropdowns
 */
export async function getUsers() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, role")
        .eq("organization_id", user.organization_id)
        .order("full_name");

    return { data: data || [], error };
}
