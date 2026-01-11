"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getBatchTraceabilityAction } from "./traceability";
import { mapToEnterpriseReport } from "@/lib/reports/report-dtos";
import { requirePermission } from "@/lib/permissions.server";
import { IntermediateDomainService } from "@/domain/production/intermediate.service";
import { ProductionOrchestratorService } from "@/domain/production/production-orchestrator.service";
import { ProductionOrderDomainService } from "@/domain/production/order.service";
import { PackagingDomainService } from "@/domain/production/packaging.service";
import { SamplingOrchestratorService } from "@/domain/quality/sampling-orchestrator.service";
import { QualityGatekeeperService } from "@/domain/quality/gatekeeper.service";
import { getCurrentUser } from "@/lib/auth";

const CreateOrderSchema = z.object({
    product_id: z.string().uuid(),
    code: z.string().min(3),
    planned_quantity: z.coerce.number().positive(),
    plant_id: z.string().uuid(),
    start_date: z.string().optional(),
});

const PlanBatchSchema = z.object({
    production_order_id: z.string().uuid(),
    shift_id: z.string().uuid(),
    production_line_id: z.string().uuid(), // <-- Added
    planned_date: z.string(),
    batch_code: z.string().min(1, "Código do lote é obrigatório"),
});

const LogEventSchema = z.object({
    production_batch_id: z.string().uuid(),
    event_type: z.enum(['start', 'stop', 'resume', 'waste', 'scrap', 'breakdown', 'maintenance', 'shift_change']),
    reason_code: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});

const CreateIntermediateSchema = z.object({
    production_batch_id: z.string().uuid(),
    code: z.string().min(1), // Tank Name/Code for display
    tank_id: z.string().uuid(), // FK to tanks
    product_id: z.string().uuid().optional(), // Explicit snapshot link
    volume: z.coerce.number().optional(),
    unit: z.string().default("L"),
});

const LinkIngredientSchema = z.object({
    intermediate_product_id: z.string().uuid(),
    raw_material_lot_id: z.string().uuid().optional(),
    raw_material_lot_code: z.string().min(1),
    quantity: z.coerce.number().positive(),
    unit: z.string().min(1),
});

const LinkPackagingSchema = z.object({
    production_batch_id: z.string().uuid(),
    packaging_lot_id: z.string().uuid(),
    quantity_used: z.coerce.number().positive(),
    unit: z.string().min(1).default("un"),
});

const UpdateScrapReworkSchema = z.object({
    production_batch_id: z.string().uuid(),
    scrap_quantity: z.coerce.number().nonnegative(),
    rework_quantity: z.coerce.number().nonnegative(),
});

/**
 * Create Production Order (OP)
 * Delegated to ProductionOrderDomainService for consistency and audit trail.
 */
export async function createProductionOrderAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();
    const profile = await getCurrentUser();

    if (!profile) throw new Error("Profile not found");

    const rawData = {
        product_id: formData.get("product_id"),
        code: formData.get("code") || `OP-${Date.now()}`,
        planned_quantity: formData.get("planned_quantity"),
        plant_id: profile.plant_id,
        start_date: formData.get("start_date") || new Date().toISOString().split('T')[0],
    };

    const validation = CreateOrderSchema.safeParse(rawData);
    if (!validation.success) throw new Error(validation.error.issues[0].message);

    const service = new ProductionOrderDomainService(supabase, {
        organization_id: profile.organization_id!,
        user_id: user.id,
        role: profile.role,
        plant_id: profile.plant_id!,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.createOrder({
        product_id: validation.data.product_id,
        code: validation.data.code,
        planned_quantity: validation.data.planned_quantity,
        plant_id: validation.data.plant_id,
        start_date: validation.data.start_date
    });

    if (!result.success) throw new Error(result.message);

    revalidatePath("/production/orders");
    return { success: true, message: result.message };
}

/**
 * Plan Batch from Order
 */
export async function planBatchFromOrderAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();
    const profile = await getCurrentUser();

    if (!profile) throw new Error("Profile not found");

    const rawData = {
        production_order_id: formData.get("order_id"),
        shift_id: formData.get("shift_id"),
        production_line_id: formData.get("production_line_id"),
        planned_date: formData.get("planned_date") || new Date().toISOString(),
        batch_code: formData.get("batch_code"),
    };

    const validation = PlanBatchSchema.safeParse(rawData);
    if (!validation.success) throw new Error(validation.error.issues[0].message);

    const orchestrator = new ProductionOrchestratorService(supabase, {
        organization_id: profile.organization_id!,
        user_id: user.id,
        role: profile.role,
        plant_id: profile.plant_id!,
        correlation_id: crypto.randomUUID()
    });

    const batch = await orchestrator.planBatchFromOrder(
        validation.data.production_order_id,
        validation.data.shift_id,
        validation.data.planned_date,
        validation.data.batch_code,
        validation.data.production_line_id // <-- Added
    );

    revalidatePath("/production");
    revalidatePath("/production/orders");
    return { success: true, data: batch };
}



