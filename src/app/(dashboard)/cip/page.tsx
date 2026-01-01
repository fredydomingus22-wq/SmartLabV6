import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Sparkles, History, Settings, FileBarChart, Play } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

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
        <div className="container py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                        <Sparkles className="h-8 w-8 text-blue-400" />
                        Central CIP (Clean-in-Place)
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Gestão centralizada de limpeza e higienização industrial.
                    </p>
                </div>
                <Link href="/cip/register">
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20">
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar Nova Limpeza
                    </Button>
                </Link>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/cip/register" className="group">
                    <GlassCard className="h-full p-6 hover:border-blue-500/30 transition-all flex flex-col justify-between group-hover:bg-white/[0.03]">
                        <div>
                            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Play className="h-6 w-6 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-200 mb-2">Execução</h3>
                            <p className="text-sm text-slate-400">
                                Iniciar e monitorar ciclos de limpeza CIP em equipamentos.
                            </p>
                        </div>
                    </GlassCard>
                </Link>

                <Link href="/cip/programs" className="group">
                    <GlassCard className="h-full p-6 hover:border-purple-500/30 transition-all flex flex-col justify-between group-hover:bg-white/[0.03]">
                        <div>
                            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Settings className="h-6 w-6 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-200 mb-2">Programas</h3>
                            <p className="text-sm text-slate-400">
                                Configurar receitas de limpeza (passos, químicos, tempos).
                            </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-mono text-purple-300">
                            <span className="font-bold">{totalPrograms}</span> Programas Ativos
                        </div>
                    </GlassCard>
                </Link>

                <Link href="/cip/history" className="group">
                    <GlassCard className="h-full p-6 hover:border-emerald-500/30 transition-all flex flex-col justify-between group-hover:bg-white/[0.03]">
                        <div>
                            <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <History className="h-6 w-6 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-200 mb-2">Histórico</h3>
                            <p className="text-sm text-slate-400">
                                Logs completos de todas as execuções de CIP para auditoria.
                            </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-mono text-emerald-300">
                            <span className="font-bold">{totalHistory}</span> Registros
                        </div>
                    </GlassCard>
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
