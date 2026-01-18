import { getMicroReportData } from "@/lib/queries/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Microscope, Printer, CheckCircle, XCircle, Thermometer, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { PrintButton } from "@/components/smart/print-button";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function MicroReportDetailPage({ params }: PageProps) {
    const { id } = await params;
    const { session, results, error } = await getMicroReportData(id);

    if (!session || error) {
        notFound();
    }

    return (
        <div className="space-y-10 px-6 pb-20 print:space-y-4">
            <PageHeader
                title="Relatório Microbiológico"
                overline={`Sessão: ${session.session_code}`}
                description="Monitorização de crescimento microbiológico, meios de cultura e incubação."
                icon={<Microscope className="h-4 w-4" />}
                backHref="/reports/micro"
                variant="purple"
                actions={
                    <div className="flex items-center gap-2 print:hidden">
                        <PrintButton />
                    </div>
                }
            />

            {/* Report Content */}
            <Card className="glass border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden print:shadow-none">
                <CardHeader className="border-b border-slate-800 bg-slate-900/50 p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                    <Microscope className="h-4 w-4 text-purple-500" />
                                </div>
                                <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 italic">Protocolo de Segurança Biológica</h1>
                            </div>
                            <CardTitle className="text-3xl font-black italic tracking-tighter text-white uppercase">Microbiology Test Report</CardTitle>
                            <CardDescription className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest leading-relaxed">
                                {session.test_type || "Análise Geral"} &bull; Sessão {session.session_code}
                            </CardDescription>
                        </div>
                        <Badge
                            variant="outline"
                            className={cn(
                                "font-black uppercase tracking-[0.2em] text-[10px] italic px-6 py-2 border shadow-inner",
                                session.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                            )}
                        >
                            {session.status === 'completed' ? 'Protocolo Finalizado' : 'Incubação em Curso'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    {/* Session Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-inner">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1">Cód. Sessão</p>
                            <p className="font-mono font-black text-sm text-white italic tracking-tighter">{session.session_code}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Incubadora</p>
                            <div className="flex items-center gap-2">
                                <Thermometer className="h-3 w-3 text-purple-500" />
                                <p className="font-bold text-xs text-slate-300 uppercase leading-tight">{session.incubator?.name || "-"}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Setpoint</p>
                            <p className="font-mono font-black text-xs text-blue-400 italic">{session.incubator?.temperature_setpoint}°C</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Início</p>
                            <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-slate-600" />
                                <p className="font-bold text-xs text-slate-300 italic">{session.started_at ? new Date(session.started_at).toLocaleDateString() : "-"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Microscope className="h-4 w-4 text-slate-500" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Resultados das Determinações Microbiológicas</h3>
                        </div>
                        {results.length === 0 ? (
                            <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl">
                                <Microscope className="h-8 w-8 mx-auto text-slate-800 mb-4" />
                                <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Nenhum resultado registado para esta sessão.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden border border-slate-800 rounded-2xl shadow-xl">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900 border-b border-slate-800">
                                            <th className="text-left p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Meio de Cultura</th>
                                            <th className="text-left p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Cód. Meio</th>
                                            <th className="text-right p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Resultado (UFC)</th>
                                            <th className="text-center p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {results.map((result: any) => (
                                            <tr key={result.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-4 text-xs font-bold text-slate-300 uppercase">{result.media?.name || "-"}</td>
                                                <td className="p-4 font-mono text-[10px] text-slate-500 font-bold">{result.media?.code || "-"}</td>
                                                <td className="p-4 text-right">
                                                    <span className="font-mono font-black text-sm text-white italic">
                                                        {result.result ?? result.cfu_count ?? "-"}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {result.is_conforming === true ? (
                                                        <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                                                    ) : result.is_conforming === false ? (
                                                        <XCircle className="h-4 w-4 text-rose-500 mx-auto" />
                                                    ) : (
                                                        <Badge variant="outline" className="text-[8px] font-black bg-slate-900 mx-auto block w-fit">PENDENTE</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl text-center">
                            <p className="text-2xl font-black text-white italic">{results.length}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Total de Ensaios</p>
                        </div>
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center">
                            <p className="text-2xl font-black text-emerald-500 italic">
                                {results.filter((r: any) => r.is_conforming === true).length}
                            </p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mt-1">Conformes</p>
                        </div>
                        <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-center">
                            <p className="text-2xl font-black text-rose-500 italic">
                                {results.filter((r: any) => r.is_conforming === false).length}
                            </p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 mt-1">Não Conformes</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-800 pt-8 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Autenticação Bio-Segurança</p>
                            <p className="text-[8px] font-bold text-slate-700 uppercase">Protocolo gerado via SmartLab Micro Core</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Emissão de Relatório</p>
                            <p className="text-[10px] font-black text-slate-500 italic uppercase">
                                {new Date().toLocaleString("pt-PT", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
