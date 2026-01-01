"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for CIP Program
const CreateProgramSchema = z.object({
    name: z.string().min(3),
    target_equipment_type: z.enum(["tank", "line", "silo"]),
    plant_id: z.string().uuid(),
    steps: z.array(z.object({
        name: z.string(),
        step_order: z.coerce.number(),
        target_temp_c: z.coerce.number().optional(),
        target_duration_sec: z.coerce.number().optional(),
        target_conductivity: z.coerce.number().optional(),
    }))
});

// Schema for Starting Execution
const StartExecutionSchema = z.object({
    program_id: z.string().uuid(),
    equipment_type: z.string(),
    equipment_id: z.string().uuid(), // Now a UUID for equipment_uid
});

// Schema for Logging Step
const LogStepSchema = z.object({
    execution_id: z.string().uuid(),
    program_step_id: z.string().uuid(),
    status: z.enum(["in_progress", "pass", "fail"]),
    actual_temp: z.coerce.number().optional(),
    actual_conductivity: z.coerce.number().optional(),
});

// Schema for Finishing Execution
const FinishExecutionSchema = z.object({
    execution_id: z.string().uuid(),
    status: z.enum(["completed", "failed", "aborted"]),
});

export async function createProgramAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: userData } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
    if (!userData) return { success: false, message: "Profile not found" };

    // Parse complex form data (steps need to be structured from JSON usually, or indexed fields)
    // For simplicity in ActionForm, we might receive a JSON string for 'steps'
    const stepsJson = formData.get("steps_json");
    if (!stepsJson || typeof stepsJson !== 'string') return { success: false, message: "Invalid steps data" };

    const rawData = {
        name: formData.get("name"),
        target_equipment_type: formData.get("target_equipment_type"),
        plant_id: formData.get("plant_id"),
        steps: JSON.parse(stepsJson)
    };

    const validation = CreateProgramSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    // Transaction? Supabase doesn't support generic transactions via JS client easily yet without RPC.
    // We will do it sequentially (Risk: orphaned program if steps fail).

    // 1. Create Program
    const { data: program, error: progError } = await supabase.from("cip_programs").insert({
        organization_id: userData.organization_id,
        plant_id: validation.data.plant_id,
        name: validation.data.name,
        target_equipment_type: validation.data.target_equipment_type
    }).select().single();

    if (progError) return { success: false, message: progError.message };

    // 2. Create Steps
    const stepsToInsert = validation.data.steps.map(s => ({
        organization_id: userData.organization_id,
        program_id: program.id,
        ...s
    }));

    const { error: stepsError } = await supabase.from("cip_program_steps").insert(stepsToInsert);

    if (stepsError) {
        // Cleanup (Manual Rollback)
        await supabase.from("cip_programs").delete().eq("id", program.id);
        return { success: false, message: "Failed to save steps: " + stepsError.message };
    }

    revalidatePath("/cip/programs");
    return { success: true, message: "CIP Program Created" };
}

