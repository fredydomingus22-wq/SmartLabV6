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
        .select("id, equipment_id")
        .eq("production_batch_id", batchId);

    const directIntermediateIds = directIntermediates?.map(i => i.id) || [];
    const discoveredIntermediateIds = [...new Set(allLinks.filter(l => l.source_type === 'intermediate' || l.target_type === 'intermediate').map(l => l.source_type === 'intermediate' ? l.source_id : l.target_id))];
    const finalIntermediateIds = [...new Set([...discoveredIntermediateIds, ...directIntermediateIds])].filter(id => id !== batchId);

    const lotIds = [...new Set(allLinks.filter(l => l.source_type === 'raw_material_lot' || l.source_type === 'raw_material').map(l => l.source_id))];

    // Discovery 3: Equipment Assets (From Traceability Chain)
    const equipmentIds = [...new Set(allLinks.filter(l => l.source_type === 'equipment').map(l => l.source_id))];
    const cipIds = [...new Set(allLinks.filter(l => l.source_type === 'cip_execution').map(l => l.source_id))];

    // --- PHASE 3: Context & Details (Separated for Resilience) ---
    const [
        reportsResult,
        rawMaterialsResult,
        intermediatesResult,
        supervisorResult,
        qaResult,
        specsResult,
        equipmentResult,
        cipResult
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
                id, code, status, equipment_id
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
            .eq("product_id", batch.product_id),
        equipmentIds.length > 0 ? supabase
            .from("equipments")
            .select("id, name, code, equipment_type, status")
            .in("id", equipmentIds) : { data: [] },
        cipIds.length > 0 ? supabase
            .from("cip_executions")
            .select(`
                id, equipment_uid, start_time, validation_status,
                program:cip_programs(name)
            `)
            .in("id", cipIds) : { data: [] }
    ]);

    // FETCH SAMPLES (Explicitly separated to avoid .or() bugs)
    const { data: directSamples } = await supabase
        .from("samples")
        .select(`
            id, code, status, collected_at,
            sample_type:sample_types(name, test_category, code),
            analysis:lab_analysis(
                id, value_numeric, value_text, is_conforming, analyzed_at, analyzed_by, qa_parameter_id, equipment_id,
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
                    id, value_numeric, value_text, is_conforming, analyzed_at, analyzed_by, qa_parameter_id, equipment_id,
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
    const usedEquipmentIdsInLab = [...new Set(samples.flatMap(s => (s.analysis as any[])?.map(a => a.equipment_id) || []))].filter(Boolean);

    let analystsProfiles: any[] = [];
    let labEquipments: any[] = [];

    const enrichmentTasks = [];
    if (analystsIds.length > 0) {
        enrichmentTasks.push(supabase
            .from("user_profiles")
            .select("id, full_name, role")
            .in("id", analystsIds)
            .then(res => analystsProfiles = res.data || []));
    }
    if (usedEquipmentIdsInLab.length > 0) {
        enrichmentTasks.push(supabase
            .from("equipments")
            .select("id, name, code")
            .in("id", usedEquipmentIdsInLab)
            .then(res => labEquipments = res.data || []));
    }
    await Promise.all(enrichmentTasks);

    samples.forEach(s => {
        (s.analysis as any[])?.forEach(ans => {
            ans.analyst = analystsProfiles?.find(p => p.id === ans.analyzed_by) || null;
            ans.equipment = labEquipments?.find(e => e.id === ans.equipment_id) || null;
        });
    });

    // --- PHASE 5: Mapping ---
    const reports = reportsResult.data || [];
    const rawMaterials = rawMaterialsResult.data || [];
    const processIntermediates = intermediatesResult.data || [];
    const supervisor = supervisorResult.data;
    const qa = qaResult.data;
    const specifications = specsResult.data || [];
    const cips = (cipResult as any).data || [];

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

    // 4.1 Manual Enrichment for Intermediate Equipment (Polymorphic: Tank or Equipment)
    const tankIds = processIntermediates
        .map(p => p.equipment_id)
        .filter(id => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)); // Validate only UUIDs

    let tankAssets: any[] = [];
    if (tankIds.length > 0) {
        const [tanksRes, equipRes] = await Promise.all([
            supabase.from("tanks").select("id, code, name").in("id", tankIds),
            supabase.from("equipments").select("id, code, name").in("id", tankIds)
        ]);
        tankAssets = [...(tanksRes.data || []), ...(equipRes.data || [])];
    }

    const tanks = finalIntermediateIds.map(id => {
        const ip = processIntermediates?.find(p => p.id === id);
        const tankAsset = tankAssets.find(t => t.id === ip?.equipment_id);

        // Find last CIP for this tank
        const lastCip = tankAsset ? cips.filter((c: any) => c.equipment_uid === tankAsset.id).sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0] : null;

        return {
            tank: ip ? {
                tank_number: tankAsset?.code || ip.code,
                name: tankAsset?.name || "Unknown Asset",
                status: ip.status,
                last_cip: lastCip ? {
                    program: (lastCip as any).program?.name,
                    date: (lastCip as any).start_time,
                    status: (lastCip as any).validation_status
                } : null
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
