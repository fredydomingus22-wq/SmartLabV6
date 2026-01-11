import { SupabaseClient } from "@supabase/supabase-js";
import { BaseDomainService } from "../shared/base.service";
import { DomainResponse } from "../shared/industrial.context";

export interface LinkPackagingDTO {
    batchId: string;
    packagingMaterialLotId: string;
    quantity: number;
    unit: string;
}

/**
 * PackagingDomainService
 * 
 * Manages packaging lot linkage to production batches.
 * Handles inventory debit with audit trail.
 */
export class PackagingDomainService extends BaseDomainService {

    /**
     * Links a packaging lot to a production batch.
     * Debits inventory from the source lot.
     */
    async linkPackaging(dto: LinkPackagingDTO): Promise<DomainResponse> {
        this.enforceRole(['production_operator', 'admin', 'system_owner']);

        try {
            // 1. Fetch batch context
            const { data: batch, error: batchError } = await this.supabase
                .from("production_batches")
                .select("id, code, status, organization_id, plant_id")
                .eq("id", dto.batchId)
                .single();

            if (batchError || !batch) {
                return this.failure("Lote de produção não encontrado.");
            }

            // 2. Validate batch status (can only link packaging when in_progress or completed)
            if (!['in_progress', 'completed', 'qa_hold'].includes(batch.status)) {
                return this.failure(`BLOQUEIO: Não é possível adicionar embalagens a um lote com estado '${batch.status}'.`);
            }

            // 3. Fetch packaging lot and validate quantity
            const { data: packLot, error: lotError } = await this.supabase
                .from("packaging_material_lots")
                .select("id, code, quantity_remaining, unit, material_name")
                .eq("id", dto.packagingMaterialLotId)
                .single();

            if (lotError || !packLot) {
                return this.failure("Lote de embalagem não encontrado.");
            }

            if (packLot.quantity_remaining < dto.quantity) {
                return this.failure(
                    `Quantidade insuficiente. Disponível: ${packLot.quantity_remaining} ${packLot.unit}`
                );
            }

            // 4. Insert usage record
            const { data: usage, error: insertError } = await this.supabase
                .from("batch_packaging_usage")
                .insert({
                    organization_id: batch.organization_id,
                    plant_id: batch.plant_id,
                    production_batch_id: dto.batchId,
                    packaging_material_lot_id: dto.packagingMaterialLotId,
                    quantity_used: dto.quantity,
                    unit: dto.unit,
                    material_name: packLot.material_name,
                    lot_code: packLot.code
                })
                .select("id")
                .single();

            if (insertError) throw insertError;

            // 5. Debit inventory
            const newQuantity = packLot.quantity_remaining - dto.quantity;
            const { error: debitError } = await this.supabase
                .from("packaging_material_lots")
                .update({ quantity_remaining: newQuantity })
                .eq("id", dto.packagingMaterialLotId);

            if (debitError) {
                console.error("[PackagingService] Inventory debit failed:", debitError);
                // Link created but debit failed - log for reconciliation
            }

            // 6. Audit
            await this.auditAction('PACKAGING_LINKED', 'batch_packaging_usage', usage.id, {
                batch_id: dto.batchId,
                batch_code: batch.code,
                lot_id: dto.packagingMaterialLotId,
                lot_code: packLot.code,
                quantity: dto.quantity,
                unit: dto.unit
            });

            return this.success({ id: usage.id }, "Embalagem vinculada com sucesso.");

        } catch (error: any) {
            console.error("[PackagingService] Link failed:", error);
            return this.failure("Falha ao vincular embalagem.", error);
        }
    }

    /**
     * Removes a packaging link and restores inventory.
     */
    async unlinkPackaging(usageId: string, reason: string): Promise<DomainResponse> {
        this.enforceRole(['production_manager', 'admin', 'system_owner']);

        if (!reason || reason.trim().length < 10) {
            return this.failure("Uma justificação com pelo menos 10 caracteres é obrigatória.");
        }

        try {
            // 1. Fetch usage record
            const { data: usage, error: fetchError } = await this.supabase
                .from("batch_packaging_usage")
                .select("id, packaging_material_lot_id, quantity_used")
                .eq("id", usageId)
                .single();

            if (fetchError || !usage) {
                return this.failure("Registo de uso não encontrado.");
            }

            // 2. Restore inventory
            const { data: lot } = await this.supabase
                .from("packaging_material_lots")
                .select("quantity_remaining")
                .eq("id", usage.packaging_material_lot_id)
                .single();

            if (lot) {
                const restoredQuantity = lot.quantity_remaining + usage.quantity_used;
                await this.supabase
                    .from("packaging_material_lots")
                    .update({ quantity_remaining: restoredQuantity })
                    .eq("id", usage.packaging_material_lot_id);
            }

            // 3. Delete usage record (or soft delete)
            const { error: deleteError } = await this.supabase
                .from("batch_packaging_usage")
                .delete()
                .eq("id", usageId);

            if (deleteError) throw deleteError;

            // 4. Audit
            await this.auditAction('PACKAGING_UNLINKED', 'batch_packaging_usage', usageId, {
                reason,
                restored_quantity: usage.quantity_used
            });

            return this.success({ id: usageId }, "Vínculo de embalagem removido e inventário restaurado.");

        } catch (error: any) {
            return this.failure("Falha ao remover vínculo.", error);
        }
    }
}
