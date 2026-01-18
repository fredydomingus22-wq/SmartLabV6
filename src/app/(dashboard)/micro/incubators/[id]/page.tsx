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
import { PageShell } from "@/components/defaults/page-shell";
import { PageHeader } from "@/components/layout/page-header";

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
            <PageShell>
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                    <div className="p-4 rounded-full bg-destructive/10">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold">Incubadora não encontrada</h1>
                    <Link href="/micro/incubators">
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                        </Button>
                    </Link>
                </div>
            </PageShell>
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
            <PageShell>
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                    <div className="p-4 rounded-full bg-destructive/10">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold">Erro ao carregar sessões</h1>
                    <p className="text-muted-foreground">Falha na comunicação com o banco de dados.</p>
                    <Link href="/micro/incubators">
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                        </Button>
                    </Link>
                </div>
            </PageShell>
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

    return (
        <PageShell>
            <PageHeader
                variant="purple"
                title={incubator.name}
                description="Detalhes e controlo da incubadora."
                backHref="/micro/incubators"
                actions={
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-8 px-3 border-emerald-500/30 text-emerald-500 bg-emerald-500/10 gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Operacional
                        </Badge>
                        <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-md border border-border">
                            <Thermometer className="h-4 w-4 text-primary" />
                            <span className="text-sm font-bold">{incubator.setpoint_temp_c}°C</span>
                        </div>
                        <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-md border border-border">
                            <StackIcon />
                            <span className="text-sm font-bold">{incubator.current_usage || 0} / {incubator.capacity_plates} Slots</span>
                        </div>
                    </div>
                }
            />

            <IncubatorDetailsClient
                activeSessions={activeSessions || []}
                historySessions={historySessions || []}
            />
        </PageShell>
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
