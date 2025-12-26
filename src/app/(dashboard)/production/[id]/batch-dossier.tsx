"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    Factory,
    Beaker,
    History,
    ShieldCheck,
    ClipboardCheck,
    FileText,
    UserCheck,
    ArrowRight,
    Download,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface BatchDossierProps {
    data: any; // Result from getBatchTraceabilityAction
    batchId?: string;
}

export function BatchDossier({ data, batchId: propBatchId }: BatchDossierProps) {
    if (!data) return null;
    const { batch, ingredients, tanks, samples, reports } = data;

    // Safety check for valid ID
    const activeBatchId = batch?.id || propBatchId;

    return (
        <div className="space-y-8 mt-4 animate-in fade-in duration-500">
            <Card className="glass border-none shadow-md rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Verificação de Integridade</h3>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Dossiê Mestre de Produção (MBR)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 h-10 transition-all active:scale-95"
                                onClick={() => window.open(`/api/reports/engine/${activeBatchId}`, '_blank')}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Relatório Mestre (MBR)
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-xl h-10 px-4 border-primary/20 hover:bg-primary/5 transition-all">
                                        Outros Relatórios
                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-slate-100">
                                    <DropdownMenuItem className="rounded-lg py-2 cursor-pointer" onClick={() => window.open(`/api/reports/engine/${activeBatchId}?type=COA`, '_blank')}>
                                        <FileText className="mr-2 h-4 w-4 text-primary" />
                                        Certificado de Análise (CoA)
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="rounded-lg py-2 cursor-pointer" onClick={() => window.open(`/api/reports/engine/${activeBatchId}?type=FQ`, '_blank')}>
                                        <Beaker className="mr-2 h-4 w-4 text-blue-500" />
                                        Relatório Físico-Químico
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-lg py-2 cursor-pointer" onClick={() => window.open(`/api/reports/engine/${activeBatchId}?type=MICRO`, '_blank')}>
                                        <Beaker className="mr-2 h-4 w-4 text-purple-500" />
                                        Relatório Microbiológico
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-lg py-2 cursor-pointer text-rose-600 font-bold" onClick={() => window.open(`/api/reports/engine/${activeBatchId}?type=NC`, '_blank')}>
                                        <AlertCircle className="mr-2 h-4 w-4" />
                                        Relatório de Não-Conformidade
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="text-right border-l-2 border-primary/10 pl-4 ml-4">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Status Final</p>
                                <Badge className={cn(
                                    "font-bold uppercase tracking-wider h-7 px-4 border-none",
                                    batch.status === 'released' ? 'bg-emerald-500/10 text-emerald-600' :
                                        batch.status === 'blocked' || batch.status === 'rejected' ? 'bg-rose-500/10 text-rose-600' :
                                            'bg-amber-500/10 text-amber-600'
                                )}>
                                    {batch.status === 'released' ? 'CONFORME' :
                                        batch.status === 'blocked' || batch.status === 'rejected' ? 'NÃO CONFORME' : 'EM AUDITORIA'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Raw Materials & Genealogy */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="flex items-center gap-2 px-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em]">Genealogia de Entrada</h4>
                    </div>

                    <div className="space-y-3">
                        {ingredients.length > 0 ? (
                            ingredients.map((ing: any, idx: number) => (
                                <div key={idx} className="glass p-4 rounded-2xl border-none shadow-sm hover:translate-x-1 transition-transform cursor-default">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Lote: {ing.lot?.lot_number}</span>
                                        <Badge variant="outline" className="text-[8px] font-bold h-4 px-1.5 uppercase opacity-50">{ing.lot?.status}</Badge>
                                    </div>
                                    <p className="text-xs font-bold truncate">{ing.lot?.supplier?.name || "Stock Interno"}</p>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/5">
                                        <span className="text-[9px] text-muted-foreground uppercase">Quantidade</span>
                                        <span className="text-[10px] font-mono font-bold">{ing.quantity} Kg</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] text-muted-foreground italic px-2">Nenhum ingrediente rastreado para este lote.</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 px-2 pt-4">
                        <Factory className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em]">Fluxo de Processo</h4>
                    </div>
                    <div className="space-y-3">
                        {tanks.length > 0 ? (
                            tanks.map((t: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border-l-4 border-primary/20">
                                    <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-[10px] font-bold">{t.tank?.tank_number}</div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-tight">Cisterna / Misturador</span>
                                        <span className="text-[9px] text-muted-foreground uppercase">{t.tank?.status}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] text-muted-foreground italic px-2">Nenhum equipamento rastreado.</p>
                        )}
                    </div>
                </div>

                {/* 2. Quality & Lab Analysis */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <Beaker className="h-4 w-4 text-muted-foreground" />
                            <h4 className="text-xs font-bold uppercase tracking-[0.2em]">Verificação Laboratorial (LIMS)</h4>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold border-none bg-primary/5 text-primary">{samples.length} Amostras</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {samples.map((sample: any) => (
                            <Card key={sample.id} className="glass border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                                <CardHeader className="p-4 pb-2 border-b border-border/5">
                                    <div className="flex justify-between items-center">
                                        <span className="font-mono text-[10px] font-bold">{sample.code}</span>
                                        <Badge className={cn(
                                            "text-[8px] font-bold px-1.5 h-4",
                                            sample.status === 'validated' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                                        )}>
                                            {sample.status}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{sample.sample_type?.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="space-y-2">
                                        {sample.analysis?.map((ans: any, idx: number) => {
                                            const spec = (batch.specifications || []).find((sp: any) =>
                                                sp.qa_parameter_id === ans.qa_parameter_id
                                            );

                                            let limitText = "-";
                                            if (spec) {
                                                if (spec.min_value !== null && spec.max_value !== null) {
                                                    limitText = `${spec.min_value} - ${spec.max_value}`;
                                                } else if (spec.min_value !== null) {
                                                    limitText = `min. ${spec.min_value}`;
                                                } else if (spec.max_value !== null) {
                                                    limitText = `max. ${spec.max_value}`;
                                                } else if (spec.text_value) {
                                                    limitText = spec.text_value;
                                                }
                                            }

                                            return (
                                                <div key={idx} className="flex items-center justify-between text-[10px]">
                                                    <div className="flex flex-col">
                                                        <span className="text-muted-foreground">{ans.parameter?.name}</span>
                                                        <span className="text-[8px] text-muted-foreground/60">Limite: {limitText}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold">{ans.value_numeric ?? ans.value_text} {ans.parameter?.unit}</span>
                                                        {ans.is_conforming === true ? (
                                                            <ClipboardCheck className="h-3 w-3 text-emerald-500" />
                                                        ) : ans.is_conforming === false ? (
                                                            <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                        ) : null}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {sample.insights?.[0] && (
                                        <div className="mt-3 p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 text-[9px] italic text-indigo-700 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/50">
                                            IA: {sample.insights[0].message}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/5 opacity-50">
                                        <div className="flex items-center gap-1 text-[8px] font-bold uppercase">
                                            <UserCheck className="h-2.5 w-2.5" />
                                            {sample.analysis?.[0]?.analyst?.full_name || "Sistema"}
                                        </div>
                                        <span className="text-[8px] font-bold uppercase">
                                            {sample.collected_at ? format(new Date(sample.collected_at), "dd/MM HH:mm") : "-"}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* 3. Reports & Certification */}
                    <div className="flex items-center gap-2 px-2 pt-4">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em]">Documentos de Conformidade</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reports.length > 0 ? (
                            reports.map((report: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase tracking-tight">{report.report_number}</span>
                                            <span className="text-[9px] text-muted-foreground truncate max-w-[150px]">{report.title}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {report.status === 'signed' && <Badge className="bg-emerald-500/10 text-emerald-600 text-[8px] font-bold h-5 px-2 uppercase border-none">Assinado</Badge>}
                                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] text-muted-foreground italic px-2">Nenhum relatório oficial gerado ainda.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Audit Trail / Signatures Footnote */}
            <Card className="border-none bg-muted/10 rounded-2xl">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assinaturas Digitais (21 CFR Part 11)</h5>
                            <div className="flex flex-wrap gap-8">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-10 w-10 rounded-full bg-background border-2 flex items-center justify-center",
                                        batch.supervisor_approved_at ? "border-emerald-500/20" : "border-muted opacity-30"
                                    )}>
                                        <UserCheck className={cn("h-5 w-5", batch.supervisor_approved_at ? "text-emerald-500" : "text-muted-foreground")} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase">Operador / Supervisor</span>
                                        <span className="text-[9px] text-muted-foreground italic">
                                            {batch.supervisor?.full_name || "Aguardando Finalização"}
                                            {batch.supervisor_approved_at && ` • ${format(new Date(batch.supervisor_approved_at), "dd/MM HH:mm")}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-10 w-10 rounded-full bg-background border-2 flex items-center justify-center",
                                        batch.qa_approved_at ? "border-emerald-500/20" : "border-muted opacity-30"
                                    )}>
                                        <UserCheck className={cn("h-5 w-5", batch.qa_approved_at ? "text-emerald-500" : "text-muted-foreground")} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase">Responsável de Qualidade</span>
                                        <span className="text-[9px] text-muted-foreground italic">
                                            {batch.qa?.full_name || "Aguardando Liberação"}
                                            {batch.qa_approved_at && ` • ${format(new Date(batch.qa_approved_at), "dd/MM HH:mm")}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="md:text-right space-y-1">
                            <p className="text-[9px] font-mono text-muted-foreground uppercase">ID do Lote: {batch.id}</p>
                            <p className="text-[9px] font-mono text-muted-foreground uppercase">Impressão: {format(new Date(), "yyyy-MM-dd HH:mm:ss")}</p>
                            <div className="flex md:justify-end items-center gap-2 pt-2">
                                <History className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Integridade dos Dados Garantida</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
