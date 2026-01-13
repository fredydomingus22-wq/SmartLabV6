import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Sparkles, History, Settings, FileBarChart, Play, Activity } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { PageHeader } from "@/components/layout/page-header";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { GlassCard } from "@/components/ui/glass-card";

export default async function CIPDashboard() {
    const supabase = await createClient();

    // Fetch active CIPs
    const { data: activeCIPs } = await supabase
        .from("cip_logs")
        .select(`
            *,
            program:cip_programs(name),
            equipment:process_equipment(name)
        `)
        .eq("status", "in_progress")
        .limit(5);

    // Fetch stats
    const { count: totalPrograms } = await supabase.from("cip_programs").select("*", { count: 'exact', head: true });
    const { count: totalHistory } = await supabase.from("cip_logs").select("*", { count: 'exact', head: true });

    return (
        <div className="space-y-10">
            <PageHeader
                variant="blue"
                icon={<Sparkles className="h-4 w-4" />}
                overline="Saneamento Industrial • GAMP 5"
                title="Central CIP (Clean-in-Place)"
                description="Gestão centralizada de limpeza e higienização industrial."
                actions={
                    <Link href="/cip/register">
                        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20 rounded-xl">
                            <Play className="h-4 w-4 mr-2" />
                            Iniciar Nova Limpeza
                        </Button>
                    </Link>
                }
            />

            {/* Premium KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPISparkCard
                    variant="blue"
                    title="Limpezas Ativas"
                    value={activeCIPs?.length.toString() || "0"}
                    description="Ciclos em execução"
                    icon={<Activity className="h-4 w-4" />}
                    data={Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 5) + 2 }))}
                />
                <KPISparkCard
                    variant="purple"
                    title="Programas CIP"
                    value={totalPrograms?.toString() || "0"}
                    description="Receitas configuradas"
                    icon={<Settings className="h-4 w-4" />}
                    data={Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 10) + 5 }))}
                />
                <KPISparkCard
                    variant="emerald"
                    title="Histórico Total"
                    value={totalHistory?.toString() || "0"}
                    description="Registos de auditoria"
                    icon={<History className="h-4 w-4" />}
                    data={Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 50) + 100 }))}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/cip/programs">
                    <Button variant="outline" className="w-full h-24 glass border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 hover:border-purple-500/30 transition-all">
                        <Settings className="h-6 w-6 text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Configurar Programas</span>
                    </Button>
                </Link>
                <Link href="/cip/history">
                    <Button variant="outline" className="w-full h-24 glass border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 hover:border-emerald-500/30 transition-all">
                        <History className="h-6 w-6 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ver Histórico Completo</span>
                    </Button>
                </Link>
            </div>

            {/* Active CIPs Section */}
            <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-400" />
                        Em Execução Agora
                    </h2>
                </div>

                {activeCIPs && activeCIPs.length > 0 ? (
                    <div className="divide-y divide-white/5">
                        {activeCIPs.map((log) => (
                            <div key={log.id} className="py-4 flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold text-slate-200">
                                        {log.equipment?.name || "Equipamento Desconhecido"}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {log.program?.name} • Iniciado em {format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-wider animate-pulse border border-blue-500/20">
                                        Em Progresso
                                    </span>
                                    <Link href={`/cip/register`}>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                            <Play className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                        <Sparkles className="h-10 w-10 text-slate-700 mx-auto mb-3 opacity-20" />
                        <p className="text-slate-500">Nenhuma limpeza CIP em andamento.</p>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
