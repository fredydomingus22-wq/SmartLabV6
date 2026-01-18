import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Microscope, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function MicroReportListPage() {
    const supabase = await createClient();

    const { data: sessions } = await supabase
        .from("micro_test_sessions")
        .select("id, session_code, test_type, status, started_at")
        .order("started_at", { ascending: false })
        .limit(50);

    return (
        <div className="space-y-10 px-6 pb-20">
            <PageHeader
                title="Dossiês de Microbiologia"
                overline="Biological Safety & Hygiene"
                description="Relatórios técnicos de sessões laboratoriais, monitorização ambiental e superfícies."
                icon={<Microscope className="h-4 w-4" />}
                backHref="/reports"
                variant="purple"
            />

            {/* Sessions List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 italic">
                        <Microscope className="h-3 w-3" />
                        Sessões de Teste Registadas ({sessions?.length || 0})
                    </h2>
                    <Badge variant="outline" className="border-slate-800 text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 bg-slate-900/50">
                        MONITORIZAÇÃO ATIVA
                    </Badge>
                </div>

                {!sessions || sessions.length === 0 ? (
                    <div className="rounded-[2rem] border border-slate-800 bg-card p-16 text-center space-y-4 shadow-xl border-dashed">
                        <Microscope className="h-12 w-12 mx-auto text-slate-800 opacity-50" />
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Nenhuma sessão de micro disponível.</p>
                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em]">Inicie uma sessão no módulo de microbiologia.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {sessions.map((session: any) => (
                            <Link href={`/reports/micro/${session.id}`} key={session.id}>
                                <div className="group flex items-center justify-between p-4 bg-card border border-slate-800 rounded-2xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-purple-500/30 transition-colors">
                                            <FileText className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="font-mono font-black text-sm text-white italic tracking-tighter">
                                                {session.session_code}
                                            </p>
                                            <p className="text-[10px] font-black uppercase tracking-tight text-slate-500">
                                                {session.test_type}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden md:block text-right">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Início</p>
                                            <p className="text-xs font-bold text-slate-400">
                                                {session.started_at
                                                    ? new Date(session.started_at).toLocaleDateString()
                                                    : "-"}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "font-black uppercase tracking-tighter text-[9px] border shadow-inner italic px-3 py-1 bg-purple-500/10 text-purple-500 border-purple-500/20"
                                            )}
                                        >
                                            {session.status || "Finalizado"}
                                        </Badge>
                                        <Button size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-[0.2em] bg-purple-600 hover:bg-purple-700 text-white border-purple-500 shadow-lg group-hover:scale-105 transition-transform">
                                            Ver Protocolo
                                        </Button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