export async function startExecutionAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: userData } = await supabase.from('user_profiles').select('organization_id, plant_id').eq('id', user!.id).single();

    const rawData = {
        program_id: formData.get("program_id"),
        equipment_type: formData.get("equipment_type"),
        equipment_id: formData.get("equipment_id")
    };

    const validation = StartExecutionSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    // Fetch equipment metadata for redundancy and validation
    // Note: startExecutionAction form submission might typically come from a different UI than register, assume we rely on 'equipment_type' parameter roughly mapping to table or add target logic.
    // For now, let's try to infer or check all if not found.

    let equipment: { name: string, code: string, equipment_type: string } | null = null;

    // Check Tanks
    if (!equipment) {
        const { data } = await supabase.from('tanks').select('name, code').eq('id', validation.data.equipment_id).single();
        if (data) equipment = { ...data, equipment_type: 'tank' };
    }
    // Check Lines
    if (!equipment) {
        const { data } = await supabase.from('production_lines').select('name, code').eq('id', validation.data.equipment_id).single();
        if (data) equipment = { ...data, equipment_type: 'line' };
    }
    // Check Process Equipment
    if (!equipment) {
        const { data } = await supabase.from('process_equipment').select('name, code, equipment_category').eq('id', validation.data.equipment_id).single();
        if (data) equipment = { name: data.name, code: data.code, equipment_type: data.equipment_category || 'equipment' };
    }
    // Check Legacy Equipments
    if (!equipment) {
        const { data } = await supabase.from('equipments').select('name, code, equipment_type').eq('id', validation.data.equipment_id).single();
        equipment = data;
    }

    if (!equipment) return { success: false, message: "Equipment not found" };

    const { error } = await supabase.from("cip_executions").insert({
        organization_id: userData!.organization_id,
        plant_id: userData!.plant_id,
        program_id: validation.data.program_id,
        equipment_type: equipment.equipment_type,
        equipment_id: equipment.code, // Use code for legacy compatibility/display
        equipment_uid: validation.data.equipment_id,
        performed_by: user!.id,
        status: "pending"
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/cip");
    return { success: true, message: "Cleaning Cycle Started" };
}

export async function logStepAction(formData: FormData) {
    const supabase = await createClient();

    const rawData = {
        execution_id: formData.get("execution_id"),
        program_step_id: formData.get("program_step_id"),
        status: formData.get("status"),
        actual_temp: formData.get("actual_temp"),
        actual_conductivity: formData.get("actual_conductivity"),
    };

    const validation = LogStepSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    const { error } = await supabase.rpc("log_cip_step", {
        p_execution_id: validation.data.execution_id,
        p_program_step_id: validation.data.program_step_id,
        p_status: validation.data.status,
        p_actual_temp: validation.data.actual_temp || null,
        p_actual_conductivity: validation.data.actual_conductivity || null
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/cip");
    return { success: true, message: "Step Updated" };
}

export async function finishExecutionAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const rawData = {
        execution_id: formData.get("execution_id"),
        status: formData.get("status"),
    };

    const validation = FinishExecutionSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    const { error } = await supabase
        .from("cip_executions")
        .update({
            status: validation.data.status,
            end_time: new Date().toISOString()
        })
        .eq("id", validation.data.execution_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/cip");
    return { success: true, message: `Equipamento ${validation.data.status === 'completed' ? 'Libertado' : 'Ciclo Abortado'}` };
}

// Schema for Manual CIP Registration
const RegisterCompletedCIPSchema = z.object({
    equipment_id: z.string().uuid("Select equipment"),
    program_id: z.string().uuid("Select program"),
    start_time: z.string().min(1, "Start time required"),
    end_time: z.string().min(1, "End time required"),
    notes: z.string().optional(),
    steps: z.array(z.object({
        program_step_id: z.string().uuid(),
        actual_duration_min: z.coerce.number().min(0),
        actual_temp_c: z.coerce.number().optional(),
        actual_conductivity: z.coerce.number().optional(),
        actual_ph: z.coerce.number().optional(),
        concentration: z.coerce.number().optional(),
        status: z.enum(["pass", "fail"]).default("pass"),
    })),
});

/**
 * Register a completed CIP cycle with all step data in one submission.
 * Used for manual "after-the-fact" registration like filling a paper form.
 */
export async function registerCompletedCIPAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: userData } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!userData) return { success: false, message: "Profile not found" };

    // Parse steps from JSON
    const stepsJson = formData.get("steps_json");
    let steps: any[] = [];
    try {
        steps = stepsJson ? JSON.parse(stepsJson as string) : [];
    } catch {
        return { success: false, message: "Invalid steps data" };
    }

    const rawData = {
        equipment_id: formData.get("equipment_id"),
        program_id: formData.get("program_id"),
        start_time: formData.get("start_time"),
        end_time: formData.get("end_time"),
        notes: formData.get("notes") || undefined,
        steps,
    };

    const validation = RegisterCompletedCIPSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Fetch equipment metadata
    const targetTable = formData.get("target_table") as string;
    let equipment: { name: string, code: string, equipment_type: string } | null = null;

    if (targetTable === 'tank') {
        const { data } = await supabase.from('tanks').select('name, code').eq('id', validation.data.equipment_id).single();
        if (data) equipment = { ...data, equipment_type: 'tank' };
    } else if (targetTable === 'production_line') {
        const { data } = await supabase.from('production_lines').select('name, code').eq('id', validation.data.equipment_id).single();
        if (data) equipment = { ...data, equipment_type: 'line' };
    } else if (targetTable === 'process_equipment') {
        // Some schemas use 'equipment_category' or just store it as type
        const { data } = await supabase.from('process_equipment').select('name, code, equipment_category').eq('id', validation.data.equipment_id).single();
        if (data) equipment = { name: data.name, code: data.code, equipment_type: data.equipment_category || 'equipment' };
    } else {
        // Fallback to legacy 'equipments' table
        const { data } = await supabase.from('equipments').select('name, code, equipment_type').eq('id', validation.data.equipment_id).single();
        equipment = data;
    }

    if (!equipment) return { success: false, message: "Equipment not found in " + (targetTable || "equipments") };

    // 1. Create the CIP Execution record
    const { data: execution, error: execError } = await supabase
        .from("cip_executions")
        .insert({
            organization_id: userData.organization_id,
            plant_id: userData.plant_id,
            program_id: validation.data.program_id,
            equipment_type: equipment.equipment_type,
            equipment_id: equipment.code,
            equipment_uid: validation.data.equipment_id,
            target_type: targetTable || 'equipment',
            performed_by: user.id,
            start_time: validation.data.start_time,
            end_time: validation.data.end_time,
            status: "completed",
            validation_status: "pending",
        })
        .select("id")
        .single();

    if (execError) return { success: false, message: execError.message };

    // 2. Create all step records
    const stepsToInsert = validation.data.steps.map(step => ({
        organization_id: userData.organization_id,
        execution_id: execution.id,
        program_step_id: step.program_step_id,
        actual_duration_sec: step.actual_duration_min * 60,
        actual_temp_c: step.actual_temp_c || null,
        actual_conductivity: step.actual_conductivity || null,
        actual_ph: step.actual_ph || null,
        concentration: step.concentration || null,
        status: step.status,
        start_time: validation.data.start_time,
        end_time: validation.data.end_time,
    }));

    const { error: stepsError } = await supabase
        .from("cip_execution_steps")
        .insert(stepsToInsert);

    if (stepsError) {
        // Rollback execution
        await supabase.from("cip_executions").delete().eq("id", execution.id);
        return { success: false, message: "Failed to save steps: " + stepsError.message };
    }

    // 3. Update equipment's last CIP date
    await supabase
        .from("equipments")
        .update({ last_cip_date: validation.data.end_time })
        .eq("id", validation.data.equipment_id);

    revalidatePath("/cip/register");
    revalidatePath("/cip/history");
    return { success: true, message: "CIP registado com sucesso!" };
}

