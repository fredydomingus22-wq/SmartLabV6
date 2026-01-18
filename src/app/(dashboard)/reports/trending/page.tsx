import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, LineChart, Beaker, Calendar, FileText, Factory } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getTrendingData() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get products for filter
    const { data: products } = await supabase
        .from("products")
        .select("id, name, code")
        .eq("organization_id", user.organization_id)
        .order("name");

    // Get parameters for filter
    const { data: parameters } = await supabase
        .from("qa_parameters")
        .select("id, name, code, unit")
        .eq("organization_id", user.organization_id)
        .eq("status", "active")
        .order("name");

    return { products: products || [], parameters: parameters || [] };
}

export default async function TrendingReportPage() {
    const { products, parameters } = await getTrendingData();

    return (
        <div className="space-y-10 px-6 pb-20">
            <PageHeader
                title="Relatórios de Tendência"
                overline="Statistical Process Control"
                description="Análise estatística de parâmetros laboratoriais e monitorização de desvios de processo (SPC)."
                icon={<TrendingUp className="h-4 w-4" />}
                backHref="/reports"
                variant="blue"
            />

            {/* Filters */}
            <Card className="glass border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden">
                <CardHeader className="border-b border-slate-800 bg-slate-900/50 p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Factory className="h-4 w-4 text-blue-500" />
                        </div>
                        <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 italic">Configuração do Painel de Controlo</h1>
                    </div>
                    <CardTitle className="text-2xl font-black italic tracking-tighter text-white uppercase">Parâmetros de Análise SPC</CardTitle>
                    <CardDescription className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-[0.2em] leading-relaxed">
                        Selecione o produto e parâmetro para visualizar a evolução temporal.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Produto</label>
                            <select className="w-full bg-slate-900 border-slate-800 text-white font-bold text-xs h-12 rounded-xl focus:ring-blue-500/50 px-4 appearance-none hover:border-slate-700 transition-colors">
                                <option value="">Todos os Produtos</option>
                                {products.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Parâmetro de Medição</label>
                            <select className="w-full bg-slate-900 border-slate-800 text-white font-bold text-xs h-12 rounded-xl focus:ring-blue-500/50 px-4 appearance-none hover:border-slate-700 transition-colors">
                                <option value="">Selecione Parâmetro</option>
                                {parameters.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono italic">Data Inicial</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full bg-slate-900 border-slate-800 text-white font-bold text-xs h-12 rounded-xl focus:ring-blue-500/50 px-4 appearance-none hover:border-slate-700 transition-colors uppercase"
                                    defaultValue={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono italic">Data Final</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full bg-slate-900 border-slate-800 text-white font-bold text-xs h-12 rounded-xl focus:ring-blue-500/50 px-4 appearance-none hover:border-slate-700 transition-colors uppercase"
                                    defaultValue={new Date().toISOString().split("T")[0]}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-800 flex justify-end">
                        <Button className="h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-lg group active:scale-95 transition-all">
                            <LineChart className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" />
                            Gerar Gráfico de Tendência
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Placeholder for Charts */}
            <Card className="glass border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden">
                <CardHeader className="border-b border-slate-800 bg-slate-900/50 p-8">
                    <CardTitle className="text-xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
                        <LineChart className="h-5 w-5 text-slate-500" />
                        Visualização de Tendências (SPC)
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em] italic mt-1">
                        Gráficos dinâmicos e análise de variabilidade por parâmetro.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-12">
                    <div className="h-96 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-[2rem] bg-slate-900/20 group">
                        <div className="text-center space-y-4">
                            <div className="h-20 w-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto group-hover:border-blue-500/30 transition-colors border-dashed">
                                <TrendingUp className="h-8 w-8 text-slate-800 opacity-50 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Aguardando Configuração</p>
                                <p className="text-[9px] text-slate-700 uppercase font-black tracking-[0.2em] italic leading-relaxed">
                                    Selecione um produto e parâmetro técnico acima<br />para renderizar a análise estatística.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