/**
 * Create Intermediate Product (Tank/Silo Mapping)
 */
export async function createIntermediateProductAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id, role")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const service = new IntermediateDomainService(supabase, {
        organization_id: profile.organization_id!,
        user_id: user.id,
        role: profile.role,
        plant_id: profile.plant_id!,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.registerIntermediate({
        production_batch_id: formData.get("production_batch_id") as string,
        code: formData.get("code") as string,
        tank_id: formData.get("tank_id") as string,
        volume: Number(formData.get("volume")) || undefined,
        unit: (formData.get("unit") as string) || "L",
        plant_id: profile.plant_id as string
    });

    if (result.success) {
        revalidatePath("/production");
        revalidatePath(`/production/${formData.get("production_batch_id")}`);
    }

    return result;
}

/**
 * Link Raw Material (Ingredient) to Intermediate Product
 * Delegated to IntermediateDomainService for transactional safety and audit.
 */
export async function linkIngredientAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();
    const profile = await getCurrentUser();

    if (!profile) return { success: false, message: "Profile not found" };

    const rawData = {
        intermediate_product_id: formData.get("intermediate_product_id"),
        raw_material_lot_id: formData.get("raw_material_lot_id") || undefined,
        raw_material_lot_code: formData.get("raw_material_lot_code"),
        quantity: formData.get("quantity"),
        unit: formData.get("unit"),
    };

    const validation = LinkIngredientSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const service = new IntermediateDomainService(supabase, {
        organization_id: profile.organization_id!,
        user_id: user.id,
        role: profile.role,
        plant_id: profile.plant_id!,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.linkIngredient({
        intermediateId: validation.data.intermediate_product_id,
        rawMaterialLotId: validation.data.raw_material_lot_id,
        rawMaterialLotCode: validation.data.raw_material_lot_code,
        quantity: validation.data.quantity,
        unit: validation.data.unit
    });

    if (result.success) {
        revalidatePath("/production");
        revalidatePath("/raw-materials");
    }

    return result;
}

/**
 * Update Intermediate Product Status (Finalize/Consume)
 */
export async function updateIntermediateStatusAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id, role")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const intermediate_id = formData.get("intermediate_id") as string;
    const status = formData.get("status") as string;

    const service = new IntermediateDomainService(supabase, {
        organization_id: profile.organization_id!,
        user_id: user.id,
        role: profile.role,
        plant_id: profile.plant_id!,
        correlation_id: crypto.randomUUID()
    });

    if (status === "consumed") {
        const result = await service.consumeIntermediate(intermediate_id);
        if (result.success) {
            revalidatePath("/production");
            revalidatePath(`/production/${formData.get("batch_id") || ''}`);
        }
        return result;
    }

    if (status === "sampling") {
        const result = await service.finalizeProduction(intermediate_id);
        if (result.success) {
            revalidatePath("/production");
            revalidatePath(`/production/${formData.get("batch_id") || ''}`);
        }
        return result;
    }

    // Fallback for other status updates if needed
    const { error } = await supabase
        .from("intermediate_products")
        .update({ status })
        .eq("id", intermediate_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production");
    return { success: true, message: `Intermediate ${status}` };
}

export async function approveIntermediateAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();

    const intermediate_id = formData.get("intermediate_id") as string;
    const password = formData.get("password") as string;
    const batch_id = formData.get("batch_id") as string;

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id, role")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const service = new IntermediateDomainService(supabase, {
        organization_id: profile.organization_id!,
        user_id: user.id,
        role: profile.role,
        plant_id: profile.plant_id!,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.approveIntermediate(intermediate_id, password);
    if (result.success) {
        revalidatePath("/production");
        if (batch_id) revalidatePath(`/production/${batch_id}`);
    }

    return result;
}

/**
 * Start Tank Usage (Discharge)
 */
export async function startUsageAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();

    const intermediate_id = formData.get("intermediate_id") as string;
    const batch_id = formData.get("batch_id") as string;

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id, role")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const service = new IntermediateDomainService(supabase, {
        organization_id: profile.organization_id!,
        user_id: user.id,
        role: profile.role,
        plant_id: profile.plant_id!,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.startUsage(intermediate_id);
    if (result.success) {
        revalidatePath("/production");
        if (batch_id) revalidatePath(`/production/${batch_id}`);
    }

    return result;
}

