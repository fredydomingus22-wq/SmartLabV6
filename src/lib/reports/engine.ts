/**
 * Enterprise Report Engine
 * Main dispatcher for generating reports.
 */
import { ReportType, ReportRegistry } from "./registry";
import { generateCoAPdf } from "@/app/actions/pdf-generator";
import { generateBatchRecordPdf } from "./generators/batch-record";
import { generateShiftReportPdf } from "./generators/shift-report";
import { generateMicroReportPdf } from "./generators/micro-report";
// Will import other generators here as they are refactored

export interface GenerationResult {
    success: boolean;
    pdf?: string; // Base64
    filename?: string;
    error?: string;
}

export async function generateReport(
    type: ReportType,
    params: any,
    userPermissions: string[]
): Promise<GenerationResult> {
    const reportConfig = ReportRegistry[type];

    if (!reportConfig) {
        return { success: false, error: `Unknown report type: ${type}` };
    }

    // 1. Verify Permissions
    const hasPermission = reportConfig.requiredPermissions.every(p =>
        userPermissions.includes(p) || userPermissions.includes("admin")
    );

    if (!hasPermission) {
        return { success: false, error: "Insufficient permissions" };
    }

    // 2. Dispatch to Generator
    try {
        switch (type) {
            case "coa":
                // Existing CoA generator wrapped in new interface
                // Expects params.sampleId
                if (!params.sampleId) return { success: false, error: "Missing sampleId" };
                const coaResult = await generateCoAPdf(params.sampleId);
                return {
                    success: coaResult.success,
                    pdf: coaResult.pdf,
                    filename: coaResult.filename,
                    error: coaResult.message
                };


            case "batch_record":
                if (!params.batchId) return { success: false, error: "Missing batchId" };
                return await generateBatchRecordPdf(params.batchId);

            case "micro_analysis":
                if (!params.batchId) return { success: false, error: "Missing batchId" };
                return await generateMicroReportPdf(params.batchId);

            case "shift_report":
                if (!params.date || !params.shiftId) return { success: false, error: "Missing date or shiftId" };
                return await generateShiftReportPdf(params.date, params.shiftId);

            default:
                return { success: false, error: "Generator not found" };
        }
    } catch (error: any) {
        console.error(`Report generation failed for ${type}:`, error);
        return { success: false, error: error.message || "Generation failed" };
    }
}
