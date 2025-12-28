"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List as ListIcon, Clock, AlertCircle, CheckCircle2, Beaker, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { RegisterReadingDialog } from "./register-reading-dialog";
import Link from "next/link";

export function IncubatorDetailsClient({ activeSessions, historySessions }: { activeSessions: any[], historySessions: any[] }) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    return (
        <div className="space-y-6">
            <Tabs defaultValue="active" className="w-full">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <TabsList className="bg-slate-900/50 border border-slate-800">
                        <TabsTrigger value="active" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                            Em Incubação
                            <Badge variant="secondary" className="ml-2 bg-blue-500/20 text-blue-300 text-[10px] h-5 px-1.5 min-w-[20px] justify-center">
                                {activeSessions?.length || 0}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200">
                            Histórico
                            <Badge variant="secondary" className="ml-2 bg-slate-800 text-slate-400 text-[10px] h-5 px-1.5 min-w-[20px] justify-center">
                                {historySessions?.length || 0}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className={cn("h-8 w-8 p-0 rounded-md", viewMode === "grid" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className={cn("h-8 w-8 p-0 rounded-md", viewMode === "list" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200")}
                        >
                            <ListIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <TabsContent value="active" className="mt-0">
                    <SessionList sessions={activeSessions} viewMode={viewMode} isActive={true} />
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                    <SessionList sessions={historySessions} viewMode={viewMode} isActive={false} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function SessionList({ sessions, viewMode, isActive }: { sessions: any[], viewMode: "grid" | "list", isActive: boolean }) {
    if (!sessions || sessions.length === 0) {
        return (
            <div className="py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                <Beaker className="h-10 w-10 text-slate-700 mb-3" />
                <p className="text-slate-500 font-medium">Nenhum registro encontrado.</p>
            </div>
        );
    }

    if (viewMode === "list") {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800 bg-slate-900/60 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <div className="col-span-2">Código</div>
                    <div className="col-span-4">Produto/Lote</div>
                    <div className="col-span-3">Status/Tempo</div>
                    <div className="col-span-3 text-right">Ações</div>
                </div>
                <div className="divide-y divide-slate-800/50">
                    {sessions.map((session) => (
                        <SessionListItem key={session.id} session={session} isActive={isActive} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
                <SessionCard key={session.id} session={session} isActive={isActive} />
            ))}
        </div>
    );
}

function SessionCard({ session, isActive }: { session: any, isActive: boolean }) {
    const { sample, status, results } = session;
    const { timeElapsed, timeRemaining, isReady, endAtFormatted } = useIncubationTiming(session);

    // Fallback info extraction
    const firstResult = results?.[0];
    const actualSample = firstResult?.sample || sample; // Prefer explicit sample join if available, else fallback

    if (!actualSample) return null;

    const productName = actualSample.batch?.product?.name || actualSample.sample_type?.name || "Amostra";
    const sampleCode = actualSample.code;

    return (
        <div className={cn(
            "group relative overflow-hidden rounded-2xl border transition-all p-5 flex flex-col justify-between",
            isActive && isReady ? "bg-emerald-950/20 border-emerald-500/30 hover:bg-emerald-900/20" : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
        )}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Código
                    </div>
                    <div className="font-mono text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                        <Link href={`/micro/samples/${actualSample.id}`} className="hover:underline">
                            {sampleCode}
                        </Link>
                    </div>
                </div>
                {isActive ? (
                    isReady ? (
                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 animate-pulse border-none">Pronto</Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-300 border-blue-500/20">Em Curso</Badge>
                    )
                ) : (
                    <Badge variant="outline" className="border-slate-700 text-slate-400">Concluído</Badge>
                )}
            </div>

            <div className="space-y-3">
                <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        Produto / Produto
                    </div>
                    <div className="text-sm font-medium text-slate-300 truncate" title={productName}>
                        {productName}
                    </div>
                    {actualSample.batch?.code && (
                        <div className="text-xs text-slate-500 mt-1">Lote: {actualSample.batch.code}</div>
                    )}
                </div>

                <div className="pt-3 border-t border-slate-800/50 space-y-2">
                    {isActive ? (
                        <>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Clock className="h-4 w-4 text-orange-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Decorrido</span>
                                </div>
                                <span className="text-sm font-black text-slate-200">{timeElapsed}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <AlertCircle className={cn("h-4 w-4", isReady ? "text-emerald-400" : "text-blue-400")} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{isReady ? "Status" : "Fim Previsto"}</span>
                                </div>
                                <div className="text-right">
                                    <span className={cn("text-sm font-black block", isReady ? "text-emerald-400" : "text-blue-300")}>
                                        {isReady ? "Pronto!" : timeRemaining}
                                    </span>
                                    {!isReady && <span className="text-[10px] text-slate-500 font-medium">{endAtFormatted}</span>}
                                </div>
                            </div>
                            <RegisterReadingDialog
                                sessionId={session.id}
                                results={results || []}
                                sampleCode={sampleCode}
                                trigger={
                                    <Button size="sm" variant="outline" className="w-full mt-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-medium">
                                        Registrar Leitura
                                    </Button>
                                }
                            />
                        </>
                    ) : (
                        <div>
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs font-bold uppercase tracking-wider">Finalizado</span>
                            </div>
                            {/* TODO: Show results summary here */}
                            <Button variant="outline" size="sm" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                                <FileText className="mr-2 h-3.5 w-3.5" /> Ver Detalhes
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SessionListItem({ session, isActive }: { session: any, isActive: boolean }) {
    const { timeElapsed, timeRemaining, isReady } = useIncubationTiming(session);
    const firstResult = session.results?.[0];
    const actualSample = firstResult?.sample || session.sample;

    if (!actualSample) return null;

    return (
        <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/20 transition-colors">
            <div className="col-span-2 font-mono text-sm font-bold text-white">
                <Link href={`/micro/samples/${actualSample.id}`} className="hover:underline hover:text-blue-400">
                    {actualSample.code}
                </Link>
            </div>
            <div className="col-span-4">
                <div className="text-sm font-medium text-slate-300 truncate">{actualSample.batch?.product?.name || "Amostra"}</div>
                {actualSample.batch?.code && <div className="text-[11px] text-slate-500">{actualSample.batch.code}</div>}
            </div>
            <div className="col-span-3">
                {isActive ? (
                    <div className="space-y-1">
                        <Badge variant="outline" className={cn("border-none pl-0", isReady ? "text-emerald-400" : "text-blue-400")}>
                            {isReady ? "Pronto para Leitura" : "Em Incubação"}
                        </Badge>
                        <div className="text-[11px] text-slate-500">{timeElapsed}</div>
                    </div>
                ) : (
                    <Badge variant="outline" className="border-slate-700 text-slate-400">Concluído</Badge>
                )}
            </div>
            <div className="col-span-3 text-right">
                {isActive ? (
                    <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-medium">
                        Registrar
                    </Button>
                ) : (
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <FileText className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

// Hook-like helper for logic reuse
function useIncubationTiming(session: any) {
    const startedAt = session.started_at ? new Date(session.started_at) : new Date();

    // Find max required duration from parameters
    let maxDurationMinutes = 0;
    if (session.results && Array.isArray(session.results)) {
        session.results.forEach((r: any) => {
            const minutes = r.qa_parameter?.analysis_time_minutes || 0;
            if (minutes > maxDurationMinutes) maxDurationMinutes = minutes;
        });
    }

    // Fallback
    if (maxDurationMinutes === 0) maxDurationMinutes = 48 * 60;

    const endAt = new Date(startedAt.getTime() + maxDurationMinutes * 60000);
    const now = new Date();
    const isReady = now >= endAt;

    const timeElapsed = formatDistanceToNow(startedAt, { addSuffix: false, locale: ptBR });
    const timeRemaining = isReady
        ? "Pronto"
        : formatDistanceToNow(endAt, { addSuffix: true, locale: ptBR });

    const endAtFormatted = endAt.toLocaleDateString('pt-PT', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });

    return { timeElapsed, timeRemaining, isReady, endAtFormatted };
}