/**
 * Finalize Production Batch (Move from In Progress to Completed)
 * Used by technicians when physical production is done.
 */
export async function finalizeBatchAction(batch_id: string) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();
    const profile = await getCurrentUser();

    if (!profile) return { success: false, message: "Profile not found" };

    const orchestrator = new ProductionOrchestratorService(supabase, {
        organization_id: profile.organization_id!,
        user_id: user.id,
        role: profile.role,
        plant_id: profile.plant_id!,
        correlation_id: crypto.randomUUID()
    });

    try {
        await orchestrator.finalizeBatch(batch_id);

        revalidatePath("/production");
        revalidatePath(`/production/${batch_id}`);
        return { success: true, message: "Produção finalizada. Aguardando revisão do Manager." };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

/**
 * Link Packaging Lot to Production Batch
 */
/**
 * Link Packaging Lot to Production Batch
 */
export async function linkPackagingLotAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();
    const profile = await getCurrentUser();

    if (!profile) throw new Error("Profile not found");

    const rawData = {
        production_batch_id: formData.get("production_batch_id"),
        packaging_lot_id: formData.get("packaging_lot_id"),
        quantity_used: formData.get("quantity_used"),
        unit: formData.get("unit") || "un",
    };

    const validation = LinkPackagingSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const service = new PackagingDomainService(supabase, {
        organization_id: profile.organization_id!,
        user_id: user.id,
        role: profile.role,
        plant_id: profile.plant_id!,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.linkPackaging({
        batchId: validation.data.production_batch_id,
        packagingMaterialLotId: validation.data.packaging_lot_id,
        quantity: validation.data.quantity_used,
        unit: validation.data.unit
    });

    if (result.success) {
        revalidatePath(`/production/${validation.data.production_batch_id}`);
    }

    return result;
}

/**
 * Release Production Batch (QA Review)
 */
export async function releaseBatchAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();

    const batch_id = formData.get("batch_id") as string;
    const action = formData.get("action") as "release" | "reject";

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id, role")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    // 5. Use Quality Gatekeeper for robust logic (Phase 4 Implementation)
    const gatekeeper = new QualityGatekeeperService(supabase, {
        organization_id: profile.organization_id!,
        user_id: user.id,
        role: profile.role,
        plant_id: profile.plant_id!,
        correlation_id: crypto.randomUUID()
    });

    const password = formData.get("password") as string;
    const reason = formData.get("reason") as string;

    if (action === "release") {
        // Strict release logic via Gatekeeper
        const releaseResult = await gatekeeper.releaseBatch(batch_id, password);
        if (!releaseResult.success) {
            return {
                success: false,
                message: releaseResult.message || "Erro na validação de qualidade.",
                // Return blockers if available to show in UI
                errors: ((releaseResult as any).metadata)?.blockers
            };
        }

        // Audit Snapshot is handled inside Gatekeeper for Releases
    } else {
        // Rejection logic (Simpler, allows manual rejection even if technically compliant)
        // 3. Update the batch (Legacy/Manual Rejection Path)
        const { error } = await supabase
            .from("production_batches")
            .update({
                status: "rejected",
                end_date: new Date().toISOString(),
                qa_approved_by: user.id,
                qa_approved_at: new Date().toISOString()
            })
            .eq("id", batch_id)
            .eq("organization_id", profile.organization_id)
            .eq("plant_id", profile.plant_id);

        if (error) return { success: false, message: error.message };

        // 4. Create Compliance Snapshot (ISO/FSSC Rule) - Kept for Rejection
        try {
            const traceabilityData = await getBatchTraceabilityAction(batch_id);
            if (traceabilityData.success && traceabilityData.data) {
                const enterpriseDTO = mapToEnterpriseReport(traceabilityData.data);

                // Inject audit reason into report metadata
                const reportMetadata = {
                    ...enterpriseDTO,
                    audit: {
                        action: "REJECTION",
                        performed_by: user.id,
                        timestamp: new Date().toISOString(),
                        justification: reason || "Rejection Decision",
                        signed: !!password
                    }
                };

                await supabase.from("generated_reports").insert({
                    organization_id: profile.organization_id!,
                    plant_id: profile.plant_id!,
                    report_type: "REJECTION",
                    entity_type: "batch",
                    entity_id: batch_id,
                    report_number: `BRJ-${enterpriseDTO.header.batchCode}`,
                    title: "Production Batch Rejection Report",
                    report_data: reportMetadata as any,
                    generated_by: user.id,
                    status: "signed",
                    signed_by: user.id,
                    signed_at: new Date().toISOString()
                });
            }
        } catch (snapError) {
            console.error("SNAPSHOT ERROR (Non-blocking):", snapError);
        }
    }

    revalidatePath("/production");
    revalidatePath(`/production/${batch_id}`);
    return { success: true, message: `Lote ${action === "release" ? "Liberado" : "Rejeitado"} com sucesso.` };
}

/**
 * Start Batch Execution (Gatekeeper Pattern)
 */
export async function startBatchExecutionAction(batchId: string) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();
    const profile = await getCurrentUser();
    if (!profile) throw new Error("Profile not found");

    const orchestrator = new ProductionOrchestratorService(supabase, {
        organization_id: profile.organization_id!,
        user_id: user.id,
        role: profile.role,
        plant_id: profile.plant_id!,
        correlation_id: crypto.randomUUID()
    });

    try {
        const batch = await orchestrator.startBatchExecution(batchId);
        revalidatePath("/production");
        revalidatePath(`/production/${batchId}`);
        return { success: true, data: batch };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

/**
 * Log Production Event (Execution Control)
 */
export async function logProductionEventAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();
    const profile = await getCurrentUser();
    if (!profile) throw new Error("Profile not found");

    const rawData = {
        production_batch_id: formData.get("production_batch_id"),
        event_type: formData.get("event_type"),
        reason_code: formData.get("reason_code") || undefined,
        metadata: formData.get("metadata") ? JSON.parse(formData.get("metadata") as string) : {},
    };

    const validation = LogEventSchema.safeParse(rawData);
    if (!validation.success) throw new Error(validation.error.issues[0].message);

    const orchestrator = new ProductionOrchestratorService(supabase, {
        organization_id: profile.organization_id!,
        user_id: user.id,
        role: profile.role,
        plant_id: profile.plant_id!,
        correlation_id: crypto.randomUUID()
    });

    await orchestrator.logExecutionEvent(
        validation.data.production_batch_id,
        validation.data.event_type as any,
        {
            ...validation.data.metadata,
            reason_code: validation.data.reason_code
        }
    );

    revalidatePath("/production");
    revalidatePath(`/production/${validation.data.production_batch_id}`);
    return { success: true, message: `Evento ${validation.data.event_type} registado.` };
}

/**
 * Execution Heartbeat (State-Aware Reminders)
 */
export async function processSamplingHeartbeatAction(batchId: string) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();
    const profile = await getCurrentUser();
    if (!profile) throw new Error("Profile not found");

    const sampling = new SamplingOrchestratorService(supabase, {
        organization_id: profile.organization_id!,
        user_id: user.id,
        role: profile.role,
        plant_id: profile.plant_id!,
        correlation_id: crypto.randomUUID()
    });

    const result = await sampling.processSamplingHeartbeat(batchId);

    if (result.samples_created && result.samples_created > 0) {
        revalidatePath("/production");
        revalidatePath(`/production/${batchId}`);
        revalidatePath("/lab");
    }

    return result;
}

