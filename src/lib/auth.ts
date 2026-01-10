import { createClient } from "@/lib/supabase/server";

export type SafeUser = {
    id: string;
    email: string;
    organization_id?: string;
    plant_id?: string;
    role: string;
    full_name?: string;
};

export async function getCurrentUser(): Promise<SafeUser | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch profile for role
    const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return {
        id: user.id,
        email: user.email || "",
        organization_id: profile?.organization_id,
        plant_id: profile?.plant_id,
        role: profile?.role || "user",
        full_name: profile?.full_name || user.user_metadata?.full_name,
    };
}

export async function requirePermission(resource: string, action: "read" | "write" | "delete" | "admin") {
    const user = await getCurrentUser();

    if (!user) {
        return { success: false, message: "Unauthorized" };
    }

    if (user.role === "admin") {
        return { success: true, user };
    }

    // Basic role mapping - extend as needed
    const permissions: Record<string, string[]> = {
        "admin": ["admin"],
        "manager": ["admin", "manager"],
        "lab_analyst": ["admin", "manager", "lab_analyst"],
    };

    // If resource is "admin", only admins allowed
    if (resource === "admin" && user.role !== "admin") {
        return { success: false, message: "Forbidden: Admin access only" };
    }

    // Default allow for authenticated users for now if not strictly restricted
    // But sticking to the requested check:
    return { success: true, user };
}
