import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Droplets, CheckCircle, XCircle, Factory, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getCIPData() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get CIP cycles
    const { data: cycles } = await supabase
        .from("cip_executions")
        .select(`
            *,
            executed_by:user_profiles!cip_executions_performed_by_fkey(full_name),
            recipe:cip_recipes(name)
        `)
        .eq("organization_id", user.organization_id)
        .order("start_time", { ascending: false })
        .limit(50);

    return { cycles: cycles || [] };
}

export default async function CIPReportPage() {
    const { cycles } = await getCIPData();

    return (
        <div className="space-y-10 px-6 pb-20">
            <PageHeader
                title="Relatórios de Ciclos CIP"
                overline="Sanitization Intelligence"
                description="Documentação técnica de higienização, parâmetros químicos e conformidade de tanques."
                icon={<Droplets className="h-4 w-4" />}
                backHref="/reports"
                variant="cyan"
            />

            {/* Cycles List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 italic">
                        <Factory className="h-3 w-3" />
                        Histórico de Higienização ({cycles.length})
                    </h2>
                    <Badge variant="outline" className="border-slate-800 text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 bg-slate-900/50">
                        QUALIDADE & SEGURANÇA
                    </Badge>
                </div>

                {cycles.length === 0 ? (
                    <div className="rounded-[2rem] border border-slate-800 bg-card p-16 text-center space-y-4 shadow-xl border-dashed">
                        <Droplets className="h-12 w-12 mx-auto text-slate-800 opacity-50" />
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Nenhum ciclo CIP registado.</p>
                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em]">Execute as operações de limpeza no módulo CIP.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {cycles.map((cycle: any) => (
                            <Link href={`/reports/cip/${cycle.id}`} key={cycle.id}>
                                <div className="group flex items-center justify-between p-4 bg-card border border-slate-800 rounded-2xl hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all cursor-pointer shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-cyan-500/30 transition-colors">
                                            <Droplets className="h-5 w-5 text-cyan-500" />
                                        </div>
                                        <div>
                                            <p className="font-mono font-black text-sm text-white italic tracking-tighter leading-tight">
                                                {cycle.cycle_code || `CIP-${cycle.id.substring(0, 8)}`}
                                            </p>
                                            <p className="text-[10px] font-black uppercase tracking-tight text-slate-500">
                                                {cycle.recipe?.name || "Ciclo Padrão"} &bull; Operador: {cycle.executed_by?.full_name || "-"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden md:block text-right">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Execução</p>
                                            <p className="text-xs font-bold text-slate-400">
                                                {cycle.start_time
                                                    ? new Date(cycle.start_time).toLocaleDateString()
                                                    : "-"}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "font-black uppercase tracking-tighter text-[9px] border shadow-inner italic px-3 py-1",
                                                cycle.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    cycle.status === 'failed' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            )}
                                        >
                                            {cycle.status === 'completed' ? 'Finalizado' :
                                                cycle.status === 'failed' ? 'Falha Técnica' :
                                                    cycle.status === 'in_progress' ? 'Em Curso' : cycle.status}
                                        </Badge>
                                        <Button size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-[0.2em] bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-500 shadow-lg group-hover:scale-105 transition-transform">
                                            View Dossiê
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
