import { getShiftReportData } from "@/lib/queries/shift-report";
import { ShiftReportTemplate } from "@/components/reports/templates/ShiftReportTemplate";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { GenerationResult } from "@/lib/reports/engine";

export async function generateShiftReportPdf(date: string, shiftId: string): Promise<GenerationResult> {
    try {
        // 1. Fetch Data
        const { data, error } = await getShiftReportData(date, shiftId);

        if (error || !data) {
            return { success: false, error: error || "Shift data not found" };
        }

        // 2. Render PDF
        const document = React.createElement(ShiftReportTemplate, { data });
        const buffer = await renderToBuffer(document as any);

        // 3. Return
        return {
            success: true,
            pdf: buffer.toString("base64"),
            filename: `ShiftReport_${data.shiftInfo.date}_${data.shiftInfo.shift}.pdf`
        };
    } catch (error: any) {
        console.error("Shift Report Generation Error:", error);
        return { success: false, error: error.message };
    }
}
