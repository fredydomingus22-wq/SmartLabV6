"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { EnvironmentalZoneSchema, SamplingPointSchema } from "@/schemas/compliance";

export async function createEnvironmentalZone(values: any) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const validated = EnvironmentalZoneSchema.parse(values);

    const { data, error } = await supabase
        .from("environmental_zones")
        .insert({
            ...validated,
            organization_id: user.organization_id,
            plant_id: validated.plant_id || user.plant_id || null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating environmental zone:", error);
        throw new Error(error.message);
    }

    revalidatePath("/quality/environmental");
    return data;
}

export async function updateEnvironmentalZone(id: string, values: any) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const validated = EnvironmentalZoneSchema.parse(values);

    const { data, error } = await supabase
        .from("environmental_zones")
        .update({
            ...validated,
            plant_id: validated.plant_id || user.plant_id || null,
        })
        .eq("id", id)
        .eq("organization_id", user.organization_id)
        .select()
        .single();

    if (error) {
        console.error("Error updating environmental zone:", error);
        throw new Error(error.message);
    }

    revalidatePath("/quality/environmental");
    return data;
}

export async function deleteEnvironmentalZone(id: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { error } = await supabase
        .from("environmental_zones")
        .delete()
        .eq("id", id)
        .eq("organization_id", user.organization_id);

    if (error) {
        console.error("Error deleting environmental zone:", error);
        throw new Error(error.message);
    }

    revalidatePath("/quality/environmental");
}

export async function createSamplingPoint(values: any) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const validated = SamplingPointSchema.parse(values);

    const { data, error } = await supabase
        .from("sampling_points")
        .insert({
            ...validated,
            organization_id: user.organization_id,
            plant_id: validated.plant_id || user.plant_id || null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating sampling point:", error);
        throw new Error(error.message);
    }

    revalidatePath("/quality/environmental");
    return data;
}

export async function updateSamplingPoint(id: string, values: any) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const validated = SamplingPointSchema.parse(values);

    const { data, error } = await supabase
        .from("sampling_points")
        .update({
            ...validated,
            plant_id: validated.plant_id || user.plant_id || null,
        })
        .eq("id", id)
        .eq("organization_id", user.organization_id)
        .select()
        .single();

    if (error) {
        console.error("Error updating sampling point:", error);
        throw new Error(error.message);
    }

    revalidatePath("/quality/environmental");
    return data;
}

export async function deleteSamplingPoint(id: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { error } = await supabase
        .from("sampling_points")
        .delete()
        .eq("id", id)
        .eq("organization_id", user.organization_id);

    if (error) {
        console.error("Error deleting sampling point:", error);
        throw new Error(error.message);
    }

    revalidatePath("/quality/environmental");
}
