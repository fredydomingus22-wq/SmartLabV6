"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Helper to convert empty strings to undefined
const emptyToUndefined = (val: FormDataEntryValue | null) => {
    if (val === null || val === "") return undefined;
    return val;
};

const SamplingPointSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(1, "Code is required").toUpperCase(),
    location: z.string().optional(),
    equipment_id: z.string().uuid().optional(),
    status: z.enum(["active", "inactive"]).default("active"),
});

export async function createSamplingPointAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const rawData = {
        name: formData.get("name"),
        code: formData.get("code"),
        location: emptyToUndefined(formData.get("location")),
        equipment_id: emptyToUndefined(formData.get("equipment_id")),
        status: emptyToUndefined(formData.get("status")) || "active",
    };

    const validation = SamplingPointSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Check for duplicate code
    const { data: existing } = await supabase
        .from("sampling_points")
        .select("id")
        .eq("code", validation.data.code)
        .eq("organization_id", profile.organization_id)
        .maybeSingle();

    if (existing) {
        return { success: false, message: `Sampling point with code ${validation.data.code} already exists` };
    }

    const { error } = await supabase.from("sampling_points").insert({
        organization_id: profile.organization_id,
        plant_id: profile.plant_id,
        ...validation.data,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/sampling-points");
    return { success: true, message: "Sampling point created successfully" };
}

export async function updateSamplingPointAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "ID required" };

    const rawData = {
        name: formData.get("name"),
        code: formData.get("code"),
        location: emptyToUndefined(formData.get("location")),
        equipment_id: emptyToUndefined(formData.get("equipment_id")),
        status: emptyToUndefined(formData.get("status")) || "active",
    };

    const validation = SamplingPointSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase
        .from("sampling_points")
        .update(validation.data)
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/sampling-points");
    return { success: true, message: "Sampling point updated" };
}

export async function deleteSamplingPointAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "ID required" };

    // Soft delete
    const { error } = await supabase
        .from("sampling_points")
        .update({ status: "inactive" })
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/sampling-points");
    return { success: true, message: "Sampling point deactivated" };
}
