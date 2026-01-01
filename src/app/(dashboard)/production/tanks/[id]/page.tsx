import { getTankWithContentAction } from "@/app/actions/tanks";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Container, Droplets, History, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { TankDialog } from "../_components/tank-dialog";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface PageProps {
    params: {
        id: string;
    }
}

const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cleaning: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    decommissioned: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default async function TankDetailsPage({ params }: PageProps) {
    const { id } = params;
    const result = await getTankWithContentAction(id);

    if (!result.success || !result.data) {
        notFound();
    }

    const tank = result.data;
    const content = tank.currentContent;

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/production/tanks">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-white hover:bg-white/5">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                        <Container className="h-8 w-8 text-blue-400" />
                        {tank.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-1 text-slate-400 text-sm font-mono uppercase tracking-wider">
                        <span>{tank.code}</span>
                        <span>•</span>
                        <Badge className={statusColors[tank.status] || statusColors.active}>
                            {tank.status}
                        </Badge>
                    </div>
                </div>
                <TankDialog tank={tank} trigger={
                    <Button variant="outline" className="border-slate-700 bg-slate-900/50 hover:bg-slate-800">
                        Editar Configurações
                    </Button>
                } />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Current Content Section */}
                    <GlassCard className="p-6">
                        <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                            <Droplets className="h-5 w-5 text-blue-400" />
                            Conteúdo Atual
                        </h2>

                        {content ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <div className="text-xs font-mono uppercase text-slate-500">Produto</div>
                                    <div className="text-2xl font-bold text-white">
                                        {content.batch?.product?.name || "Produto Desconhecido"}
                                    </div>
                                    <div className="text-sm text-blue-400 font-mono">
                                        Lote: {content.batch?.code || content.code}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-400">Volume</span>
                                            <span className="text-slate-200 font-mono">
                                                {content.volume} / {tank.capacity} {tank.capacity_unit}
                                            </span>
                                        </div>
                                        {/* Simple Progress Bar */}
                                        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-500"
                                                style={{ width: `${Math.min(100, ((content.volume || 0) / (tank.capacity || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <div className="text-[10px] uppercase text-slate-500 mb-1">Status Lote</div>
                                            <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
                                                {content.status}
                                            </Badge>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <div className="text-[10px] uppercase text-slate-500 mb-1">Entrada</div>
                                            <div className="text-sm font-mono text-slate-300">
                                                Hoje {/* Placeholder for entry date */}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
                                <Droplets className="h-10 w-10 mb-3 opacity-20" />
                                <p>Tanque Vazio</p>
                                <Button variant="link" className="text-blue-400 mt-2">
                                    Registrar Entrada de Lote
                                </Button>
                            </div>
                        )}
                    </GlassCard>

                    {/* Recent Activities / Logs Placeholder */}
                    <GlassCard className="p-6">
                        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                            <History className="h-5 w-5 text-slate-400" />
                            Histórico Recente
                        </h2>
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex gap-4 p-3 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5">
                                    <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-200">Limpeza CIP Concluída</div>
                                        <div className="text-xs text-slate-500">Realizado por: João Silva • Há {i + 1} dias</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <GlassCard className="p-6 space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Especificações</h3>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-sm text-slate-400">Capacidade</span>
                                <span className="text-sm font-mono text-white">{tank.capacity} {tank.capacity_unit}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-sm text-slate-400">Código</span>
                                <span className="text-sm font-mono text-white">{tank.code}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-sm text-slate-400">Instalado em</span>
                                <span className="text-sm font-mono text-white">
                                    {tank.created_at ? format(new Date(tank.created_at), "dd/MM/yyyy") : "-"}
                                </span>
                            </div>
                        </div>

                        {tank.description && (
                            <div className="pt-2">
                                <span className="text-xs text-slate-500 block mb-1">Descrição</span>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    {tank.description}
                                </p>
                            </div>
                        )}
                    </GlassCard>

                    <GlassCard className="p-6 border-red-500/20 bg-red-500/5">
                        <h3 className="text-sm font-black uppercase tracking-widest text-red-400 mb-4 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Zone Perigosa
                        </h3>
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start border-red-500/20 hover:bg-red-500/10 text-red-200 hover:text-red-100">
                                <XCircle className="h-4 w-4 mr-2" />
                                Reportar Avaria
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
