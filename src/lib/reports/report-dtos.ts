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
    signatureUrl?: string; // URL to signature image from Storage
}

// Organization and Plant Header for dynamic report headers
export interface OrganizationHeader {
    name: string;
    logoUrl?: string;
    address?: string;
}

export interface PlantHeader {
    name: string;
    code: string;
    address?: string;
}

// 🔹 Production Batch Quality Report (All-in-one Structure)
export interface EnterpriseBatchReportDTO {
    header: ReportHeader;
    overview: {
        productName: string;
        batchCode: string;
        productionPeriod: string;
        plannedQuantity: number;
        finalStatus: "RELEASED" | "BLOCKED" | "IN PROGRESS" | "COMPLETED" | "PENDING";
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
    signatures: {
        preparation: Signature;  // Operator/Analyst (Initial state/First result)
        review: Signature;       // Supervisor (Production/Lab Supervisor)
        certification: Signature; // QA Manager (Final Release)
    };
    releaseDecision: {
        status: "RELEASED" | "BLOCKED" | "PENDING";
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
    const samples = (data.samples || [])
        .filter((s: any) => {
            const status = s.status?.toLowerCase();
            // Standard Industrial statuses - everything except draft
            return ["approved", "rejected", "validated", "completed", "in_analysis", "collected", "registered", "under_review", "released"].includes(status);
        })
        .sort((a: any, b: any) => {
            // Sort by collection date/time ascending
            const dateA = a.collected_at ? new Date(a.collected_at).getTime() : 0;
            const dateB = b.collected_at ? new Date(b.collected_at).getTime() : 0;
            return dateA - dateB;
        });

    // Robust Category Matching
    const isFQ = (s: any) => {
        const st = Array.isArray(s.sample_type) ? s.sample_type[0] : s.sample_type;
        const cat = st?.test_category?.toLowerCase() || st?.code?.toLowerCase() || "";
        const name = st?.name?.toLowerCase() || "";
        return cat.includes('physico') || cat.includes('fq') || name.includes('fq') || name.includes('fisico-quimico');
    };
    const isMicro = (s: any) => {
        const st = Array.isArray(s.sample_type) ? s.sample_type[0] : s.sample_type;
        const cat = st?.test_category?.toLowerCase() || st?.code?.toLowerCase() || "";
        const name = st?.name?.toLowerCase() || "";
        return cat.includes('micro') || name.includes('micro');
    };

    const fqSamples = samples.filter(isFQ);
    const microSamples = samples.filter(isMicro);

    const mapAnalyticSection = (typeSamples: any[], type: string): AnalyticalSection[] => {
        if (typeSamples.length === 0) return [];

        return [{
            specTitle: `CERTIFICADO-${type.toUpperCase()}`,
            specVersion: "v1.0",
            samples: typeSamples.map(s => ({
                sampleId: s.code,
                analysisDate: s.collected_at ? new Date(s.collected_at).toISOString() : "-",
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
                    signatureUrl: s.analysis?.[0]?.analyst?.signature_url,
                    hash: generateSignatureHash(s.analysis?.[0]?.analyzed_by, s.id, "analysis")
                },
                reviewer: {
                    name: data.batch.supervisor?.full_name || "Supervisor de Produção",
                    role: data.batch.supervisor?.role || "Supervisor",
                    date: data.batch.supervisor_approved_at || data.batch.created_at,
                    signatureUrl: data.batch.supervisor?.signature_url,
                    hash: generateSignatureHash(data.batch.supervisor_approved_by, s.id, "review")
                }
            }))
        }];
    };

    const fqStats = getStats(fqSamples, "Physicochemical");
    const microStats = getStats(microSamples, "Microbiology");

    return {
        header: {
            plantName: data.batch.plant?.name || "Unidade de Produção",
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
            finalStatus: (() => {
                const s = data.batch.status?.toLowerCase();
                if (s === 'released') return "RELEASED";
                if (s === 'blocked' || s === 'rejected') return "BLOCKED";
                if (s === 'completed') return "COMPLETED";
                if (s === 'in_progress' || s === 'open') return "IN PROGRESS";
                return "PENDING";
            })()
        },
        qualitySummary: [fqStats, microStats],
        fqAnalysis: mapAnalyticSection(fqSamples, "FQ"),
        microAnalysis: mapAnalyticSection(microSamples, "Micro"),
        signatures: {
            preparation: {
                name: data.batch.creator?.full_name || "Operador de Produção",
                role: data.batch.creator?.role || "Operador",
                date: data.batch.created_at,
                signatureUrl: data.batch.creator?.signature_url,
                hash: generateSignatureHash(data.batch.created_by, data.batch.id, "preparation")
            },
            review: {
                name: data.batch.supervisor?.full_name || "QC Supervisor",
                role: data.batch.supervisor?.role || "Supervisor",
                date: data.batch.supervisor_approved_at || data.batch.created_at,
                signatureUrl: data.batch.supervisor?.signature_url,
                hash: generateSignatureHash(data.batch.supervisor_approved_by, data.batch.id, "review")
            },
            certification: {
                name: data.batch.qa?.full_name || "Diretor de Qualidade",
                role: data.batch.qa?.role || "QA Manager",
                date: data.batch.qa_approved_at || data.batch.created_at,
                signatureUrl: data.batch.qa?.signature_url,
                hash: generateSignatureHash(data.batch.qa_approved_by, data.batch.id, "certification")
            }
        },
        releaseDecision: {
            status: data.batch.status?.toUpperCase() === 'RELEASED' ? "RELEASED" : (['REJECTED', 'BLOCKED'].includes(data.batch.status?.toUpperCase()) ? "BLOCKED" : "PENDING"),
            approver: {
                name: data.batch.qa?.full_name || "Diretor de Qualidade",
                role: data.batch.qa?.role || "QA Manager",
                date: data.batch.qa_approved_at || data.batch.created_at,
                signatureUrl: data.batch.qa?.signature_url,
                hash: generateSignatureHash(data.batch.qa_approved_by, data.batch.id, "certification"),
                signatureId: data.batch.qa_approved_by
            }
        }
    };
}

function getStats(samples: any[], discipline: "Physicochemical" | "Microbiology") {
    const approved = samples.filter(s => {
        const st = s.status?.toLowerCase();
        return st === 'approved' || st === 'validated' || st === 'released' || st === 'completed';
    }).length;
    const rejected = samples.filter(s => {
        const st = s.status?.toLowerCase();
        return st === 'rejected' || st === 'blocked';
    }).length;
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
