"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- VALIDATION SCHEMAS ---

const createBatchSchema = z.object({
    plant_id: z.string().uuid(),
    product_id: z.string().uuid(),
    line_id: z.string().uuid(),
    code: z.string().min(3),
    quantity: z.number().positive(),
    start_date: z.string().date(), // YYYY-MM-DD
});

const registerResultSchema = z.object({
    sample_id: z.string().uuid(),
    parameter_id: z.string().uuid(),
    value_numeric: z.number().optional(),
    value_text: z.string().optional(),
});

// --- ACTIONS ---

export async function createGoldenBatchAction(data: z.infer<typeof createBatchSchema>) {
    const supabase = await createClient();
    const valid = createBatchSchema.parse(data);

    const { data: result, error } = await supabase.rpc("create_golden_batch", {
        p_plant_id: valid.plant_id,
        p_product_id: valid.product_id,
        p_line_id: valid.line_id,
        p_batch_code: valid.code,
        p_quantity: valid.quantity,
        p_start_date: valid.start_date,
    });

    if (error) {
        console.error("RPC Error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/production");
    return { success: true, data: result };
}

// FormData version for ActionForm component
export async function createGoldenBatchFromFormAction(formData: FormData) {
    const data = {
        plant_id: formData.get("plant_id") as string,
        product_id: formData.get("product_id") as string,
        line_id: formData.get("production_line_id") as string,
        code: formData.get("code") as string,
        quantity: Number(formData.get("planned_quantity")),
        start_date: formData.get("start_date") as string,
    };

    const result = await createGoldenBatchAction(data);
    // Convert to ActionResult format expected by ActionForm
    return {
        success: result.success,
        message: result.error || (result.success ? "Batch created successfully" : "Failed to create batch")
    };
}

export async function registerResultAction(data: z.infer<typeof registerResultSchema>) {
    const supabase = await createClient();
    const valid = registerResultSchema.parse(data);

    const { data: result, error } = await supabase.rpc("register_sample_result", {
        p_sample_id: valid.sample_id,
        p_qa_parameter_id: valid.parameter_id,
        p_value_numeric: valid.value_numeric,
        p_value_text: valid.value_text,
    });

    if (error) {
        console.error("RPC Error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/lab");
    return { success: true, data: result };
}
