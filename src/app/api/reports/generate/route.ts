import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReport } from "@/lib/reports/engine";
import { ReportType } from "@/lib/reports/registry";
import { getSafeUser } from "@/lib/auth.server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const user = await getSafeUser();

        // 1. Get User Permissions
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        // For now, map simple roles to permissions. 
        // In a real system, we'd query the permissions table.
        // This is a temporary mapping for Sprint 1.
        let permissions: string[] = [];
        if (profile?.role === "admin" || profile?.role === "manager") {
            permissions = ["quality.reports.create", "production.reports.view"];
        } else if (profile?.role === "lab_lead" || profile?.role === "lab_analyst") {
            permissions = ["quality.reports.create"];
        } else if (profile?.role === "production_lead") {
            permissions = ["production.reports.view"];
        }

        const body = await req.json();
        const { reportType, params } = body;

        if (!reportType) {
            return NextResponse.json({ error: "Report type required" }, { status: 400 });
        }

        // 2. Generate Report
        const result = await generateReport(
            reportType as ReportType,
            params || {},
            permissions
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            pdf: result.pdf, // Base64
            filename: result.filename
        });

    } catch (error: any) {
        console.error("API Report generation error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
