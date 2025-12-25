"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UserSchema = z.object({
    id: z.string(),
    full_name: z.string().min(2, "Name is required"),
    role: z.string(),
    employee_id: z.string().optional(),
    plant_id: z.string().optional(), // If managing plant access
});

export type UserProfile = z.infer<typeof UserSchema>;

import { getSafeUser } from "@/lib/auth";
import { ActionState } from "@/lib/types";


export async function checkPermissions(supabase: any, allowedRoles: string[]) {
    // This helper might become redundant if getSafeUser returns role, but let's keep logic for now
    const user = await getSafeUser();
    return allowedRoles.includes(user.role);
}

export async function getUsers(page = 1, pageSize = 10, search = "") {
    const supabase = await createClient();
    try {
        await getSafeUser(); // Ensure auth context
    } catch (e) {
        return { data: [], count: 0, error: "Unauthorized" };
    }

    // ... existing query logic
    let query = supabase
        .from("user_profiles")
        .select(`
            *,
            organizations (name),
            plants (name)
        `, { count: "exact" });

    if (search) {
        query = query.ilike("full_name", `%${search}%`);
    }

    const { data, error, count } = await query
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching users:", error);
        return { data: [], count: 0, error: error.message };
    }

    return { data, count, error: null };
}

export async function updateUser(id: string, formData: FormData): Promise<ActionState> {
    const supabase = await createClient();

    // Security Check: Only Admin or Manager can update users
    const caller = await getSafeUser();
    if (!["admin", "qa_manager", "system_owner"].includes(caller.role)) {
        return { success: false, message: "Forbidden: Insufficient permissions" };
    }

    const roleToAssign = formData.get("role") as string;

    // Prevent privilege escalation: Only system_owner can assign system_owner role
    if (roleToAssign === "system_owner" && caller.role !== "system_owner") {
        return { success: false, message: "Forbidden: Only System Owners can assign this role" };
    }

    // Fetch target user's current role to prevent unauthorized modification of system_owners
    const { data: targetUser, error: fetchError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", id)
        .single();

    if (fetchError || !targetUser) {
        return { success: false, message: "User not found" };
    }

    if (targetUser.role === "system_owner" && caller.role !== "system_owner") {
        return { success: false, message: "Forbidden: You cannot modify a System Owner" };
    }

    const data = {
        full_name: formData.get("full_name") as string,
        role: roleToAssign,
        employee_id: formData.get("employee_id") as string,
    };

    // Validate fields
    if (!data.full_name) {
        return { success: false, message: "Full name is required" };
    }

    const { error } = await supabase
        .from("user_profiles")
        .update(data)
        .eq("id", id);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath("/admin/users");
    return { success: true, message: "User updated successfully" };
}
