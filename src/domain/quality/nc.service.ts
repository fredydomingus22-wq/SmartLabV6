import { BaseDomainService } from "../shared/base.service";
import { DomainResponse } from "../shared/industrial.context";

export class NonConformityDomainService extends BaseDomainService {
    /**
     * Automatically creates a Non-Conformity from a failed quality analysis.
     * strictly for Critical or FSMS/PCC parameters.
     */
    async createFromAnalysisFailure(params: {
        analysisId: string;
        sampleId: string;
        parameterName: string;
        value: string | number;
        severity?: 'low' | 'medium' | 'high' | 'critical';
    }): Promise<DomainResponse> {
        try {
            // 1. Resolve Plant Context from Sample
            const { data: sample } = await this.supabase
                .from("samples")
                .select("plant_id")
                .eq("id", params.sampleId)
                .single();

            // 2. Persistence in 'nonconformities' table
            const { data: newNC, error } = await this.supabase.from("nonconformities").insert({
                organization_id: this.context.organization_id,
                plant_id: sample?.plant_id || this.context.plant_id,
                title: `Desvio Automático: ${params.parameterName}`,
                description: `O parâmetro crítico ${params.parameterName} falhou com o valor [${params.value}]. Gerado automaticamente via LIMS.`,
                severity: params.severity || 'critical',
                type: 'process',
                source_analysis_id: params.analysisId,
                status: 'open',
                created_by: this.context.user_id,
                occurrence_date: new Date().toISOString()
            }).select("id, code").single();

            if (error) throw error;

            // 3. Technical Audit
            await this.auditAction('NC_AUTO_CREATED', 'nonconformities', newNC.id, {
                analysis_id: params.analysisId,
                parameter: params.parameterName,
                value: params.value
            });

            return this.success({ id: newNC.id, code: newNC.code });
        } catch (error: any) {
            console.error("[NonConformityService] Automation Failed:", error);
            return this.failure("Falha ao gerar NC automática.", error);
        }
    }
}
