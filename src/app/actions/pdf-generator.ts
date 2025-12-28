"use server";

import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { CertificateOfAnalysis } from "@/components/reports/templates/CertificateOfAnalysis";
import { AttendanceReportTemplate } from "@/components/reports/templates/AttendanceReportTemplate";
import { getSampleForCoA, getBatchReportData } from "@/lib/queries/reports";
import { getBatchTraceabilityAction } from "@/app/actions/traceability";
import { mapToEnterpriseReport } from "@/lib/reports/report-dtos";

/**
 * Generate Attendance PDF for a team/shift
 */
export async function generateAttendancePdf(params: {
    date: string;
    teamId: string;
    shiftId: string;
    teamName: string;
    shiftName: string;
}): Promise<{
    success: boolean;
    message: string;
    pdf?: string;
    filename?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: userData } = await supabase
        .from("user_profiles")
        .select("organization_id, full_name")
        .eq("id", user.id)
        .single();

    if (!userData) return { success: false, message: "Profile not found" };

    // Get organization info
    const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", userData.organization_id)
        .single();

    // Get attendance logs for this day/team/shift
    // Note: We'll filter from the DB or use the entries passed from the client
    // For simplicity and immediate response, we assume the caller provides the data 
    // or we fetch it based on organization_id and date.

    // For this implementation, we'll fetch all employees of the team 
    // and their latest log for the specific date.
    const { data: employees } = await supabase
        .from("employees")
        .select(`
            id, full_name, employee_id,
            attendance:attendance_logs(*)
        `)
        .eq("team_id", params.teamId)
        .order("full_name");

    const entries = (employees || []).map(emp => {
        const log = emp.attendance?.find((a: any) => a.check_in.startsWith(params.date));
        return {
            full_name: emp.full_name,
            employee_id: emp.employee_id,
            status: log?.status || 'absent',
            check_in: log?.check_in,
            notes: log?.notes
        };
    });

    const templateProps = {
        date: params.date,
        teamName: params.teamName,
        shiftName: params.shiftName,
        entries,
        organization: {
            name: org?.name || "SmartLab Enterprise",
            address: "Recursos Humanos / Qualidade",
        },
        supervisorName: userData.full_name
    };

    const document = React.createElement(AttendanceReportTemplate, templateProps as any);
    const buffer = await renderToBuffer(document as any);
    const base64 = buffer.toString("base64");
    const filename = `Attendance_${params.teamName}_${params.date}.pdf`;

    return {
        success: true,
        message: "PDF de assiduidade gerado",
        pdf: base64,
        filename
    };
}

/**
 * Generate CoA PDF for a sample
 * Returns a base64 encoded PDF
 */
export async function generateCoAPdf(sampleId: string): Promise<{
    success: boolean;
    message: string;
    pdf?: string;
    filename?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: userData } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id, full_name")
        .eq("id", user.id)
        .single();

    if (!userData) return { success: false, message: "Profile not found" };

    // Get organization info for header
    const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", userData.organization_id)
        .single();

    // Get sample data
    const { sample, analysis, error } = await getSampleForCoA(sampleId);

    if (error || !sample) {
        return { success: false, message: error || "Sample not found" };
    }

    // Map to CoA template props
    const templateProps = {
        sample: {
            id: sample.id,
            sample_code: sample.code,
            product_name: sample.batch?.product?.name || "N/A",
            batch_code: sample.batch?.code || "N/A",
            collection_date: new Date(sample.collected_at).toLocaleDateString(),
        },
        analyses: analysis.map((a: any) => ({
            parameter_name: a.parameter?.name || "Parameter",
            method_name: a.parameter?.code || undefined,
            result: String(a.value_numeric ?? a.value_text ?? "-"),
            unit: a.parameter?.unit || "",
            instrument: a.equipment?.name || "N/A", // Added instrument traceability
            min_limit: a.spec_min ?? undefined,
            max_limit: a.spec_max ?? undefined,
            status: a.is_conforming === true ? "compliant" as const :
                a.is_conforming === false ? "non_compliant" as const : "pending" as const,
        })),
        organization: {
            name: org?.name || "SmartLab Enterprise",
            address: "Quality Control Department",
        },
        approver: {
            name: userData.full_name || "Quality Manager",
            role: "QA Release",
        },
    };

    // Render PDF to buffer
    const document = React.createElement(CertificateOfAnalysis, templateProps);
    const buffer = await renderToBuffer(document as any);

    // Convert to base64
    const base64 = buffer.toString("base64");
    const filename = `CoA_${sample.code}_${new Date().toISOString().split("T")[0]}.pdf`;

    return {
        success: true,
        message: "PDF generated successfully",
        pdf: base64,
        filename,
    };
}

/**
 * Generate Batch Report PDF
 * Returns a base64 encoded PDF
 */
export async function generateBatchReportPdf(batchId: string): Promise<{
    success: boolean;
    message: string;
    pdf?: string;
    filename?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    // Get full traceability data
    const traceData = await getBatchTraceabilityAction(batchId);

    if (!traceData.success || !traceData.data) {
        return { success: false, message: traceData.message || "Batch not found" };
    }

    // Map to enterprise report DTO
    const reportData = mapToEnterpriseReport(traceData.data);

    // For batch reports, we use the HTML-based template approach
    // This requires a different rendering strategy (browser-based PDF)
    // For now, return report data that can be printed from the browser

    const filename = `BatchReport_${reportData.header.batchCode}_${new Date().toISOString().split("T")[0]}.pdf`;

    // Since @react-pdf/renderer templates are separate from HTML templates,
    // we'll signal to use browser print for now
    return {
        success: true,
        message: "Use browser print for batch reports",
        filename,
    };
}
