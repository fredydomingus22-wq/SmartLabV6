import { getBatchesForReport } from "@/lib/queries/reports";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function BatchReportListPage() {
    const { data: batches } = await getBatchesForReport();

    return (
        <div className="space-y-10 px-6 pb-20">
            <PageHeader
                title="Relatórios de Produção por Lote"
                overline="Traceability Engine"
                description="Rastreabilidade total, análises, NCs e dados de qualidade por lote de fabrico."
                icon={<Package className="h-4 w-4" />}
                backHref="/reports"
                variant="emerald"
            />

            {/* Batches List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 italic">
                        <Package className="h-3 w-3" />
                        Lotes Registados em Produção ({batches.length})
                    </h2>
                    <Badge variant="outline" className="border-slate-800 text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 bg-slate-900/50">
                        RASTREABILIDADE ATIVA
                    </Badge>
                </div>

                {batches.length === 0 ? (
                    <div className="rounded-[2rem] border border-slate-800 bg-card p-16 text-center space-y-4 shadow-xl border-dashed">
                        <Package className="h-12 w-12 mx-auto text-slate-800 opacity-50" />
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Nenhum lote disponível para consulta.</p>
                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em]">Inicie uma ordem de produção no módulo MES.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {batches.map((batch: any) => (
                            <Link href={`/reports/batch/${batch.id}`} key={batch.id}>
                                <div className="group flex items-center justify-between p-4 bg-card border border-slate-800 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-emerald-500/30 transition-colors">
                                            <Package className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="font-mono font-black text-sm text-white italic tracking-tighter">
                                                {batch.code}
                                            </p>
                                            <p className="text-[10px] font-black uppercase tracking-tight text-slate-500">
                                                {batch.product?.name || "Produto Não Definido"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden md:block text-right">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Início</p>
                                            <p className="text-xs font-bold text-slate-400">
                                                {batch.start_date
                                                    ? new Date(batch.start_date).toLocaleDateString()
                                                    : "-"}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "font-black uppercase tracking-tighter text-[9px] border shadow-inner italic px-3 py-1",
                                                batch.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    batch.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        batch.status === 'on_hold' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                            )}
                                        >
                                            {batch.status === 'completed' ? 'Finalizado' :
                                                batch.status === 'in_progress' ? 'Em Curso' :
                                                    batch.status === 'on_hold' ? 'Em Pausa' :
                                                        batch.status === 'planned' ? 'Planeado' : batch.status}
                                        </Badge>
                                        <Button size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-[0.2em] bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-lg group-hover:scale-105 transition-transform">
                                            Consultar Dossiê
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
