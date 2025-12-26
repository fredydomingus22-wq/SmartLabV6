/**
 * SmartLab Enterprise Report DTO Layer
 * Maps database entities to official industrial report structures (R1-R6).
 */

export interface ReportHeader {
    plantName: string;
    productName: string;
    batchCode: string;
    reportId: string;
    pageTotal?: number;
    timestamp: string;
}

export interface Signature {
    name: string;
    role: string;
    date: string;
    hash?: string;
    signatureId?: string;
}

// 🔹 Production Batch Quality Report (All-in-one Structure)
export interface EnterpriseBatchReportDTO {
    header: ReportHeader;
    overview: {
        productName: string;
        batchCode: string;
        productionPeriod: string;
        plannedQuantity: number;
        finalStatus: "RELEASED" | "BLOCKED";
    };
    qualitySummary: {
        discipline: "Physicochemical" | "Microbiology";
        samples: number;
        approved: number;
        rejected: number;
        status: "APPROVED" | "REVIEWED" | "WARNING";
    }[];
    fqAnalysis: AnalyticalSection[];
    microAnalysis: AnalyticalSection[];
    releaseDecision: {
        status: "RELEASED" | "BLOCKED";
        approver: Signature;
    };
}

export interface AnalyticalSection {
    specTitle: string;
    specVersion: string;
    samples: {
        sampleId: string;
        analysisDate: string;
        records: {
            parameter: string;
            result: string | number;
            limit: string;
            unit: string;
            method: string;
            isCritical: boolean;
            status: "PASS" | "FAIL";
        }[];
        analyst: Signature;
        reviewer: Signature;
    }[];
}

// --- Mappers ---

export function mapToEnterpriseReport(data: any): EnterpriseBatchReportDTO {
    const samples = (data.samples || []).filter((s: any) =>
        ["approved", "rejected", "validated", "completed", "in_analysis"].includes(s.status?.toLowerCase())
    );

    const fqSamples = samples.filter((s: any) =>
        s.sample_type?.test_category === 'physico_chemical' ||
        s.sample_type?.test_category?.toUpperCase() === 'FQ'
    );
    const microSamples = samples.filter((s: any) =>
        s.sample_type?.test_category === 'microbiological' ||
        s.sample_type?.test_category?.toUpperCase() === 'MICRO'
    );

    const mapAnalyticSection = (typeSamples: any[], type: string): AnalyticalSection[] => {
        if (typeSamples.length === 0) return [];

        return [{
            specTitle: `CERTIFICADO-${type.toUpperCase()}`,
            specVersion: "v1.0",
            samples: typeSamples.map(s => ({
                sampleId: s.code,
                analysisDate: s.collected_at ? new Date(s.collected_at).toLocaleDateString() : "-",
                records: (s.analysis || []).map((a: any) => {
                    const spec = (data.batch.specifications || []).find((sp: any) =>
                        sp.qa_parameter_id === a.qa_parameter_id
                    );

                    let limit = "-";
                    if (spec) {
                        if (spec.min_value !== null && spec.max_value !== null) {
                            limit = `${spec.min_value} - ${spec.max_value}`;
                        } else if (spec.min_value !== null) {
                            limit = `min. ${spec.min_value}`;
                        } else if (spec.max_value !== null) {
                            limit = `max. ${spec.max_value}`;
                        } else if (spec.text_value) {
                            limit = spec.text_value;
                        }
                    }

                    return {
                        parameter: a.parameter?.name || "Parâmetro",
                        result: a.value_numeric ?? a.value_text ?? "N/D",
                        limit: limit,
                        unit: a.parameter?.unit || "",
                        method: a.parameter?.code || "Interno",
                        isCritical: true,
                        status: a.is_conforming ? "PASS" : "FAIL"
                    };
                }),
                analyst: {
                    name: s.analysis?.[0]?.analyst?.full_name || "Técnico de Lab",
                    role: s.analysis?.[0]?.analyst?.role || "Analista",
                    date: s.analysis?.[0]?.analyzed_at || s.collected_at,
                    hash: generateSignatureHash(s.analysis?.[0]?.analyzed_by, s.id, "analysis")
                },
                reviewer: {
                    name: data.batch.supervisor?.full_name || "Supervisor de Produção",
                    role: data.batch.supervisor?.role || "Supervisor",
                    date: data.batch.supervisor_approved_at || data.batch.created_at,
                    hash: generateSignatureHash(data.batch.supervisor_approved_by, s.id, "review")
                }
            }))
        }];
    };

    const fqStats = getStats(fqSamples, "Physicochemical");
    const microStats = getStats(microSamples, "Microbiology");

    return {
        header: {
            plantName: data.batch.plant?.name || "Porto Plant",
            productName: data.batch.product?.name || "N/A",
            batchCode: data.batch.code,
            reportId: `REP-${data.batch.code}-${new Date().getTime()}`,
            timestamp: new Date().toISOString()
        },
        overview: {
            productName: data.batch.product?.name || "N/A",
            batchCode: data.batch.code,
            productionPeriod: `${data.batch.start_date ? new Date(data.batch.start_date).toLocaleDateString() : '-'} - ${data.batch.end_date ? new Date(data.batch.end_date).toLocaleDateString() : 'Em curso'}`,
            plannedQuantity: data.batch.planned_quantity || 0,
            finalStatus: data.batch.status === 'released' ? "RELEASED" : "BLOCKED"
        },
        qualitySummary: [fqStats, microStats],
        fqAnalysis: mapAnalyticSection(fqSamples, "FQ"),
        microAnalysis: mapAnalyticSection(microSamples, "Micro"),
        releaseDecision: {
            status: data.batch.status === 'released' ? "RELEASED" : "BLOCKED",
            approver: {
                name: data.batch.qa?.full_name || "Garantia de Qualidade",
                role: data.batch.qa?.role || "QA Manager",
                date: data.batch.qa_approved_at || new Date().toISOString(),
                signatureId: `SIGN-${data.batch.id.substring(0, 8).toUpperCase()}`,
                hash: generateSignatureHash(data.batch.qa_approved_by, data.batch.id, "release")
            }
        }
    };
}

function getStats(samples: any[], discipline: "Physicochemical" | "Microbiology") {
    const approved = samples.filter(s => s.status === 'approved' || s.status === 'validated').length;
    const rejected = samples.filter(s => s.status === 'rejected' || s.status === 'blocked').length;
    return {
        discipline,
        samples: samples.length,
        approved,
        rejected,
        status: rejected > 0 ? "WARNING" as const : (approved > 0 ? "APPROVED" as const : "REVIEWED" as const)
    };
}

function generateSignatureHash(userId: string, entityId: string, action: string): string {
    if (!userId) return "NOT_SIGNED";
    const timestamp = new Date().toISOString();
    return `SHA256:${userId.substring(0, 8)}:${entityId?.substring(0, 8)}:${action.toUpperCase()}`;
}
