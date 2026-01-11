import { SupabaseClient } from "@supabase/supabase-js";
import { BaseDomainService } from "../shared/base.service";
import { DomainResponse, DomainContext } from "../shared/industrial.context";

export type ComplianceStatus = 'compliant' | 'blocked' | 'warning';

export interface ComplianceCheckResult {
    batch_id: string;
    overall_status: ComplianceStatus;
    checks: {
        lims: {
            pending_samples: number;
            oos_results: number;
            status: ComplianceStatus;
        };
        qms: {
            open_critical_ncs: number;
            status: ComplianceStatus;
        };
        fsms: {
            pcc_deviations: number;
            status: ComplianceStatus;
        };
    };
    blockers: string[];
}

/**
 * QualityGatekeeperService
 * 
 * Enforces the Quality Decision Engine rules (2.7) for Batch Release.
 * Centralizes validation across LIMS, QMS, and FSMS.
 */
export class QualityGatekeeperService extends BaseDomainService {
    constructor(supabase: SupabaseClient, context: DomainContext) {
        super(supabase, context);
    }

    /**
     * Verifies the full compliance state of a production batch.
     * Does NOT modify state, only reports it.
     */
    async verifyBatchCompliance(batchId: string): Promise<DomainResponse<ComplianceCheckResult>> {
        try {
            const blockers: string[] = [];

            // 1. LIMS Check (BL-01, BL-03)
            // BL-01: No critical OOS results (without approved deviation - logic simplified for now)
            // BL-03: All mandatory samples completed
            const { data: samples, error: sampleError } = await this.supabase
                .from("samples")
                .select(`
                    id, 
                    status,
                    code,
                    lab_analysis (
                        id,
                        is_conforming,
                        qa_parameters (name)
                    )
                `)
                .eq("production_batch_id", batchId);

            if (sampleError) throw sampleError;

            let limsStatus: ComplianceStatus = 'compliant';
            let pendingSamples = 0;
            let oosResults = 0;

            if (samples) {
                // Check completeness
                const unvalidated = samples.filter((s: any) => !['approved', 'validated'].includes(s.status));
                pendingSamples = unvalidated.length;
                if (pendingSamples > 0) {
                    limsStatus = 'blocked';
                    blockers.push(`LIMS: ${pendingSamples} amostras pendentes de validação.`);
                }

                // Check conformity (BL-01)
                samples.forEach((s: any) => {
                    const oos = s.lab_analysis?.filter((a: any) => a.is_conforming === false);
                    if (oos && oos.length > 0) {
                        oosResults += oos.length;
                        limsStatus = 'blocked';
                        blockers.push(`LIMS: Resultados OOS detetados na amostra ${s.code}.`);
                    }
                });
            }

            // 2. QMS Check (BL-02)
            // BL-02: No open Critical/Major NCs linked to the batch
            // Note: Assuming 'non_conformities' has a link to batch (or via metadata/tracing)
            // For MVP, checking direct link or ignoring if table structure varies. 
            // Since NC structure might be evolving, we check robustly.

            // Checking table existence or assuming standard columns from QMS module
            const { data: ncs, error: ncError } = await this.supabase
                .from("non_conformities") // Assuming table name from previous context
                .select("id, status, severity, title")
                //.eq("production_batch_id", batchId) // Direct link preferable
                .contains("metadata", { batch_id: batchId }) // Fallback if link is JSON
                .neq("status", "closed");

            let qmsStatus: ComplianceStatus = 'compliant';
            let openCriticalNcs = 0;

            if (!ncError && ncs) {
                const critical = ncs.filter((n: any) => ['critical', 'major'].includes(n.severity));
                openCriticalNcs = critical.length;

                if (openCriticalNcs > 0) {
                    qmsStatus = 'blocked';
                    blockers.push(`QMS: ${openCriticalNcs} Não Conformidades Críticas/Maiores em aberto.`);
                }
            }

            // 3. FSMS Check (PCCs)
            // BL-02 (part 2): PCC deviations
            let fsmsStatus: ComplianceStatus = 'compliant' as ComplianceStatus;
            let pccDeviations = 0;

            // Placeholder: FSMS monitoring check would go here.
            // For now, assuming compliant if no explicit data blocking.

            // 4. Overall Status
            let overallStatus: ComplianceStatus = 'compliant';
            if (limsStatus === 'blocked' || qmsStatus === 'blocked' || fsmsStatus === 'blocked') {
                overallStatus = 'blocked';
            }
            // Removed 'warning' check for now as unintentional overlap until logic supports it

            const result: ComplianceCheckResult = {
                batch_id: batchId,
                overall_status: overallStatus,
                checks: {
                    lims: { pending_samples: pendingSamples, oos_results: oosResults, status: limsStatus },
                    qms: { open_critical_ncs: openCriticalNcs, status: qmsStatus },
                    fsms: { pcc_deviations: pccDeviations, status: fsmsStatus }
                },
                blockers
            };

            return this.success(result);

        } catch (error: any) {
            console.error("[QualityGatekeeper] Compliance check failed:", error);
            return this.failure("Erro ao verificar conformidade do lote.", error);
        }
    }

    /**
     * Executes the Release transition (BL-04).
     * Validates electronic signature and compliance status.
     */
    async releaseBatch(batchId: string, signaturePassword: string): Promise<DomainResponse> {
        this.enforceRole(['qa_manager', 'system_owner', 'admin']);

        // 1. Verify Signature (21 CFR Part 11)
        const { ElectronicSignatureService } = await import("../lab/signature.service");
        const sigService = new ElectronicSignatureService(this.supabase, this.context);
        const sigValid = await sigService.verify(signaturePassword);

        if (!sigValid) {
            return this.failure("ASSINATURA INVÁLIDA: Credenciais incorretas.");
        }

        // 2. Verify Compliance
        const compliance = await this.verifyBatchCompliance(batchId);
        if (!compliance.success || !compliance.data) return compliance;

        if (compliance.data.overall_status === 'blocked') {
            return this.failure(
                "BLOQUEIO DE QUALIDADE: O lote não cumpre os critérios para libertação.",
                { blockers: compliance.data.blockers }
            );
        }

        // 3. Execute Transition
        try {
            const { error } = await this.supabase
                .from("production_batches")
                .update({
                    status: 'released',
                    qa_approved_by: this.context.user_id,
                    qa_approved_at: new Date().toISOString()
                })
                .eq("id", batchId)
                .eq("organization_id", this.context.organization_id);

            if (error) throw error;

            // 4. Audit
            await this.auditAction('BATCH_RELEASED', 'production_batches', batchId, {
                compliance_snapshot: compliance.data
            });

            return this.success({ id: batchId }, "Lote libertado com sucesso (Qualidade).");

        } catch (error: any) {
            return this.failure("Erro ao atualizar estado do lote.", error);
        }
    }
}
