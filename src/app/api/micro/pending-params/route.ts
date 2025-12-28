import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const sampleId = searchParams.get('sampleId');

    if (!sampleId) {
        return NextResponse.json({ error: "Sample ID is required" }, { status: 400 });
    }

    try {
        // Fetch pending micro_results for this sample
        const { data: results, error } = await supabase
            .from("micro_results")
            .select(`
                id,
                qa_parameter:qa_parameters(
                    id,
                    name,
                    incubation_temp_c
                )
            `)
            .eq("sample_id", sampleId)
            .eq("status", "pending");

        if (error) {
            console.error("Error fetching pending params:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const params = results?.map(r => ({
            resultId: r.id,
            parameterId: r.qa_parameter?.id || '',
            parameterName: r.qa_parameter?.name || 'Unknown',
            incubationTempC: r.qa_parameter?.incubation_temp_c || null
        })) || [];

        return NextResponse.json({ params });
    } catch (error: any) {
        console.error("Error in pending-params API:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
