import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sampleId = searchParams.get("sampleId");

    if (!sampleId) {
        return NextResponse.json({ results: [] });
    }

    try {
        const supabase = await createClient();

        const { data: results, error } = await supabase
            .from("lab_analysis")
            .select("qa_parameter_id")
            .eq("sample_id", sampleId);

        if (error) throw error;

        return NextResponse.json({ results: results || [] });
    } catch (error) {
        console.error("Error fetching results:", error);
        return NextResponse.json({ results: [], error: "Failed to fetch" }, { status: 500 });
    }
}
