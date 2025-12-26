import { NextRequest, NextResponse } from "next/server";
import { getBatchTraceabilityAction } from "@/app/actions/traceability";
import { mapToEnterpriseReport, EnterpriseBatchReportDTO } from "@/lib/reports/report-dtos";
import { generateReportHtml } from "@/lib/reports/pdf-generator";
import puppeteer from "puppeteer";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: batchId } = await context.params;

    // 0. Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!batchId || !uuidRegex.test(batchId)) {
        return NextResponse.json({ error: `Invalid Batch ID format: ${batchId}` }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "FINAL").toUpperCase();

    try {
        const supabase = await createClient();

        // 1. Check for existing Signed Snapshot
        const { data: existingReport } = await supabase
            .from("generated_reports")
            .select("report_data")
            .eq("entity_id", batchId)
            .eq("report_type", "FINAL")
            .eq("status", "signed")
            .maybeSingle();

        let enterpriseData: EnterpriseBatchReportDTO;

        if (existingReport?.report_data) {
            enterpriseData = existingReport.report_data as unknown as EnterpriseBatchReportDTO;
        } else {
            const result = await getBatchTraceabilityAction(batchId);
            if (!result.success || !result.data) {
                return NextResponse.json({ error: result.message }, { status: 404 });
            }
            enterpriseData = mapToEnterpriseReport(result.data);
        }

        // 2. Generate HTML via Decoupled Engine (Safe for build)
        const fullHtml = await generateReportHtml(enterpriseData, type);

        const filename = `${type}-${enterpriseData.header.batchCode}.pdf`;

        // 3. Generate PDF via Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '20mm',
                right: '20mm'
            }
        });

        await browser.close();

        // 4. Return PDF
        return new NextResponse(pdf as any, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });

    } catch (error: any) {
        console.error("PDF GENERATION ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
