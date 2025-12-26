"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Generate CoA for a sample
 */
export async function generateCoAAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: userData } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!userData) return { success: false, message: "Profile not found" };

    // Get plant_id from user profile or first plant in org
    let plantId = userData.plant_id;
    if (!plantId) {
        const { data: firstPlant } = await supabase
            .from("plants")
            .select("id")
            .eq("organization_id", userData.organization_id)
            .limit(1)
            .single();
        plantId = firstPlant?.id;
    }

    if (!plantId) {
        return { success: false, message: "No plant found. Please create a plant first." };
    }

    const sampleId = formData.get("sample_id") as string;
    if (!sampleId) return { success: false, message: "Sample ID required" };

    // Get sample data
    const { data: sample } = await supabase
        .from("samples")
        .select("code")
        .eq("id", sampleId)
        .eq("organization_id", userData.organization_id)
        .eq("plant_id", userData.plant_id)
        .single();

    // Get analysis results
    const { data: analysis } = await supabase
        .from("lab_analysis")
        .select(`
            *,
            parameter:qa_parameters(name, code, unit)
        `)
        .eq("sample_id", sampleId)
        .eq("organization_id", userData.organization_id)
        .eq("plant_id", userData.plant_id);

    // Generate report number
    const year = new Date().getFullYear();
    const { count } = await supabase
        .from("generated_reports")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id)
        .eq("report_type", "coa");

    const reportNumber = `COA-${year}-${String((count || 0) + 1).padStart(4, "0")}`;

    // Store report
    const { error } = await supabase.from("generated_reports").insert({
        organization_id: userData.organization_id,
        plant_id: userData.plant_id,
        report_type: "coa",
        entity_type: "sample",
        entity_id: sampleId,
        report_number: reportNumber,
        title: `Certificate of Analysis - ${sample?.code}`,
        report_data: { sample, analysis },
        generated_by: user.id,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/reports");
    return { success: true, message: `CoA ${reportNumber} generated`, data: { reportNumber } };
}

/**
 * Generate Production Batch Report
 */
export async function generateBatchReportAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: userData } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!userData) return { success: false, message: "Profile not found" };

    // Get plant_id from user profile or first plant in org
    let plantId = userData.plant_id;
    if (!plantId) {
        const { data: firstPlant } = await supabase
            .from("plants")
            .select("id")
            .eq("organization_id", userData.organization_id)
            .limit(1)
            .single();
        plantId = firstPlant?.id;
    }

    if (!plantId) {
        return { success: false, message: "No plant found. Please create a plant first." };
    }

    const batchId = formData.get("batch_id") as string;
    if (!batchId) return { success: false, message: "Batch ID required" };

    // Get batch data
    const { data: batch } = await supabase
        .from("production_batches")
        .select("batch_number, product_name")
        .eq("id", batchId)
        .eq("organization_id", userData.organization_id)
        .eq("plant_id", userData.plant_id)
        .single();

    // Get full batch report data
    const { data: tanks } = await supabase
        .from("batch_tanks")
        .select("*")
        .eq("batch_id", batchId);

    const { data: ingredients } = await supabase
        .from("batch_ingredients")
        .select(`
            *,
            lot:raw_material_lots(lot_number)
        `)
        .eq("batch_id", batchId);

    const { data: samples } = await supabase
        .from("samples")
        .select("*")
        .eq("production_batch_id", batchId);

    const { data: ncs } = await supabase
        .from("nonconformities")
        .select("*")
        .eq("source_reference", batch?.batch_number);

    // Generate report number
    const year = new Date().getFullYear();
    const { count } = await supabase
        .from("generated_reports")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id)
        .eq("report_type", "batch_report");

    const reportNumber = `BR-${year}-${String((count || 0) + 1).padStart(4, "0")}`;

    // Store report
    const { error } = await supabase.from("generated_reports").insert({
        organization_id: userData.organization_id,
        plant_id: userData.plant_id,
        report_type: "batch_report",
        entity_type: "batch",
        entity_id: batchId,
        report_number: reportNumber,
        title: `Production Report - ${batch?.batch_number}`,
        report_data: { batch, tanks, ingredients, samples, ncs },
        generated_by: user.id,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/reports");
    return { success: true, message: `Report ${reportNumber} generated`, data: { reportNumber } };
}

/**
 * Export data as CSV
 */
export async function exportDataAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: userData } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!userData) return { success: false, message: "Profile not found" };

    const dataType = formData.get("data_type") as string;
    const startDate = formData.get("start_date") as string;
    const endDate = formData.get("end_date") as string;

    let data: any[] = [];
    let filename = "";

    switch (dataType) {
        case "samples":
            const { data: samples } = await supabase
                .from("samples")
                .select("*")
                .eq("organization_id", userData.organization_id)
                .eq("plant_id", userData.plant_id)
                .gte("collected_at", startDate)
                .lte("collected_at", endDate);
            data = samples || [];
            filename = `samples_${startDate}_${endDate}.csv`;
            break;

        case "batches":
            const { data: batches } = await supabase
                .from("production_batches")
                .select("*")
                .eq("organization_id", userData.organization_id)
                .eq("plant_id", userData.plant_id)
                .gte("production_date", startDate)
                .lte("production_date", endDate);
            data = batches || [];
            filename = `batches_${startDate}_${endDate}.csv`;
            break;

        case "ncs":
            const { data: ncs } = await supabase
                .from("nonconformities")
                .select("*")
                .eq("organization_id", userData.organization_id)
                .eq("plant_id", userData.plant_id)
                .gte("detected_date", startDate)
                .lte("detected_date", endDate);
            data = ncs || [];
            filename = `nonconformities_${startDate}_${endDate}.csv`;
            break;

        case "capas":
            const { data: capas } = await supabase
                .from("capa_actions")
                .select("*")
                .gte("created_at", startDate)
                .lte("created_at", endDate);
            data = capas || [];
            filename = `capa_actions_${startDate}_${endDate}.csv`;
            break;

        case "analysis":
            const { data: analysis } = await supabase
                .from("lab_analysis")
                .select("*")
                .eq("organization_id", userData.organization_id)
                .eq("plant_id", userData.plant_id)
                .gte("analyzed_at", startDate)
                .lte("analyzed_at", endDate);
            data = analysis || [];
            filename = `lab_analysis_${startDate}_${endDate}.csv`;
            break;
    }

    // Return data for client-side CSV generation
    return { success: true, data, filename };
}

/**
 * Sign a generated report (21 CFR Part 11 compliance)
 */
export async function signReportAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const reportId = formData.get("report_id") as string;
    const password = formData.get("password") as string;

    if (!reportId || !password) {
        return { success: false, message: "Report ID and password required" };
    }

    // Verify password by attempting to sign in again
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
    });

    if (authError) {
        return { success: false, message: "Invalid password. Signature failed." };
    }

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    // Update report with signature
    const { error: updateError } = await supabase
        .from("generated_reports")
        .update({
            status: "signed",
            signed_by: user.id,
            signed_at: new Date().toISOString(),
        })
        .eq("id", reportId)
        .eq("organization_id", profile.organization_id)
        .eq("plant_id", profile.plant_id);

    if (updateError) {
        return { success: false, message: updateError.message };
    }

    revalidatePath("/reports");
    return { success: true, message: "Report signed successfully" };
}
