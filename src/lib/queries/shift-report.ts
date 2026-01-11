import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { generateBatchObservation } from "@/lib/openai";

export interface ShiftReportData {
    shiftInfo: {
        date: string;
        shift: string;
        startTime: string;
        endTime: string;
        queryStartDate: string;
        queryEndDate: string;
    };
    production: {
        linesActive: number;
        batchesStarted: number;
        batchesCompleted: number;
        totalQuantityProduced: number;
        // Detailed batch cards for the report
        activeBatches: {
            batchCode: string;
            productName: string;
            status: string;
            tanksPrepared: number;
            samplesAnalyzed: number;
            conformityRate: number;
            observations: string; // AI generated
            oosBreakdown: { parameter: string; count: number }[];
        }[];
    };
    tanks: {
        released: number;
        blocked: number;
        inProgress: number;
    };
    quality: {
        samplesCollected: number;
        samplesAnalyzed: number;
        oosCount: number;
        conformityRate: number;
        batchStats: {
            batchCode: string;
            productName: string;
            samplesAnalyzed: number;
            oosCount: number;
            conformity: number;
        }[];
    };
    cip: {
        cyclesCompleted: number;
        equipmentCleaned: number;
        cyclesFailed: number;
    };
    blocks: {
        palletsBlocked: number;
        ncsRaised: number;
    };
    comments: string[];
}

/**
 * Get shift report data for a specific date and shift ID
 */
