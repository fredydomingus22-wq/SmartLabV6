import { getSamplesForCoA } from "@/lib/queries/reports";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FlaskConical } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function CoAListPage() {
    const { data: samples } = await getSamplesForCoA();

    return (
        <div className="space-y-10 px-6 pb-20">
            <PageHeader
                title="Certificados de Análise (CoA)"
                overline="CoA Issuance Engine"
                description="Gestão e emissão técnica de certificados para lotes com validação final."
                icon={<FileText className="h-4 w-4" />}
                backHref="/reports"
                variant="blue"
            />

            {/* Samples List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 italic">
                        <FlaskConical className="h-3 w-3" />
                        Lotes de Amostragem Aptos ({samples.length})
                    </h2>
                    <Badge variant="outline" className="border-slate-800 text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 bg-slate-900/50">
                        PENDENTE DE EMISSÃO
                    </Badge>
                </div>

                {samples.length === 0 ? (
                    <div className="rounded-[2rem] border border-slate-800 bg-card p-16 text-center space-y-4 shadow-xl border-dashed">
                        <FileText className="h-12 w-12 mx-auto text-slate-800 opacity-50" />
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Nenhum registo apto para emissão.</p>
                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em]">Valide as amostras no módulo laboratorial primeiro.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {samples.map((sample: any) => (
                            <Link href={`/reports/coa/${sample.id}`} key={sample.id}>
                                <div className="group flex items-center justify-between p-4 bg-card border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-blue-500/30 transition-colors">
                                            <FileText className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-mono font-black text-sm text-white italic tracking-tighter">
                                                {sample.code}
                                            </p>
                                            <p className="text-[10px] font-black uppercase tracking-tight text-slate-500">
                                                {sample.sample_type?.name}
                                                {sample.batch && <span className="text-slate-600 ml-2 font-mono italic tracking-tighter">Lote: {sample.batch.code}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden md:block text-right">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Recolha</p>
                                            <p className="text-xs font-bold text-slate-400">
                                                {new Date(sample.collected_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "font-black uppercase tracking-tighter text-[9px] border shadow-inner italic px-3 py-1",
                                                sample.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            )}
                                        >
                                            {sample.status === 'approved' ? 'Aprovado' : sample.status === 'reviewed' ? 'Revisado' : sample.status}
                                        </Badge>
                                        <Button size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-[0.2em] bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-lg group-hover:scale-105 transition-transform">
                                            Emitir CoA
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
