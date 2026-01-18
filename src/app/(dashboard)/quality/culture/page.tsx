import { Suspense } from "react";
import { getCultureKPIs, getCultureSurveys } from "@/lib/queries/compliance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Heart,
    Users,
    MessageSquare,
    Goal,
    TrendingUp,
    Plus,
    ClipboardList,
    CheckCircle2,
    Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/layout/page-header";
import { KPICard } from "@/components/defaults/kpi-card";

export const metadata = {
    title: "Cultura de Segurança Alimentar | SmartLab",
    description: "Indicadores de cultura, compromisso da gestão e envolvimento organizacional na garantia da inocuidade.",
};

export default async function FoodSafetyCulturePage() {
    const kpis = await getCultureKPIs();
    const surveys = await getCultureSurveys();

    return (
        <div className="space-y-6 px-6 pb-20">
            <PageHeader
                title="Consola de Cultura de Segurança"
                description="Monitorização do compromisso humano e envolvimento organizacional na garantia da inocuidade."
                icon={<Heart className="h-6 w-6 text-rose-500" />}
                variant="destructive"
                actions={
                    <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-[0.2em] border-slate-800 hover:bg-slate-800 gap-2 italic shadow-2xl">
                        <Plus className="h-3.5 w-3.5" />
                        Novo Diagnóstico
                    </Button>
                }
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Envolvimento"
                    value="84%"
                    icon={Users}
                    description="Taxa de Participação Ativa"
                    trend="+2.1% v Quarta"
                    trendDirection="up"
                />
                <KPICard
                    title="Comunicação"
                    value="4.2/5"
                    icon={MessageSquare}
                    description="Eficácia dos Canais de Feedback"
                    trend="Estável"
                    trendDirection="neutral"
                />
                <KPICard
                    title="Formação"
                    value="96%"
                    icon={TrendingUp}
                    description="Cumprimento do Plano Cultural"
                    trend="In-Target"
                    trendDirection="up"
                />
                <KPICard
                    title="Objetivos NC"
                    value="12/15"
                    icon={Goal}
                    description="KPIs Estratégicos Ativos"
                    trend="Alinhado"
                    trendDirection="neutral"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="rounded-2xl border border-slate-800 bg-card shadow-2xl overflow-hidden h-fit">
                    <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-800 bg-slate-900/50">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-black uppercase tracking-widest italic text-white flex items-center gap-3">
                                <ClipboardList className="h-4 w-4 text-rose-400" />
                                Diagnósticos de Cultura
                            </CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-tight text-slate-500">
                                Monitorização do Fator Humano e Consciência Crítica
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:bg-slate-800 italic">
                            Histórico Geral
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-800/40">
                            {surveys.length === 0 ? (
                                <div className="p-20 text-center space-y-4">
                                    <div className="h-16 w-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                                        <ClipboardList className="h-8 w-8 text-slate-800" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 italic">Nenhum diagnóstico submetido recentemente.</p>
                                </div>
                            ) : (
                                surveys.map((survey) => (
                                    <div key={survey.id} className="p-5 hover:bg-slate-900/40 transition-all cursor-pointer group">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 border-slate-800 text-slate-500 bg-slate-950/50 italic shadow-inner">
                                                        {survey.status}
                                                    </Badge>
                                                    <h4 className="text-sm font-black text-white italic tracking-tight group-hover:text-rose-400 transition-colors uppercase">{survey.title}</h4>
                                                </div>
                                                <p className="text-[11px] text-slate-500 italic line-clamp-1">{survey.description}</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <div className="text-2xl font-black text-rose-500 italic tracking-tighter shadow-inner px-2 py-1 bg-slate-950 rounded-lg border border-slate-800">
                                                    {survey.responses?.[0]?.count || 0}
                                                </div>
                                                <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] italic">Participações</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                    <div className="p-4 bg-slate-950/20 border-t border-slate-800 text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700 italic">SmartLab Human-Factor Analytics</p>
                    </div>
                </Card>

                <Card className="rounded-2xl border border-slate-800 bg-card shadow-2xl overflow-hidden h-fit">
                    <CardHeader className="pb-6 border-b border-slate-800 bg-slate-900/50">
                        <CardTitle className="text-sm font-black uppercase tracking-widest italic text-white flex items-center gap-3">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                            Métricas de Cultura FSSC 6.0
                        </CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-tight text-slate-500">
                            Compliance com os Requisitos de Mentalidade e Valor
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-8">
                        {kpis.length === 0 ? (
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 italic text-center py-10 opacity-50">
                                Nenhum KPI de cultura configurado no workstation.
                            </p>
                        ) : (
                            kpis.map((kpi) => (
                                <div key={kpi.id} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[11px] font-black uppercase tracking-tight text-slate-400 italic">{kpi.kpi_name}</span>
                                        <span className="font-mono text-[11px] font-black text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                            {kpi.actual_value}% / {kpi.target_value}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 p-[1px] shadow-inner">
                                        <div
                                            className="bg-emerald-500 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                            style={{ width: `${(Number(kpi.actual_value) / Number(kpi.target_value)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}

                        <div className="pt-6 border-t border-slate-800/50 space-y-4">
                            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Compromisso da Gestão de Topo</h4>
                            <div className="flex items-center gap-4 group cursor-default">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                </div>
                                <span className="text-[11px] text-slate-400 italic">Revisão de gestão Q4 assinada e publicada.</span>
                            </div>
                            <div className="flex items-center gap-4 group cursor-default opacity-40">
                                <div className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-slate-700 font-black" />
                                </div>
                                <span className="text-[11px] text-slate-600 italic">Townhall de Inocuidade agendado para Jan/26.</span>
                            </div>
                        </div>
                    </CardContent>
                    <div className="p-4 bg-slate-950/20 border-t border-slate-800 text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700 italic">FSSC 22000 Version 6 Compliance</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
