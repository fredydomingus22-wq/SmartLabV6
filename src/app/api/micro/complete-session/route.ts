import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface ReadingPayload {
    resultId: string;
    value: string;
    unit: string;
    notes: string;
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    try {
        const body = await request.json();
        const { sessionId, readings } = body as { sessionId: string; readings: ReadingPayload[] };

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        // Update each micro_result with reading values
        for (const reading of readings) {
            const { error: updateError } = await supabase
                .from("micro_results")
                .update({
                    result_text: reading.value,
                    // If numeric, also set colony_count
                    colony_count: isNaN(parseFloat(reading.value)) ? null : parseFloat(reading.value),
                    notes: reading.notes || null,
                    status: 'completed',
                    read_at: new Date().toISOString(),
                })
                .eq("id", reading.resultId);

            if (updateError) {
                console.error("Error updating micro_result:", updateError);
                throw updateError;
            }
        }

        // Update session status to completed
        const { error: sessionError } = await supabase
            .from("micro_test_sessions")
            .update({
                status: "completed",
                ended_at: new Date().toISOString(),
            })
            .eq("id", sessionId);

        if (sessionError) {
            console.error("Error updating session:", sessionError);
            throw sessionError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error in complete-session API:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
