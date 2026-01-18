"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/permissions.server";
import { MicroDomainService } from "@/domain/micro/micro.service";

async function getMicroService() {
    const userData = await requirePermission('micro', 'write');
    const supabase = await createClient();
    return {
        service: new MicroDomainService(supabase, {
            organization_id: userData.organization_id!,
            user_id: userData.id,
            role: userData.role,
            plant_id: userData.plant_id!,
            correlation_id: crypto.randomUUID(),
        }),
        userData,
        supabase
    };
}

const MediaTypeSchema = z.object({
    name: z.string().min(2, "Name is required"),
    description: z.string().optional(),
    incubation_hours_min: z.coerce.number().min(0, "Min hours must be >= 0"),
    incubation_hours_max: z.coerce.number().min(0, "Max hours must be >= 0"),
    incubation_temp_c: z.coerce.number().min(0, "Temperature must be >= 0"),
    plant_id: z.string().uuid(),
});

export async function createMediaTypeAction(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: userData } = await supabase.from("user_profiles").select("organization_id").eq("id", user.id).single();

    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
        incubation_hours_min: formData.get("incubation_hours_min"),
        incubation_hours_max: formData.get("incubation_hours_max"),
        incubation_temp_c: formData.get("incubation_temp_c"),
        plant_id: formData.get("plant_id"),
    };

    const validation = MediaTypeSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase.from("micro_media_types").insert({
        organization_id: userData?.organization_id!,
        plant_id: validation.data.plant_id,
        name: validation.data.name,
        description: validation.data.description,
        incubation_hours_min: validation.data.incubation_hours_min,
        incubation_hours_max: validation.data.incubation_hours_max,
        incubation_temp_c: validation.data.incubation_temp_c,
    });

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath("/micro/configuration/media-types");
    return { success: true, message: "Media Type created successfully" };
}

export async function updateMediaTypeAction(formData: FormData) {
    const supabase = await createClient();

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "ID is required" };

    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
        incubation_hours_min: formData.get("incubation_hours_min"),
        incubation_hours_max: formData.get("incubation_hours_max"),
        incubation_temp_c: formData.get("incubation_temp_c"),
        plant_id: formData.get("plant_id"),
    };

    const validation = MediaTypeSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase
        .from("micro_media_types")
        .update({
            name: validation.data.name,
            description: validation.data.description,
            incubation_hours_min: validation.data.incubation_hours_min,
            incubation_hours_max: validation.data.incubation_hours_max,
            incubation_temp_c: validation.data.incubation_temp_c,
        })
        .eq("id", id);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath("/micro/configuration/media-types");
    return { success: true, message: "Media Type updated successfully" };
}

export async function deleteMediaTypeAction(formData: FormData) {
    const { service } = await getMicroService();
    const id = formData.get("id") as string;
    const reason = formData.get("reason") as string || "Eliminação por erro de registo";

    if (!id) return { success: false, message: "ID is required" };

    try {
        const result = await service.softDeleteEquipment('media_type', id, reason);
        if (!result.success) return { success: false, message: "Erro ao desativar tipo de meio." };

        revalidatePath("/micro/configuration/media-types");
        return { success: true, message: "Tipo de Meio desativado com sucesso (Soft Delete)" };
    } catch (e: any) {
        return { success: false, message: e.message || "Falha na desativação." };
    }
}
