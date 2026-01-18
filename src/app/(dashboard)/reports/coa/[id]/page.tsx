import { getSampleForCoA } from "@/lib/queries/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, CheckCircle, XCircle, FlaskConical } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import { GenerateCoAButton } from "./generate-coa-button";
import { PrintButton } from "@/components/smart/print-button";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CoADetailPage({ params }: PageProps) {
    const { id } = await params;
    const { sample, analysis, error } = await getSampleForCoA(id);

    if (!sample || error) {
        notFound();
    }

    return (
        <div className="space-y-10 px-6 pb-20">
            <PageHeader
                title="Certificado de Análise (CoA)"
                overline={`Amostra: ${sample.code}`}
                description="Validação final de parâmetros laboratoriais e conformidade técnica do lote."
                icon={<FileText className="h-4 w-4" />}
                backHref="/reports/coa"
                variant="blue"
                actions={
                    <div className="flex items-center gap-2 print:hidden">
                        <PrintButton />
                        <GenerateCoAButton sampleId={id} sampleCode={sample.code} />
                    </div>
                }
            />

            <Card className="glass border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden print:shadow-none">
                <CardHeader className="border-b border-slate-800 bg-slate-900/50 p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                </div>
                                <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 italic">Documento Oficial de Qualidade</h1>
                            </div>
                            <CardTitle className="text-3xl font-black italic tracking-tighter text-white uppercase">Certificate of Analysis</CardTitle>
                            <CardDescription className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest leading-relaxed">
                                {sample.batch?.product?.name || "Produto Genérico"} &bull; Lote {sample.batch?.code || "N/A"}
                            </CardDescription>
                        </div>
                        <Badge
                            variant="outline"
                            className={cn(
                                "font-black uppercase tracking-[0.2em] text-[10px] italic px-6 py-2 border shadow-inner",
                                sample.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            )}
                        >
                            {sample.status === 'approved' ? 'Aprovado para Expedição' : 'Revisão Técnica'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    {/* Sample Info */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 p-6 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-inner">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Cód. Amostra</p>
                            <p className="font-mono font-black text-sm text-white italic tracking-tighter">{sample.code}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Produto</p>
                            <p className="font-bold text-xs text-slate-300 uppercase leading-tight">{sample.batch?.product?.name || "-"}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Tipo Amostragem</p>
                            <p className="font-bold text-xs text-slate-300 uppercase leading-tight">{sample.sample_type?.name || "-"}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Lote Fabrico</p>
                            <p className="font-mono font-black text-sm text-white italic tracking-tighter">{sample.batch?.code || "-"}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Data Colheita</p>
                            <p className="font-bold text-xs text-slate-300 italic">{new Date(sample.collected_at).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Analysis Results */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FlaskConical className="h-4 w-4 text-slate-500" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Determinações Analíticas & Conformidade</h3>
                        </div>
                        {analysis.length === 0 ? (
                            <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl">
                                <FileText className="h-8 w-8 mx-auto text-slate-800 mb-4" />
                                <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Nenhum resultado analítico registado para esta amostra.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden border border-slate-800 rounded-2xl shadow-xl">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900 border-b border-slate-800">
                                            <th className="text-left p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Parâmetro</th>
                                            <th className="text-left p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Cód.</th>
                                            <th className="text-center p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Min</th>
                                            <th className="text-center p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Alvo</th>
                                            <th className="text-center p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Max</th>
                                            <th className="text-right p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Resultado</th>
                                            <th className="text-center p-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysis.map((result: any) => (
                                            <tr
                                                key={result.id}
                                                className={cn(
                                                    "border-b border-white/5 hover:bg-white/[0.02] transition-colors",
                                                    result.is_critical && "bg-orange-500/[0.02]"
                                                )}
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-xs text-slate-300 uppercase">{result.parameter?.name}</span>
                                                        {result.is_critical && (
                                                            <Badge variant="destructive" className="h-4 px-1.5 text-[8px] font-black tracking-widest uppercase rounded">PCC</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-[10px] text-slate-500 font-bold">{result.parameter?.code}</td>
                                                <td className="p-4 text-center text-slate-400 font-mono text-[10px] font-bold">
                                                    {result.spec_min ?? "-"}
                                                </td>
                                                <td className="p-4 text-center text-slate-400 font-mono text-[10px] font-bold">
                                                    {result.spec_target ?? "-"}
                                                </td>
                                                <td className="p-4 text-center text-slate-400 font-mono text-[10px] font-bold">
                                                    {result.spec_max ?? "-"}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-mono font-black text-sm text-white italic">
                                                            {result.value_numeric ?? result.value_text ?? "-"}
                                                        </span>
                                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                            {result.parameter?.unit || "N/A"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {result.is_conforming === true ? (
                                                        <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                                                    ) : result.is_conforming === false ? (
                                                        <XCircle className="h-4 w-4 text-rose-500 mx-auto" />
                                                    ) : (
                                                        <span className="text-slate-700 block text-center font-black">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-800 pt-8 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Autenticação do Documento</p>
                            <p className="text-[8px] font-bold text-slate-700 uppercase">Gerado automaticamente via SmartLab LIMS Engine</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Emissão</p>
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