export async function getShiftReportData(
    date: string,
    shiftId: string
): Promise<{ data: ShiftReportData | null; error: string | null }> {
    const supabase = await createClient();
    const user = await getSafeUser();

    if (!shiftId) {
        return { data: null, error: "Selecione um turno para ver o relatório." };
    }

    // 1. Get shift details
    const { data: shiftData, error: shiftError } = await supabase
        .from("shifts")
        .select("name, start_time, end_time")
        .eq("id", shiftId)
        .single();

    if (shiftError || !shiftData) {
        console.error("Shift fetch error:", shiftError);
        return { data: null, error: "Turno não encontrado." };
    }

    const startDateTime = `${date}T${shiftData.start_time}`;

    // Handle night shift crossing midnight (start > end)
    let endDateTime: string;
    if (shiftData.start_time > shiftData.end_time) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        endDateTime = `${nextDay.toISOString().split("T")[0]}T${shiftData.end_time}`;
    } else {
        endDateTime = `${date}T${shiftData.end_time}`;
    }

    try {
        // 1. Production Lines & Batches (Active during shift)
        // Active means: start_date <= shiftEnd AND (end_date >= shiftStart OR end_date is null)
        const { data: batches } = await supabase
            .from("production_batches")
            .select(`
                id, code, status, planned_quantity, actual_quantity, start_date, end_date,
                product:products(name),
                production_line:production_lines(name)
            `)
            .eq("organization_id", user.organization_id)
            .lte("start_date", endDateTime)
            .or(`end_date.gte.${startDateTime},end_date.is.null`);

        // Calculate specific metrics from the active set
        const batchesStarted = batches?.filter(b => b.start_date >= startDateTime).length || 0;

        const batchesCompleted = batches?.filter(b =>
            (b.status === "completed" || b.status === "released") &&
            (b.end_date ? (b.end_date >= startDateTime && b.end_date <= endDateTime) : false)
        ).length || 0;

        // Active lines = lines used by any batch active in this window
        const linesActive = new Set(batches?.map(b => (b.production_line as any)?.name).filter(Boolean)).size;

        // Total Quantity of batches COMPLETED in this shift
        const totalQuantity = batches?.filter(b =>
            (b.status === "completed" || b.status === "released") &&
            (b.end_date ? (b.end_date >= startDateTime && b.end_date <= endDateTime) : false)
        ).reduce((acc, b) => acc + (b.actual_quantity || 0), 0) || 0;

        // --- NEW: Detailed Active Batches Analysis ---
        const activeBatchesDetails = await Promise.all((batches || []).map(async (batch: any) => {
            // A. Get Tanks (Intermediate Products) for this batch
            const { count: tanksCount } = await supabase
                .from("intermediate_products")
                .select("id", { count: "exact", head: true })
                .eq("production_batch_id", batch.id);

            // B. Get Samples & OOS Breakdown
            const { data: batchSamples } = await supabase
                .from("samples")
                .select("id, status")
                .eq("production_batch_id", batch.id)
                .gte("collected_at", startDateTime)
                .lte("collected_at", endDateTime);

            const samplesAnalyzed = batchSamples?.filter(s =>
                ["in_analysis", "approved", "rejected", "reviewed", "validated"].includes(s.status)
            ).length || 0;

            let oosCount = 0;
            let oosBreakdown: { parameter: string; count: number }[] = [];

            if ((batchSamples?.length ?? 0) > 0) {
                const sampleIds = batchSamples!.map(s => s.id);
                const { data: analyses } = await supabase
                    .from("lab_analysis")
                    .select("is_conforming, parameter:analysis_parameters(name)")
                    .in("sample_id", sampleIds)
                    .eq("is_conforming", false);

                oosCount = analyses?.length || 0;

                // Group OOS by parameter
                const oosMap = new Map<string, number>();
                const uniqueOOSSampleIds = new Set<string>();

                analyses?.forEach((a: any) => {
                    const paramName = a.parameter?.name || "Desconhecido";
                    oosMap.set(paramName, (oosMap.get(paramName) || 0) + 1);
                    uniqueOOSSampleIds.add(a.sample_id);
                });
                oosBreakdown = Array.from(oosMap.entries()).map(([parameter, count]) => ({ parameter, count }));

                // Conformity Update: Based on unique samples, not total defects
                const oosSampleCount = uniqueOOSSampleIds.size;
                const calculatedConformity = samplesAnalyzed > 0
                    ? ((samplesAnalyzed - oosSampleCount) / samplesAnalyzed) * 100
                    : 100;

                return {
                    batchCode: batch.code,
                    productName: batch.product?.name || "N/A",
                    status: batch.status,
                    tanksPrepared: tanksCount || 0,
                    samplesAnalyzed,
                    conformityRate: Math.round(calculatedConformity * 10) / 10,
                    observations: await (async () => {
                        // C. Generate AI Observation (Re-integrated inside return to use updated variables if needed, strictly redundant here but cleaner for flow)

                        // Fetch NCs count for this batch in this shift range? Or just generally for the batch?
                        // Generally for the batch is safer for context, but let's stick to shift reporting constraints if possible.
                        // For now, let's fetch ALL NCs linked to this batch to be comprehensive about "Corrective Actions" context.
                        const { count: ncsCount } = await supabase
                            .from("nonconformities")
                            .select("id", { count: "exact", head: true })
                            .eq("production_batch_id", batch.id);

                        // Blocked Count: If batch is blocked, count is 1. If we had pallet data, we'd use it.
                        // Also check for intermediate products blocked linked to this batch.
                        const { count: blockedTanksCount } = await supabase
                            .from("intermediate_products")
                            .select("id", { count: "exact", head: true })
                            .eq("production_batch_id", batch.id)
                            .eq("status", "blocked");

                        const batchBlockedCount = batch.status === 'blocked' ? 1 : 0;
                        const totalBlocked = batchBlockedCount + (blockedTanksCount || 0);

                        let observation = "Sem dados suficientes para análise.";
                        if (samplesAnalyzed > 0 || (tanksCount ?? 0) > 0 || (ncsCount || 0) > 0) {
                            return await generateBatchObservation({
                                productName: batch.product?.name || "Produto",
                                batchCode: batch.code,
                                stats: {
                                    samplesAnalyzed,
                                    oosCount,
                                    conformityRate: Math.round(calculatedConformity * 10) / 10,
                                    tanksPrepared: tanksCount || 0,
                                    linesActive: 1,
                                    activeTimeCheck: true,
                                    oosBreakdown,
                                    ncsRaised: ncsCount || 0,
                                    blockedCount: totalBlocked
                                }
                            });
                        } else {
                            return "Lote em processo. Sem amostras analisadas neste turno.";
                        }
                    })(),
                    oosBreakdown
                };
            }

            // Original logic for when no samples are analyzed
            let observation = "Sem dados suficientes para análise.";
            if (samplesAnalyzed > 0 || (tanksCount ?? 0) > 0) {
                observation = await generateBatchObservation({
                    productName: batch.product?.name || "Produto",
                    batchCode: batch.code,
                    stats: {
                        samplesAnalyzed,
                        oosCount,
                        conformityRate: 100, // Default if no OOS analysis
                        tanksPrepared: tanksCount || 0,
                        linesActive: 1,
                        activeTimeCheck: true
                    }
                });
            } else {
                observation = "Lote em processo. Sem amostras analisadas neste turno.";
            }

            return {
                batchCode: batch.code,
                productName: batch.product?.name || "N/A",
                status: batch.status,
                tanksPrepared: tanksCount || 0,
                samplesAnalyzed,
                conformityRate: 100, // Default if no samples analyzed
                observations: observation,
                oosBreakdown
            };
        }));


        // 2. Tanks (Intermediate Products) Global Stats
        const { data: intermediates } = await supabase
            .from("intermediate_products")
            .select("id, status")
            .eq("organization_id", user.organization_id)
            .gte("created_at", startDateTime)
            .lte("created_at", endDateTime);

        const tanksReleased = intermediates?.filter(i => i.status === "released" || i.status === "approved").length || 0;
        const tanksBlocked = intermediates?.filter(i => i.status === "blocked").length || 0;
        const tanksInProgress = intermediates?.filter(i => i.status === "in_progress" || i.status === "pending").length || 0;

        // 3. Samples & Quality Global Stats
        const { data: samples } = await supabase
            .from("samples")
            .select(`
                id, code, status, production_batch_id,
                batch:production_batches(code, product:products(name))
            `)
            .eq("organization_id", user.organization_id)
            .gte("collected_at", startDateTime)
            .lte("collected_at", endDateTime);

        const samplesCollected = samples?.length || 0;
        const samplesAnalyzed = samples?.filter(s =>
            ["in_analysis", "approved", "rejected", "reviewed", "validated"].includes(s.status)
        ).length || 0;

        // Get analysis results for OOS Global
        const sampleIds = samples?.map(s => s.id) || [];
        let oosCount = 0; // This remains Total Parameter Failures
        let oosSampleCountGlobal = 0;
        let batchStats: ShiftReportData["quality"]["batchStats"] = [];

        if (sampleIds.length > 0) {
            const { data: analyses } = await supabase
                .from("lab_analysis")
                .select("id, sample_id, is_conforming")
                .in("sample_id", sampleIds);

            oosCount = analyses?.filter(a => a.is_conforming === false).length || 0;
            const globalOOSSamples = new Set(analyses?.filter(a => a.is_conforming === false).map(a => a.sample_id));
            oosSampleCountGlobal = globalOOSSamples.size;

            // Group by batch (Legacy stats view)
            const batchMap = new Map<string, { samples: number; oosParameters: number; oosSamples: number; productName: string }>();
            for (const sample of samples || []) {
                const batchCode = (sample.batch as any)?.code || "No Batch";
                const productName = (sample.batch as any)?.product?.name || "-";
                // Initialize if missing
                if (!batchMap.has(batchCode)) {
                    batchMap.set(batchCode, { samples: 0, oosParameters: 0, oosSamples: 0, productName });
                }
                const current = batchMap.get(batchCode)!;
                current.samples++;

                // Check specific analyses for this sample
                const sampleAnalyses = analyses?.filter(a => a.sample_id === sample.id);
                const sampleFailures = sampleAnalyses?.filter(a => a.is_conforming === false).length || 0;

                if (sampleFailures > 0) {
                    current.oosParameters += sampleFailures;
                    current.oosSamples += 1;
                }
            }

            batchStats = Array.from(batchMap.entries()).map(([batchCode, stats]) => ({
                batchCode,
                productName: stats.productName,
                samplesAnalyzed: stats.samples,
                oosCount: stats.oosParameters,
                conformity: stats.samples > 0 ? ((stats.samples - stats.oosSamples) / stats.samples) * 100 : 100,
            }));
        }

        const conformityRate = samplesAnalyzed > 0
            ? ((samplesAnalyzed - oosSampleCountGlobal) / samplesAnalyzed) * 100
            : 100;

        // 4. CIP Cycles
        const { data: cipCycles } = await supabase
            .from("cip_executions")
            .select("id, status, equipment_uid")
            .eq("organization_id", user.organization_id)
            .gte("start_time", startDateTime)
            .lte("start_time", endDateTime);

        const cyclesCompleted = cipCycles?.filter(c => c.status === "completed").length || 0;
        const cyclesFailed = cipCycles?.filter(c => c.status === "failed").length || 0;
        const equipmentCleaned = new Set(cipCycles?.filter(c => c.status === "completed").map(c => c.equipment_uid)).size;

        // 5. Blocks & NCs
        const { data: ncs } = await supabase
            .from("nonconformities")
            .select("id")
            .eq("organization_id", user.organization_id)
            .gte("detected_date", date)
            .lte("detected_date", date);

        const { data: palletBlocks } = await supabase
            .from("production_batches")
            .select("id")
            .eq("organization_id", user.organization_id)
            .eq("status", "blocked")
            .gte("updated_at", startDateTime)
            .lte("updated_at", endDateTime);

        // 6. Comments
        const comments: string[] = [];

        return {
            data: {
                shiftInfo: {
                    date,
                    shift: shiftData.name,
                    startTime: shiftData.start_time,
                    endTime: shiftData.end_time,
                    queryStartDate: startDateTime,
                    queryEndDate: endDateTime,
                },
                production: {
                    linesActive,
                    batchesStarted,
                    batchesCompleted,
                    totalQuantityProduced: totalQuantity,
                    activeBatches: activeBatchesDetails, // Includes AI observations
                },
                tanks: {
                    released: tanksReleased,
                    blocked: tanksBlocked,
                    inProgress: tanksInProgress,
                },
                quality: {
                    samplesCollected,
                    samplesAnalyzed,
                    oosCount,
                    conformityRate: Math.round(conformityRate * 10) / 10,
                    batchStats,
                },
                cip: {
                    cyclesCompleted,
                    equipmentCleaned,
                    cyclesFailed,

                },
                blocks: {
                    palletsBlocked: palletBlocks?.length || 0,
                    ncsRaised: ncs?.length || 0,
                },
                comments,
            },
            error: null,
        };
    } catch (err: any) {
        console.error("Shift report error:", err);
        return { data: null, error: err.message };
    }
}
