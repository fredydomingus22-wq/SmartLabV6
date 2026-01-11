import { createClient } from "@/lib/supabase/client"; // To be updated to server client in actions
import { SupabaseClient } from "@supabase/supabase-js";

export type LotStatus = 'quarantine' | 'released' | 'rejected' | 'depleted';

export interface ReceiveLotCommand {
    raw_material_id: string;
    lot_code: string;
    quantity: number;
    unit: string;
    supplier_id?: string;
    expiry_date?: string;
    production_date?: string;
    certificate_number?: string;
    plant_id: string;
    user_id: string;
}

export interface EvaluateLotCommand {
    lot_id: string;
    status: 'approved' | 'rejected';
    notes?: string;
    user_id: string;
}

export interface ConsumeFreeCommand {
    lot_id: string;
    quantity: number;
    reason: string;
    user_id: string;
}

export interface ConsumeForProductionCommand {
    lot_id: string;
    quantity: number;
    production_order_id: string; // Link to Production Order
    production_batch_id?: string; // Optional direct link to batch
    user_id: string;
}

export class MaterialsDomainService {
    constructor(private supabase: SupabaseClient) { }

    /**
     * RF-MAT-002: Receive Lot
     * Starts in 'quarantine' status by default.
     */
    async receiveLot(cmd: ReceiveLotCommand) {
        // Validation logic here

        return this.supabase.from("raw_material_lots").insert({
            raw_material_id: cmd.raw_material_id,
            lot_code: cmd.lot_code,
            quantity_received: cmd.quantity,
            quantity_remaining: cmd.quantity,
            unit: cmd.unit,
            supplier_id: cmd.supplier_id,
            expiry_date: cmd.expiry_date,
            production_date: cmd.production_date,
            certificate_number: cmd.certificate_number,
            plant_id: cmd.plant_id,
            status: 'quarantine', // Enforce Quarantine
            created_by: cmd.user_id
        }).select().single();
    }

    /**
     * RF-MES-005: QC Evaluation
     */
    async evaluateLot(cmd: EvaluateLotCommand) {
        // Check current status
        const { data: lot } = await this.supabase.from("raw_material_lots").select("status").eq("id", cmd.lot_id).single();
        if (!lot) throw new Error("Lot not found");

        const newStatus = cmd.status === 'approved' ? 'approved' : 'rejected';

        // Audit Log implicitly handled if we use a specific table or triggers, 
        // but explicit audit call should be done in the Action layer or here if we inject AuditService.

        return this.supabase.from("raw_material_lots").update({
            status: newStatus,
            qc_notes: cmd.notes,
            qc_date: new Date().toISOString(),
            qc_by: cmd.user_id
        }).eq("id", cmd.lot_id);
    }

    /**
     * RF-MAT-002: Traceability - Usage in Production
     */
    async consumeForProduction(cmd: ConsumeForProductionCommand) {
        // 1. Check Lot Status (Must be Approved)
        const { data: lot } = await this.supabase.from("raw_material_lots").select("status, quantity_remaining").eq("id", cmd.lot_id).single();

        if (!lot) {
            throw new Error(`Lot ${cmd.lot_id} not found`);
        }

        if (lot.status !== 'approved') {
            throw new Error(`Lot ${cmd.lot_id} is not approved for use (current: ${lot.status})`);
        }

        if (lot.quantity_remaining < cmd.quantity) {
            throw new Error(`Insufficient stock. Available: ${lot.quantity_remaining}, Requested: ${cmd.quantity}`);
        }

        // 2. Decrement Stock (Atomic) & Create Consumption Record
        // Using v2 RPC which handles both atomic update and insertion into material_consumptions
        const { data: consumptionId, error } = await this.supabase.rpc('consume_material_lot_v2', {
            p_lot_id: cmd.lot_id,
            p_quantity: cmd.quantity,
            p_production_order_id: cmd.production_order_id,
            p_production_batch_id: cmd.production_batch_id,
            p_user_id: cmd.user_id,
            p_reason: 'Production', // Default reason
            p_notes: null
        });

        if (error) throw error;

        return { data: consumptionId, error: null };
    }

    /**
     * RF-MAT-001: Supplier Performance
     * Returns a score (0-100) based on rejection rate.
     */
    async getSupplierPerformance(supplierId: string): Promise<number> {
        const { count: totalLots } = await this.supabase
            .from("raw_material_lots")
            .select("*", { count: 'exact', head: true })
            .eq("supplier_id", supplierId);

        if (!totalLots || totalLots === 0) return 100; // New supplier starts perfect

        const { count: rejectedLots } = await this.supabase
            .from("raw_material_lots")
            .select("*", { count: 'exact', head: true })
            .eq("supplier_id", supplierId)
            .eq("status", "rejected");

        const rejectionRate = (rejectedLots || 0) / totalLots;

        // Simple linear penalty: 100% rejection = 0 score. 0% rejection = 100 score.
        return Math.round((1 - rejectionRate) * 100);
    }

