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
        severity?: 'minor' | 'major' | 'critical';
    }): Promise<DomainResponse> {
        try {
            // 1. Resolve Plant Context from Sample
            const { data: sample } = await this.supabase
                .from("samples")
                .select("plant_id")
                .eq("id", params.sampleId)
                .single();

            // 1.5 Generate NC Number
            const year = new Date().getFullYear();
            const { count } = await this.supabase
                .from("nonconformities")
                .select("*", { count: 'exact', head: true })
                .eq("organization_id", this.context.organization_id)
                .gte("created_at", `${year}-01-01`);

            const sequence = (count || 0) + 1;
            const nc_number = `NC-${year}-${sequence.toString().padStart(4, "0")}`;

            // 2. Persistence in 'nonconformities' table
            const { data: newNC, error } = await this.supabase.from("nonconformities").insert({
                organization_id: this.context.organization_id,
                plant_id: sample?.plant_id || this.context.plant_id,
                nc_number: nc_number,
                title: `Desvio Automático: ${params.parameterName}`,
                description: `O parâmetro crítico ${params.parameterName} falhou com o valor [${params.value}]. Gerado automaticamente via LIMS.`,
                severity: params.severity || 'critical',
                nc_type: 'process', // Fixed column name
                category: 'process',
                source_id: params.analysisId, // Fixed column name from source_analysis_id
                source_type: 'analysis',
                status: 'open',
                created_by: this.context.user_id,
                detected_date: new Date().toISOString() // Fixed column name
            }).select("id, nc_number").single();

            if (error) throw error;

            // 3. Technical Audit
            await this.auditAction('NC_AUTO_CREATED', 'nonconformities', newNC.id, {
                analysis_id: params.analysisId,
                parameter: params.parameterName,
                value: params.value
            });

            return this.success({ id: newNC.id, code: newNC.nc_number });
        } catch (error: any) {
            console.error("[NonConformityService] Automation Failed:", error);
            return this.failure("Falha ao gerar NC automática.", error);
        }
    }
}
