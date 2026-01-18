"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { headers } from "next/headers";

// Schemas
const LoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    next: z.string().optional(), // For redirect after login
});

const ForgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

const ResetPasswordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// Login Action
export async function loginAction(formData: FormData) {
    const supabase = await createClient();

    const rawData = {
        email: formData.get("email"),
        password: formData.get("password"),
        next: formData.get("next") || undefined,
    };

    const validation = LoginSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
    });

    if (error) {
        // Generic error message to prevent user enumeration
        return { success: false, message: "Invalid email or password" };
    }

    revalidatePath("/", "layout");

    // Redirect to intended page or dashboard
    const redirectTo = validation.data.next || "/dashboard";
    redirect(redirectTo);
}

// Logout Action
export async function logoutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/login");
}

// Forgot Password Action
export async function forgotPasswordAction(formData: FormData) {
    const supabase = await createClient();

    const rawData = {
        email: formData.get("email"),
    };

    const validation = ForgotPasswordSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    });

    // Always return success to prevent user enumeration
    // Even if email doesn't exist, show same message
    return {
        success: true,
        message: "If an account exists with this email, you will receive a password reset link."
    };
}

// Reset Password Action
export async function resetPasswordAction(formData: FormData) {
    const supabase = await createClient();

    const rawData = {
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
    };

    const validation = ResetPasswordSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase.auth.updateUser({
        password: validation.data.password,
    });

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath("/", "layout");
    redirect("/login?message=Password updated successfully");
}

/**
 * Sign Up Action - DISABLED for public access
 * New users must be invited by an admin. This prevents unauthorized access.
 * 
 * To invite a user:
 * 1. Admin creates user in Supabase dashboard, OR
 * 2. Use inviteUserAction below (admin only)
 */
export async function signUpAction(_formData: FormData) {
    return {
        success: false,
        message: "Public registration is disabled. Please contact your administrator for an account."
    };
}

/**
 * Invite User Action - Admin only
 * Creates a new user and sends them an invitation email
 */
export async function inviteUserAction(formData: FormData) {
    const supabase = await createClient();

    // Check if current user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return { success: false, message: "Only administrators can invite users" };
    }

    const email = formData.get("email") as string;
    const role = formData.get("role") as string || "operator";
    const fullName = formData.get("fullName") as string;
    const organizationId = formData.get("organization_id") as string;
    const plantId = formData.get("plant_id") as string;

    if (!email || !fullName || !organizationId) {
        return { success: false, message: "Missing required fields" };
    }

    // Use Supabase Admin API to invite user
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
            full_name: fullName,
            role: role,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) {
        return { success: false, message: error.message };
    }

    // Create user profile
    if (data.user) {
        await supabase.from("user_profiles").insert({
            id: data.user.id,
            full_name: fullName,
            // email: email, // email is NOT in user_profiles schema
            role: role as any,
            organization_id: organizationId,
            plant_id: plantId || null,
        });
    }

    return { success: true, message: `Invitation sent to ${email}` };
}

// Get Current User
export async function getCurrentUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return {
        ...user,
        profile,
    };
}

/**
 * Get user's organization and plant for tenant isolation
 */
export async function getTenantInfo() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id, role")
        .eq("id", user.id)
        .single();

    return profile;
}

