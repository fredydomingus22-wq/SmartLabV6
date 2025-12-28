import { getBatchTraceabilityAction } from "@/app/actions/traceability";
import { mapToEnterpriseReport } from "@/lib/reports/report-dtos";
import { MicroReportTemplate } from "@/components/reports/templates/MicroReportTemplate";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { GenerationResult } from "@/lib/reports/engine";

export async function generateMicroReportPdf(batchId: string): Promise<GenerationResult> {
    try {
        // 1. Fetch Data (Reusing specific batch traceability for now, could be optimized to fetch only micro)
        const traceData = await getBatchTraceabilityAction(batchId);

        if (!traceData.success || !traceData.data) {
            return { success: false, error: traceData.message || "Batch not found" };
        }

        // 2. Map to DTO
        const reportData = mapToEnterpriseReport(traceData.data);

        // 3. Render PDF
        const document = React.createElement(MicroReportTemplate, { data: reportData });
        const buffer = await renderToBuffer(document as any);

        // 4. Return
        return {
            success: true,
            pdf: buffer.toString("base64"),
            filename: `MicroReport_${reportData.header.batchCode}_${new Date().toISOString().split("T")[0]}.pdf`
        };
    } catch (error: any) {
        console.error("Micro Report Generation Error:", error);
        return { success: false, error: error.message };
    }
}
