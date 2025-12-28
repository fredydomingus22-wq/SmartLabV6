import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    try {
        const body = await request.json();
        const { incubatorId, sampleId, mediaLotId, resultIds } = body as {
            incubatorId: string;
            sampleId: string;
            mediaLotId: string;
            resultIds: string[];
        };

        if (!incubatorId || !sampleId || !mediaLotId || !resultIds?.length) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user profile for org/plant
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("organization_id, plant_id")
            .eq("id", user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: "User profile not found" }, { status: 400 });
        }

        // Create Test Session
        const { data: session, error: sessionError } = await supabase
            .from("micro_test_sessions")
            .insert({
                organization_id: profile.organization_id,
                plant_id: profile.plant_id,
                incubator_id: incubatorId,
                started_by: user.id,
                status: "incubating"
            })
            .select("id")
            .single();

        if (sessionError) {
            console.error("Error creating session:", sessionError);
            return NextResponse.json({ error: sessionError.message }, { status: 500 });
        }

        // Update the selected micro_results to link them to this session
        const { error: updateError } = await supabase
            .from("micro_results")
            .update({
                test_session_id: session.id,
                media_lot_id: mediaLotId,
                status: "incubating"
            })
            .in("id", resultIds);

        if (updateError) {
            console.error("Error updating results:", updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Update sample status to in_analysis
        await supabase
            .from("samples")
            .update({ status: "in_analysis" })
            .eq("id", sampleId);

        revalidatePath("/micro/incubators");
        revalidatePath("/micro/samples");

        return NextResponse.json({
            success: true,
            message: `Incubation started with ${resultIds.length} parameter(s)`,
            sessionId: session.id
        });
    } catch (error: any) {
        console.error("Error in start-incubation API:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
