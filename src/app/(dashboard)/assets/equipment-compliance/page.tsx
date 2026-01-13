import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Settings,
    History,
    Plus,
    CheckCircle,
    FileSearch,
    Wrench
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
    title: "Gestão de Ativos & Design Higiênico | SmartLab",
    description: "Controle de mudanças em equipamentos e verificação de critérios higiênicos.",
};

export default function EquipmentCompliancePage() {
    return (
        <div className="space-y-10 pb-20">
            <PageHeader
                variant="indigo"
                icon={<Wrench className="h-4 w-4" />}
                overline="Asset Lifecycle • Quality Compliance"
                title="Design Higiênico & Ativos"
                description="Especificações de compra e controle de mudanças conforme FSSC v6 Requirement."
                backHref="/assets"
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="gap-2 bg-card border-slate-800 text-slate-300 hover:bg-slate-900 h-9">
                            <History className="h-4 w-4" />
                            <span className="hidden md:inline">Histórico</span>
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 shadow-lg shadow-indigo-600/20">
                            <Plus className="mr-2 h-4 w-4" />
                            Solicitar Mudança
                        </Button>
                    </div>
                }
            />

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-card border-slate-800 shadow-xl overflow-hidden group">
                    <CardHeader className="border-b border-slate-800 pb-6 bg-slate-900/50">
                        <CardTitle className="flex items-center gap-3 text-white uppercase tracking-widest text-[11px] font-black">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                <FileSearch className="h-4 w-4" />
                            </div>
                            Documentação de Compra
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs mt-2">Critérios técnicos e sanitários exigidos para novos ativos.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="p-4 border border-slate-800 rounded-xl bg-slate-950/30 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all cursor-pointer group/item">
                            <p className="text-sm font-black text-slate-200 group-hover/item:text-indigo-400 transition-colors uppercase italic">Manual de Requisitos Higiênicos</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className="text-[9px] bg-slate-900 text-slate-500 border-none font-black tracking-widest px-2">PDF</Badge>
                                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">v2.4 • 2.1 MB</span>
                            </div>
                        </div>
                        <div className="p-4 border border-slate-800 rounded-xl bg-slate-950/30 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all cursor-pointer group/item">
                            <p className="text-sm font-black text-slate-200 group-hover/item:text-indigo-400 transition-colors uppercase italic">Checklist de Comissionamento</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className="text-[9px] bg-slate-900 text-slate-500 border-none font-black tracking-widest px-2">XLSX</Badge>
                                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Template • 45 KB</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-slate-800 pb-6 bg-slate-900/50">
                        <CardTitle className="text-white uppercase tracking-widest text-[11px] font-black flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <History className="h-4 w-4" />
                            </div>
                            Controle de Mudanças
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs mt-2">Fluxo de aprovação para modificações em equipamentos.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shadow-glow shadow-amber-500/50" />
                            <div className="flex-1">
                                <p className="text-xs font-black text-slate-200 uppercase tracking-tight">Linha 2: Troca de Vedação</p>
                                <p className="text-[10px] text-amber-500/60 font-black uppercase tracking-widest mt-1">Aguardando Aprovação QA</p>
                            </div>
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] font-black tracking-widest">PENDENTE</Badge>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl opacity-80">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <div className="flex-1">
                                <p className="text-xs font-black text-slate-300 uppercase tracking-tight italic">C-049: Upgrade do Bico Injetor</p>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Validado pós-limpeza</p>
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[9px] font-black tracking-widest">APPROVED</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-indigo-600 border-none shadow-2xl flex flex-col justify-between overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                    <CardHeader className="relative">
                        <CardTitle className="text-white flex items-center justify-between uppercase tracking-widest text-[11px] font-black">
                            KPI Conformidade
                            <Settings className="h-5 w-5 opacity-40 group-hover:rotate-90 transition-transform duration-700" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative flex-1 py-4">
                        <div className="text-6xl font-black text-white italic tracking-tighter">94.8%</div>
                        <p className="text-indigo-100/70 text-[10px] mt-4 uppercase font-black tracking-[0.1em] leading-relaxed">
                            Adesão rigorosa ao plano de manutenção preventiva e design higiênico industrial.
                        </p>
                    </CardContent>
                    <CardContent className="relative pb-8">
                        <div className="h-2 bg-white/10 rounded-full w-full overflow-hidden border border-white/5">
                            <div className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-1000" style={{ width: '94.8%' }}></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
