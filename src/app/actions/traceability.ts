"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

/**
 * Aggregates all data required for a Batch Traceability Dossier.
 * This includes ingredients, process tanks, lab results, and audit trails.
 * Features:
 * 1. Deep Recursion: Follows the chain back to infinity (while loop).
 * 2. Parallelism: Optimized data fetching.
 */
export async function getBatchTraceabilityAction(batchId: string) {
    // 0. Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!batchId || !uuidRegex.test(batchId)) {
        return { success: false, message: `Invalid Batch ID format: ${batchId}` };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();
    if (!profile) return { success: false, message: "Profile not found" };

    // --- PHASE 1: Initial Batch Data ---
    const { data: batch, error: batchError } = await supabase
        .from("production_batches")
        .select(`
            *,
            product:products(name, sku),
            line:production_lines(name),
            plant:plants(name)
        `)
        .eq("id", batchId)
        .single();

    if (batchError || !batch) {
        return { success: false, message: batchError?.message || "Batch not found" };
    }

    // --- PHASE 2: Deep Genealogy (Recursive Discovery) ---
    // Discovery 1: Genealogy Chain (Traceability Table)
    let allLinks: any[] = [];
    let targetsToScan = [batchId];
    let targetTypeToScan: 'batch' | 'intermediate' = 'batch';
    let processedIds = new Set<string>();

    while (targetsToScan.length > 0) {
        const { data: links } = await supabase
            .from("traceability_chain")
            .select(`source_type, source_id, quantity, unit, target_type, target_id`)
            .in("target_id", targetsToScan)
            .eq("target_type", targetTypeToScan);

        if (!links || links.length === 0) break;
        allLinks = [...allLinks, ...links];

        const newIntermediates = links
            .filter(l => l.source_type === 'intermediate' && !processedIds.has(l.source_id))
            .map(l => l.source_id);

        targetsToScan.forEach(id => processedIds.add(id));
        targetsToScan = [...new Set(newIntermediates)];
        targetTypeToScan = 'intermediate';

        if (processedIds.size > 20) break;
    }

    // Discovery 2: Direct Intermediates (Linked via production_batch_id)
    const { data: directIntermediates } = await supabase
        .from("intermediate_products")
        .select("id")
        .eq("production_batch_id", batchId);

    const directIntermediateIds = directIntermediates?.map(i => i.id) || [];
    const discoveredIntermediateIds = [...new Set(allLinks.filter(l => l.source_type === 'intermediate' || l.target_type === 'intermediate').map(l => l.source_type === 'intermediate' ? l.source_id : l.target_id))];
    const finalIntermediateIds = [...new Set([...discoveredIntermediateIds, ...directIntermediateIds])].filter(id => id !== batchId);

    const lotIds = [...new Set(allLinks.filter(l => l.source_type === 'raw_material_lot' || l.source_type === 'raw_material').map(l => l.source_id))];

    // --- PHASE 3: Context & Details (Separated for Resilience) ---
    const [
        reportsResult,
        rawMaterialsResult,
        intermediatesResult,
        supervisorResult,
        qaResult,
        specsResult
    ] = await Promise.all([
        supabase
            .from("generated_reports")
            .select("report_number, title, created_at, status, signed_at")
            .eq("entity_id", batchId)
            .eq("entity_type", "batch"),
        supabase
            .from("raw_material_lots")
            .select(`
                id, lot_code, expiry_date, status,
                raw_material:raw_materials(name),
                supplier:suppliers(name)
            `).in("id", lotIds),
        supabase
            .from("intermediate_products")
            .select(`
                id, code, status,
                equipment:equipments(name, code)
            `).in("id", finalIntermediateIds),
        batch.supervisor_approved_by ? supabase
            .from("user_profiles")
            .select("full_name, role")
            .eq("id", batch.supervisor_approved_by)
            .single() : { data: null },
        batch.qa_approved_by ? supabase
            .from("user_profiles")
            .select("full_name, role")
            .eq("id", batch.qa_approved_by)
            .single() : { data: null },
        supabase
            .from("product_specifications")
            .select(`
                *,
                parameter:qa_parameters(id, name, unit, code)
            `)
            .eq("product_id", batch.product_id)
    ]);

    // FETCH SAMPLES (Explicitly separated to avoid .or() bugs)
    const { data: directSamples } = await supabase
        .from("samples")
        .select(`
            id, code, status, collected_at,
            sample_type:sample_types(name, test_category, code),
            analysis:lab_analysis(
                id, value_numeric, value_text, is_conforming, analyzed_at, analyzed_by, qa_parameter_id,
                parameter:qa_parameters(name, unit, code)
            )
        `)
        .eq("production_batch_id", batchId);

    let indirectSamples: any[] = [];
    if (finalIntermediateIds.length > 0) {
        const { data: indRes, error: indError } = await supabase
            .from("samples")
            .select(`
                id, code, status, collected_at,
                sample_type:sample_types(name, test_category, code),
                analysis:lab_analysis(
                    id, value_numeric, value_text, is_conforming, analyzed_at, analyzed_by, qa_parameter_id,
                    parameter:qa_parameters(name, unit, code)
                )
            `)
            .in("intermediate_product_id", finalIntermediateIds);
        indirectSamples = indRes || [];
    }

    // Merge and deduplicate samples by ID
    const mergedSamples = [...(directSamples || []), ...indirectSamples];
    const samples = Array.from(new Map(mergedSamples.map(s => [s.id, s])).values());

    // --- PHASE 4: Enrichment (Non-joinable relations) ---
    const sampleIds = samples.map(s => s.id);
    if (sampleIds.length > 0) {
        const { data: insights } = await supabase
            .from("ai_insights")
            .select("status, message, confidence, entity_id")
            .in("entity_id", sampleIds)
            .eq("entity_type", "sample");

        // Merge insights back into samples
        samples.forEach(s => {
            s.insights = insights?.filter(i => i.entity_id === s.id) || [];
        });
    }

    // Merge analyst info (Manual fetch to avoid PostgREST joins issues for ambiguous FKs)
    const analystsIds = [...new Set(samples.flatMap(s => (s.analysis as any[])?.map(a => a.analyzed_by) || []))].filter(Boolean);
    if (analystsIds.length > 0) {
        const { data: analystsProfiles } = await supabase
            .from("user_profiles")
            .select("id, full_name, role")
            .in("id", analystsIds);

        samples.forEach(s => {
            (s.analysis as any[])?.forEach(ans => {
                ans.analyst = analystsProfiles?.find(p => p.id === ans.analyzed_by) || null;
            });
        });
    }

    // --- PHASE 5: Mapping ---
    const reports = reportsResult.data || [];
    const rawMaterials = rawMaterialsResult.data || [];
    const processIntermediates = intermediatesResult.data || [];
    const supervisor = supervisorResult.data;
    const qa = qaResult.data;
    const specifications = specsResult.data || [];

    const batchWithProfiles = { ...batch, supervisor, qa, specifications };

    const ingredients = allLinks
        ?.filter(l => l.source_type === 'raw_material_lot' || l.source_type === 'raw_material')
        .map(link => {
            const lot = rawMaterials?.find(rm => rm.id === link.source_id);
            return {
                quantity: link.quantity,
                lot: lot ? {
                    lot_number: lot.lot_code,
                    expiry_date: lot.expiry_date,
                    status: lot.status,
                    supplier: lot.supplier
                } : null
            };
        }) || [];

    const tanks = finalIntermediateIds.map(id => {
        const ip = processIntermediates?.find(p => p.id === id);
        return {
            tank: ip ? {
                tank_number: (Array.isArray(ip.equipment) ? (ip.equipment as any)[0]?.code : (ip.equipment as any)?.code) || ip.code,
                status: ip.status
            } : null
        };
    }) || [];

    return {
        success: true,
        data: {
            batch: batchWithProfiles,
            ingredients,
            tanks,
            samples,
            reports
        }
    };
}
