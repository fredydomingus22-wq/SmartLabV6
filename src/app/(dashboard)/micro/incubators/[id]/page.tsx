import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Thermometer, Clock, Beaker, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IncubatorDetailsClient } from "./incubator-details-client";

export const dynamic = "force-dynamic";

export default async function IncubatorDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();

    // Fetch Incubator Details
    const { data: incubator } = await supabase
        .from("micro_incubators")
        .select("*")
        .eq("id", params.id)
        .single();

    if (!incubator) {
        return (
            <div className="container py-8 flex flex-col items-center justify-center min-h-[50vh]">
                <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-200">Incubadora não encontrada</h1>
                <Link href="/micro/incubators">
                    <Button variant="ghost" className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                </Link>
            </div>
        );
    }

    // Common Query Fragment
    const sessionQuery = `
        id,
        started_at,
        ended_at,
        status,
        results:micro_results(
            id,
            qa_parameter:qa_parameters(
                id,
                name,
                analysis_time_minutes
            ),
            sample:samples(
                id, 
                code, 
                sample_type:sample_types(name),
                batch:production_batches(code, product:products(name))
            )
        )
    `;

    // Fetch Active Sessions
    const { data: activeSessions, error } = await supabase
        .from("micro_test_sessions")
        .select(sessionQuery)
        .eq("incubator_id", params.id)
        .eq("status", "incubating")
        .order("started_at", { ascending: false });

    if (error) {
        console.error("Sessions Fetch Error:", error);
        return (
            <div className="container py-8 flex flex-col items-center justify-center min-h-[50vh]">
                <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-200">Erro ao carregar sessões</h1>
                <p className="text-slate-400 mt-2">Falha na comunicação com o banco de dados.</p>
                <Link href="/micro/incubators">
                    <Button variant="ghost" className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                </Link>
            </div>
        );
    }

    // Fetch History Sessions
    const { data: historySessions } = await supabase
        .from("micro_test_sessions")
        .select(sessionQuery)
        .eq("incubator_id", params.id)
        .eq("status", "completed")
        .order("ended_at", { ascending: false })
        .limit(50);

    console.log("DEBUG: Sessions Fetch Data:", activeSessions ? `Found ${activeSessions.length} active sessions` : "null");

    return (
        <div className="container py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/micro/incubators">
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-slate-700 bg-slate-900/50 hover:bg-slate-800">
                            <ArrowLeft className="h-5 w-5 text-slate-400" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tight text-white">{incubator.name}</h1>
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                                Operacional
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-400 font-medium">
                            <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700">
                                <Thermometer className="h-3.5 w-3.5 text-orange-400" />
                                {incubator.setpoint_temp_c}°C
                            </span>
                            <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700">
                                <StackIcon />
                                {incubator.current_usage || 0} / {incubator.capacity_plates} Slots
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <IncubatorDetailsClient
                activeSessions={activeSessions || []}
                historySessions={historySessions || []}
            />
        </div>
    );
}

function StackIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-indigo-400"
        >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
        </svg>
    );
}
