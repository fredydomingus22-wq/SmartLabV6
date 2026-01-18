import { getBatchReportData } from "@/lib/queries/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Package, CheckCircle, XCircle,
    Beaker, AlertTriangle, FlaskConical, Microscope, FileText
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerateBatchReportButton } from "./generate-batch-report-button";
import { PrintButton } from "@/components/smart/print-button";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function BatchReportDetailPage({ params }: PageProps) {
    const { id } = await params;
    const data = await getBatchReportData(id);

    if (!data.batch || data.error) {
        notFound();
    }

    const { batch, tanks, ingredients, samples, analysis, ncs, capas, microResults } = data;

    return (
        <div className="space-y-10 px-6 pb-20 print:space-y-4">
            <PageHeader
                title="Relatório Detalhado de Lote"
                overline={`Dossiê: ${batch.code}`}
                description="Rastreabilidade completa de matérias-primas, parâmetros de processo e qualidade final."
                icon={<Package className="h-4 w-4" />}
                backHref="/reports/batch"
                variant="emerald"
                actions={
                    <div className="flex items-center gap-2 print:hidden">
                        <PrintButton />
                        <GenerateBatchReportButton batchId={id} batchNumber={batch.batch_number} />
                    </div>
                }
            />

            {/* Report Content */}
            <div className="space-y-6 print:space-y-4">
                {/* Batch Info */}
                <Card className="glass border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden print:shadow-none">
                    <CardHeader className="border-b border-slate-800 bg-slate-900/50 p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                        <Package className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 italic">Dossiê de Fabrico & Rastreabilidade</h1>
                                </div>
                                <CardTitle className="text-3xl font-black italic tracking-tighter text-white uppercase">Production Batch Report</CardTitle>
                                <CardDescription className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">
                                    {batch.product?.name || "Produto Não Definido"} &bull; Lote {batch.code}
                                </CardDescription>
                            </div>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "font-black uppercase tracking-[0.2em] text-[10px] italic px-6 py-2 border shadow-inner",
                                    batch.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                )}
                            >
                                {batch.status === 'completed' ? 'Produção Finalizada' : 'Em Processamento'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-inner">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1">Cód. Lote</p>
                                <p className="font-mono font-black text-sm text-white italic tracking-tighter">{batch.code}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1">Início</p>
                                <p className="font-bold text-xs text-slate-300 italic">{batch.start_date ? new Date(batch.start_date).toLocaleDateString() : "-"}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1">Fim</p>
                                <p className="font-bold text-xs text-slate-300 italic">{batch.end_date ? new Date(batch.end_date).toLocaleDateString() : "-"}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1">Quantidade</p>
                                <p className="font-bold text-xs text-white uppercase">{batch.actual_quantity?.toLocaleString() || "0"} {batch.unit || "UN"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tanks & Ingredients */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="glass border-slate-800 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-900/30">
                            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Beaker className="h-4 w-4 text-emerald-500" />
                                Mapeamento de Tanques
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {(!tanks || tanks.length === 0) ? (
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 text-center py-4">Nenhum tanque associado</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {tanks.map((t: any) => (
                                        <div key={t.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
                                            <p className="font-black text-xs text-white uppercase italic">{t.tank?.name || t.tank_id}</p>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                                                Capacidade: {t.tank?.capacity_liters}L
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="glass border-slate-800 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-900/30">
                            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Package className="h-4 w-4 text-emerald-500" />
                                Componentes & Matéria-Prima
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {(!ingredients || ingredients.length === 0) ? (
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 text-center py-8">Nenhum registo de consumo</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="border-b border-slate-800">
                                            <tr className="bg-slate-900/50">
                                                <th className="text-left p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Material</th>
                                                <th className="text-left p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Lote MP</th>
                                                <th className="text-right p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Qtd</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {ingredients.map((ing: any) => (
                                                <tr key={ing.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-4 text-xs font-bold text-slate-300 uppercase">{ing.lot?.raw_material?.name || "-"}</td>
                                                    <td className="p-4 font-mono text-[10px] text-slate-500 font-bold">{ing.lot?.lot_number || "-"}</td>
                                                    <td className="p-4 text-right font-mono text-xs font-black text-white">{ing.quantity_used} {ing.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Analysis & Quality */}
                <Card className="glass border-slate-800 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-900/30">
                        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <FlaskConical className="h-4 w-4 text-emerald-500" />
                            Controlo Analítico de Qualidade
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {(!analysis || analysis.length === 0) ? (
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 text-center py-12">Nenhum resultado analítico disponível</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-slate-800">
                                        <tr className="bg-slate-900/50">
                                            <th className="text-left p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Amostra</th>
                                            <th className="text-left p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Parâmetro</th>
                                            <th className="text-right p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Valor</th>
                                            <th className="text-center p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {(analysis as any[]).map((a: any) => (
                                            <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-4 font-mono text-[10px] text-emerald-500 font-black italic">{a.sample?.code}</td>
                                                <td className="p-4 text-xs font-bold text-slate-300 uppercase">{a.parameter?.name}</td>
                                                <td className="p-4 text-right">
                                                    <span className="font-mono font-black text-sm text-white italic">
                                                        {a.value_numeric ?? a.value_text ?? "-"}
                                                    </span>
                                                    <span className="text-[8px] font-black text-slate-600 ml-1 uppercase">{a.parameter?.unit}</span>
                                                </td>
                                                <td className="p-4">
                                                    {a.is_conforming ? (
                                                        <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                                                    ) : a.is_conforming === false ? (
                                                        <XCircle className="h-4 w-4 text-rose-500 mx-auto" />
                                                    ) : (
                                                        <span className="text-slate-700 block text-center">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Nonconformities & Actions */}
                <div className="grid gap-6 md:grid-cols-2">
                    {ncs && ncs.length > 0 && (
                        <Card className="glass border-rose-500/20 rounded-2xl overflow-hidden bg-rose-500/[0.02]">
                            <CardHeader className="bg-rose-500/10">
                                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-rose-500">
                                    <AlertTriangle className="h-4 w-4" />
                                    Não Conformidades ({ncs.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {ncs.map((nc: any) => (
                                    <div key={nc.id} className="p-4 bg-slate-900/50 border border-rose-500/20 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-black text-xs text-rose-500 italic">{nc.nc_number}</span>
                                            <Badge variant={nc.status === "closed" ? "secondary" : "destructive"}>
                                                {nc.status === "closed" ? "Fechado" : "Aberto"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-bold text-slate-200 uppercase leading-tight">{nc.title}</p>
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-600">
                                            <span>Gravidade: {nc.severity}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {capas && capas.length > 0 && (
                        <Card className="glass border-blue-500/20 rounded-2xl overflow-hidden">
                            <CardHeader className="bg-blue-500/10">
                                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-blue-500">
                                    <CheckCircle className="h-4 w-4" />
                                    Ações Corretivas (CAPA)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {(capas as any[]).map((capa: any) => (
                                    <div key={capa.id} className="p-4 bg-slate-900/50 border border-blue-500/20 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-black text-xs text-blue-500 italic">{capa.action_number}</span>
                                            <Badge variant="outline" className="border-blue-500/30 text-blue-500">{capa.status}</Badge>
                                        </div>
                                        <p className="text-xs font-bold text-slate-300 italic">{capa.description}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-800 pt-8 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Autenticação do Dossiê</p>
                        <p className="text-[8px] font-bold text-slate-700 uppercase">Relatório gerado via SmartLab Production Engine</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Geração</p>
                        <p className="text-[10px] font-black text-slate-500 italic uppercase">
                            {new Date().toLocaleString("pt-PT", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
