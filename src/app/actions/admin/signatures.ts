"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";

/**
 * Upload a signature image for a user (Admin only)
 * The signature is stored in Supabase Storage and the URL is saved to user_profiles.
 */
export async function uploadUserSignatureAction(formData: FormData) {
    const supabase = await createClient();

    // Verify admin permission
    const perm = await requirePermission("admin", "write");
    if (!perm.success) return { success: false, message: perm.message };

    const targetUserId = formData.get("user_id") as string;
    const signatureFile = formData.get("signature") as File;

    if (!targetUserId || !signatureFile) {
        return { success: false, message: "User ID and signature file are required." };
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/svg+xml"];
    if (!allowedTypes.includes(signatureFile.type)) {
        return { success: false, message: "Invalid file type. Use PNG, JPEG, or SVG." };
    }

    // Validate file size (max 500KB)
    if (signatureFile.size > 500 * 1024) {
        return { success: false, message: "File too large. Maximum size is 500KB." };
    }

    // Upload to Storage
    const fileExt = signatureFile.name.split(".").pop();
    const fileName = `${targetUserId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from("signatures")
        .upload(fileName, signatureFile, {
            upsert: true,
            contentType: signatureFile.type,
        });

    if (uploadError) {
        return { success: false, message: `Upload failed: ${uploadError.message}` };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
        .from("signatures")
        .getPublicUrl(fileName);

    const signatureUrl = publicUrlData.publicUrl;

    // Update user profile
    const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ signature_url: signatureUrl })
        .eq("id", targetUserId);

    if (updateError) {
        return { success: false, message: `Profile update failed: ${updateError.message}` };
    }

    revalidatePath("/admin/users");
    return { success: true, message: "Signature uploaded successfully.", signatureUrl };
}

/**
 * Remove a user's signature (Admin only)
 */
export async function removeUserSignatureAction(formData: FormData) {
    const supabase = await createClient();

    const perm = await requirePermission("admin", "write");
    if (!perm.success) return { success: false, message: perm.message };

    const targetUserId = formData.get("user_id") as string;
    if (!targetUserId) return { success: false, message: "User ID required." };

    // Clear signature URL from profile
    const { error } = await supabase
        .from("user_profiles")
        .update({ signature_url: null })
        .eq("id", targetUserId);

    if (error) return { success: false, message: error.message };

    revalidatePath("/admin/users");
    return { success: true, message: "Signature removed." };
}