    /**
     * Reagent Management (Chemicals)
     */
    async receiveReagent(cmd: {
        reagent_id: string;
        quantity: number;
        batch_number: string;
        expiry_date?: string | null;
        supplier?: string | null;
        notes?: string | null;
        user_id: string;
        plant_id: string;
        organization_id: string;
        unit: string;
    }) {
        // Create Batch
        const { data: batch, error: batchError } = await this.supabase
            .from("reagent_batches")
            .insert({
                organization_id: cmd.organization_id,
                plant_id: cmd.plant_id,
                reagent_id: cmd.reagent_id,
                batch_number: cmd.batch_number,
                initial_quantity: cmd.quantity,
                current_quantity: cmd.quantity,
                unit: cmd.unit,
                expiry_date: cmd.expiry_date || null,
                supplier: cmd.supplier || null,
                status: "active",
            })
            .select("id")
            .single();

        if (batchError) throw batchError;

        // Log Movement
        const { error: movementError } = await this.supabase.from("reagent_movements").insert({
            organization_id: cmd.organization_id,
            plant_id: cmd.plant_id,
            reagent_id: cmd.reagent_id,
            reagent_batch_id: batch.id,
            movement_type: "in",
            quantity: cmd.quantity,
            batch_number: cmd.batch_number,
            expiry_date: cmd.expiry_date || null,
            external_supplier: cmd.supplier || null,
            user_id: cmd.user_id,
            purpose: "Purchase/Resupply",
            notes: cmd.notes || "Manual Receipt"
        });

        if (movementError) throw movementError;

        return batch;
    }

    async consumeReagent(cmd: {
        reagent_id: string;
        quantity: number;
        destination?: string | null;
        purpose?: string | null;
        requested_by?: string | null;
        notes?: string | null;
        user_id: string;
    }) {
        // Get active batches (FEFO)
        const { data: batches, error: batchError } = await this.supabase
            .from("reagent_batches")
            .select("id, batch_number, current_quantity, organization_id, plant_id")
            .eq("reagent_id", cmd.reagent_id)
            .eq("status", "active")
            .gt("current_quantity", 0)
            .order("expiry_date", { ascending: true, nullsFirst: false })
            .order("received_date", { ascending: true });

        if (batchError) throw batchError;

        const totalAvailable = (batches || []).reduce((sum, b) => sum + Number(b.current_quantity), 0);
        if (totalAvailable < cmd.quantity) {
            throw new Error(`Insufficient stock. Available: ${totalAvailable}, Requested: ${cmd.quantity}`);
        }

        let remainingToConsume = cmd.quantity;
        const consumedBatches: string[] = [];
        let orgId = "";
        let plantId = "";

        for (const batch of batches || []) {
            if (remainingToConsume <= 0) break;

            orgId = batch.organization_id;
            plantId = batch.plant_id;

            const available = Number(batch.current_quantity);
            const toConsume = Math.min(available, remainingToConsume);

            const newQuantity = available - toConsume;
            const newStatus = newQuantity <= 0 ? "depleted" : "active";

            await this.supabase
                .from("reagent_batches")
                .update({ current_quantity: newQuantity, status: newStatus })
                .eq("id", batch.id);

            consumedBatches.push(`${batch.batch_number}(${toConsume})`);
            remainingToConsume -= toConsume;
        }

        // Log Movement
        await this.supabase.from("reagent_movements").insert({
            organization_id: orgId, // Assuming all batches same org
            plant_id: plantId,
            reagent_id: cmd.reagent_id,
            // reagent_batch_id: null, // Hard to link single batch for multi-batch consume. Schema allows null?
            movement_type: "out",
            quantity: cmd.quantity,
            destination: cmd.destination,
            purpose: cmd.purpose,
            requested_by: cmd.requested_by,
            user_id: cmd.user_id,
            notes: `${cmd.notes || "Manual Consumption"} | Batches: ${consumedBatches.join(", ")}`
        });
    }
    /**
     * Packaging Management
     */
    async createPackagingLot(cmd: {
        packaging_material_id: string;
        lot_code: string;
        quantity: number;
        received_at?: string;
        expiry_date?: string;
        plant_id: string;
        organization_id: string;
        user_id: string;
    }) {
        // Create Lot
        return this.supabase.from("packaging_lots").insert({
            organization_id: cmd.organization_id,
            plant_id: cmd.plant_id,
            packaging_material_id: cmd.packaging_material_id,
            lot_code: cmd.lot_code,
            quantity_initial: cmd.quantity,
            quantity_current: cmd.quantity,
            received_at: cmd.received_at || new Date().toISOString(),
            expiry_date: cmd.expiry_date || null,
            status: 'active',
            created_by: cmd.user_id
        });
    }

    async consumePackaging(cmd: {
        packaging_lot_id: string;
        quantity: number;
        production_batch_id: string;
        unit?: string;
        user_id: string;
        organization_id: string;
        plant_id: string;
    }) {
        const { error } = await this.supabase.rpc('consume_packaging_lot', {
            p_lot_id: cmd.packaging_lot_id,
            p_quantity: cmd.quantity,
            p_production_batch_id: cmd.production_batch_id,
            p_user_id: cmd.user_id,
            p_unit: cmd.unit || 'units'
        });

        if (error) throw new Error(`Packaging Consumption Failed: ${error.message}`);
    }
}
