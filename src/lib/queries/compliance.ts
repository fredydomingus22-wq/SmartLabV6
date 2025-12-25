import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";

export async function getTACCPByOrganization() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("taccp_assessments")
        .select("*")
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching TACCP:", error);
        return [];
    }

    return data;
}

export async function getVACCPByOrganization() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("vaccp_vulnerabilities")
        .select("*, material:inventory_items(name)")
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching VACCP:", error);
        return [];
    }

    return data;
}

export async function getEnvironmentalZones() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("environmental_zones")
        .select(`
            *,
            sampling_points (*)
        `)
        .eq("organization_id", user.organization_id)
        .order("risk_level", { ascending: true });

    if (error) {
        console.error("Error fetching environmental zones:", error);
        return [];
    }

    return data;
}

export async function getAllergens() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("allergen_definitions")
        .select("*")
        .eq("organization_id", user.organization_id)
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching allergens:", error);
        return [];
    }

    return data;
}

export async function getCultureKPIs() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("culture_kpis")
        .select("*")
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching culture KPIs:", error);
        return [];
    }

    return data;
}

export async function getCultureSurveys() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("culture_surveys")
        .select(`
            *,
            responses:culture_surveys_responses(count)
        `)
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching culture surveys:", error);
        return [];
    }

    return data;
}
