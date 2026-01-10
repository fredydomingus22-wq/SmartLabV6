import { SupabaseClient } from "@supabase/supabase-js";
import { BaseDomainService } from "../shared/base.service";
import { DomainContext } from "../shared/industrial.context";
import { ElectronicSignatureService } from "../lab/signature.service";

export interface RegisterResultParams {
    resultId: string;
    colonyCount?: number | null;
    isTntc?: boolean;
    isPresenceAbsence?: boolean;
    presenceDetected?: boolean | null;
    resultText?: string;
    sampleWeightG?: number;
    sampleVolumeMl?: number;
    dilutionFactor?: number;
    bufferName?: string;
    password?: string;
}

export interface StartIncubationParams {
    incubatorId: string;
    sampleId: string;
    mediaLotId: string;
    resultIds: string[];
    startTempC?: number;
}

/**
 * MicroDomainService
 * 
 * Centralized domain service for all Microbiology operations.
 * Enforces 21 CFR Part 11 and ISO 17025 requirements.
 */
export class MicroDomainService extends BaseDomainService {
    private signatureService: ElectronicSignatureService;

    constructor(client: SupabaseClient, context: DomainContext) {
        super(client, context);
        this.signatureService = new ElectronicSignatureService(client, context);
    }

    /**
     * Registers a microbiological reading
     */
    async registerResult(params: RegisterResultParams) {
        try {
            // 1. Verify Electronic Signature (21 CFR Part 11)
            if (params.password) {
                const isValid = await this.signatureService.verify(params.password);
                if (!isValid) return this.failure("Assinatura eletrónica inválida.");
            }

            // 2. Fetch current result state
            const { data: currentResult, error: fetchError } = await this.supabase
                .from("micro_results")
                .select("*")
                .eq("id", params.resultId)
                .single();

            if (fetchError || !currentResult) return this.failure("Resultado não encontrado.");

            // 3. Immutability Check
            if (currentResult.status === 'completed' && !params.password) {
                return this.failure("Resultados finalizados exigem senha para modificação.");
            }

            // 4. Atomic Update
            const { error: updateError } = await this.supabase
                .from("micro_results")
                .update({
                    colony_count: params.isTntc ? null : params.colonyCount,
                    is_tntc: params.isTntc,
                    is_presence_absence: params.isPresenceAbsence,
                    presence_detected: params.presenceDetected,
                    result_text: params.resultText,
                    sample_weight_g: params.sampleWeightG,
                    sample_volume_ml: params.sampleVolumeMl,
                    dilution_factor: params.dilutionFactor,
                    buffer_name: params.bufferName,
                    read_by: this.context.user_id,
                    read_at: new Date().toISOString(),
                    status: 'completed'
                })
                .eq("id", params.resultId);

            if (updateError) throw updateError;

            // 5. Log Audit Trail
            await this.auditAction('REGISTER_RESULT', 'micro_result', params.resultId, params);

            return this.success({ id: params.resultId });
        } catch (error: any) {
            return this.failure(error.message);
        }
    }

    /**
     * Starts an incubation session
     */
    async startIncubationBatch(params: StartIncubationParams) {
        try {
            // 1. Validate Media Expiry
            const { data: mediaLot } = await this.supabase
                .from("micro_media_lots")
                .select("expiry_date, status, quantity_current")
                .eq("id", params.mediaLotId)
                .single();

            if (!mediaLot || mediaLot.status !== 'active') return this.failure("Lote de meio inválido.");
            if (new Date(mediaLot.expiry_date) < new Date()) return this.failure("Meio de cultura expirado.");

            // 2. Validate Incubator Status and Calibration
            const { data: incubator } = await this.supabase
                .from("micro_incubators")
                .select("status, next_calibration_due")
                .eq("id", params.incubatorId)
                .single();

            if (incubator?.status !== 'active') return this.failure("Incubadora fora de serviço.");
            if (incubator.next_calibration_due && new Date(incubator.next_calibration_due) < new Date()) {
                return this.failure("Calibração da incubadora expirada.");
            }

            // 3. Create Test Session
            const { data: session, error: sessError } = await this.supabase
                .from("micro_test_sessions")
                .insert({
                    organization_id: this.context.organization_id,
                    plant_id: this.context.plant_id,
                    incubator_id: params.incubatorId,
                    started_by: this.context.user_id,
                    status: 'incubating',
                    start_temp_c: params.startTempC
                })
                .select()
                .single();

            if (sessError) throw sessError;

            // 4. Update Results
            const { error: updateError } = await this.supabase
                .from("micro_results")
                .update({
                    status: 'incubating',
                    test_session_id: session.id,
                    media_lot_id: params.mediaLotId,
                    read_by: null,
                    read_at: null
                })
                .in("id", params.resultIds);

            if (updateError) throw updateError;

            // 5. Update Sample Status
            await this.supabase
                .from("samples")
                .update({ status: 'in_analysis' })
                .eq("id", params.sampleId);

            await this.auditAction('START_INCUBATION', 'micro_session', session.id, params);

            return this.success({ sessionId: session.id });
        } catch (error: any) {
            return this.failure(error.message);
        }
    }

    /**
     * Implementation of Soft Delete (Industrial Requirement)
     */
    async softDeleteEquipment(type: 'incubator' | 'media_type', id: string, reason: string) {
        try {
            const table = type === 'incubator' ? 'micro_incubators' : 'micro_media_types';
            const { error } = await this.supabase
                .from(table)
                .update({
                    status: 'out_of_service',
                    deleted_at: new Date().toISOString(),
                    deleted_by: this.context.user_id,
                    deletion_reason: reason
                })
                .eq("id", id);

            if (error) throw error;

            await this.auditAction('SOFT_DELETE', table, id, { reason });

            return this.success({ id });
        } catch (error: any) {
            return this.failure(error.message);
        }
    }

    /**
     * Calibration Management
     */
    async updateCalibration(incubatorId: string, lastDate: string, nextDue: string) {
        try {
            const { error } = await this.supabase
                .from("micro_incubators")
                .update({
                    last_calibration_date: lastDate,
                    next_calibration_due: nextDue
                })
                .eq("id", incubatorId);

            if (error) throw error;

            await this.auditAction('CALIBRATION_UPDATE', 'incubator', incubatorId, { lastDate, nextDue });

            return this.success({ id: incubatorId });
        } catch (error: any) {
            return this.failure(error.message);
        }
    }
}