/**
 * Update Scrap and Rework quantities for a batch
 */
export async function updateScrapReworkAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();
    const profile = await getCurrentUser();
    if (!profile) throw new Error("Profile not found");

    const rawData = {
        production_batch_id: formData.get("production_batch_id"),
        scrap_quantity: formData.get("scrap_quantity"),
        rework_quantity: formData.get("rework_quantity"),
    };

    const validation = UpdateScrapReworkSchema.safeParse(rawData);
    if (!validation.success) throw new Error(validation.error.issues[0].message);

    const { error } = await supabase
        .from("production_batches")
        .update({
            scrap_quantity: validation.data.scrap_quantity,
            rework_quantity: validation.data.rework_quantity,
        })
        .eq("id", validation.data.production_batch_id)
        .eq("organization_id", profile.organization_id);

    if (error) throw new Error(error.message);

    // Also log an event for audit
    const orchestrator = new ProductionOrchestratorService(supabase, {
        organization_id: profile.organization_id!,
        user_id: user.id,
        role: profile.role,
        plant_id: profile.plant_id!,
        correlation_id: crypto.randomUUID()
    });

    await orchestrator.logExecutionEvent(
        validation.data.production_batch_id,
        'waste',
        {
            scrap_quantity: validation.data.scrap_quantity,
            rework_quantity: validation.data.rework_quantity,
            message: "KPIs de produção atualizados."
        }
    );

    revalidatePath(`/production/${validation.data.production_batch_id}`);
    return { success: true, message: "KPIs de produção atualizados com sucesso." };
}
