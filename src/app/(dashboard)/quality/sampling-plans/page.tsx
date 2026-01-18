import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Clock,
    Zap,
    FlaskConical,
    RefreshCw,
    Activity,
    ClipboardList,
    Beaker
} from "lucide-react";
import { PlanDialog } from "./PlanDialog";
import { PageHeader } from "@/components/layout/page-header";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SamplingPlansPage() {
    const supabase = await createClient();

    // Fetch plans with hydration
    const { data: plans } = await supabase
        .from("production_sampling_plans")
        .select(`
            *,
            product:products(id, name, sku),
            sample_type:sample_types(id, name, code)
        `)
        .order("created_at", { ascending: false });

    // Fetch supplementary data for dialogs
    const { data: products } = await supabase.from("products").select("id, name, sku").eq("status", "active");
    const { data: sampleTypes } = await supabase.from("sample_types").select("id, name, code");

    // Mock data for sparklines
    const mockData = [10, 15, 12, 18, 14, 20, 17].map(v => ({ value: v }));

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <PageHeader
                title="Sistemas de Amostragem"
                overline="GQ • Plano de Controlo Operacional"
                description="Integração MES-LIMS • Automação de Colheitas"
                icon={<ClipboardList className="h-4 w-4" />}
                backHref="/quality"
                actions={
                    <div className="flex items-center gap-3">
                        <PlanDialog
                            products={products || []}
                            sampleTypes={sampleTypes || []}
                        />
                    </div>
                }
            />

            {/* 📊 STRATEGIC KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPISparkCard
                    variant="emerald"
                    title="Planos em Vigor"
                    value={plans?.filter(p => p.is_active).length || 0}
                    description="Monitorização operacional ativa"
                    icon={<ClipboardList className="h-4 w-4" />}
                    trend={{ value: 5, isPositive: true }}
                    data={mockData}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="blue"
                    title="Gatilho Temporal"
                    value={plans?.filter(p => p.trigger_type === 'time_based').length || 0}
                    description="Checkpoints periódicos"
                    icon={<Clock className="h-4 w-4" />}
                    trend={{ value: 2, isPositive: true }}
                    data={mockData}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="amber"
                    title="Gatilho de Evento"
                    value={plans?.filter(p => p.trigger_type === 'event_based').length || 0}
                    description="Impulsos de produção"
                    icon={<Zap className="h-4 w-4" />}
                    trend={{ value: 1, isPositive: true }}
                    data={mockData}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="purple"
                    title="Projeção de Colheitas"
                    value="≈45"
                    description="Amostras por Turno"
                    icon={<FlaskConical className="h-4 w-4" />}
                    trend={{ value: 12, isPositive: true }}
                    data={mockData}
                    dataKey="value"
                />
            </div>

            {/* 📋 MAIN CONTENT SECTION */}
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 glass p-10 min-h-[500px]">
                        <div className="flex items-center justify-between mb-10">
                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Protocolos em Execução</h2>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-60">Diretriz Compliance ISO 2859-1 & NP</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                                <Activity className="h-5 w-5 text-blue-400 opacity-50" />
                            </div>
                        </div>

                        {(!plans || plans.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40 italic">
                                <FlaskConical className="h-12 w-12 mb-4 text-slate-600" />
                                <p className="text-sm font-black uppercase tracking-widest">Nenhum plano definido</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="group p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all duration-500 cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic">
                                                        {plan.sample_type?.code || 'SAMP-XX'}
                                                    </span>
                                                    <Badge variant={plan.is_active ? 'secondary' : 'outline'} className="text-[8px] font-black uppercase tracking-tight py-0 px-2 h-4 italic">
                                                        {plan.is_active ? 'ACTIVE' : 'DRAFT'}
                                                    </Badge>
                                                </div>
                                                <h3 className="text-lg font-black text-white uppercase italic leading-none group-hover:text-blue-400 transition-colors">
                                                    {plan.name || plan.sample_type?.name}
                                                </h3>
                                                <div className="flex items-center gap-6 mt-4">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        <Clock className="h-3 w-3 opacity-50" />
                                                        {plan.trigger_type === 'time_based' ? `${plan.frequency_minutes} min` : 'Gatilho Evento'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        <Beaker className="h-3 w-3 opacity-50" />
                                                        {plan.sample_type?.name}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <PlanDialog
                                                    mode="edit"
                                                    plan={plan}
                                                    products={products || []}
                                                    sampleTypes={sampleTypes || []}
                                                />
                                            </div>
                                        </div>

                                        {/* Subtle Hover Glow */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/[0.02] to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 🛡️ SIDE INFO PANEL */}
                <div className="space-y-6">
                    <div className="p-10 rounded-[2.5rem] border border-white/5 bg-slate-950/40 glass space-y-10">
                        <div className="space-y-1">
                            <h3 className="text-sm font-black text-white italic uppercase tracking-widest leading-none">Status do Motor de Amostragem</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-60">Configuração de Fluxo MES-LIMS</p>
                        </div>

                        <div className="space-y-8">
                            {[
                                { label: "Total Protocolos", value: plans?.length || 0, color: "text-white" },
                                { label: "Planos em Produção", value: plans?.filter(p => p.is_active).length || 0, color: "text-emerald-400" },
                                { label: "Amostras / Turno", value: "≈45", color: "text-blue-400" }
                            ].map((stat) => (
                                <div key={stat.label} className="flex justify-between items-end border-b border-white/5 pb-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{stat.label}</p>
                                    <p className={cn("text-3xl font-black italic leading-none", stat.color)}>{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <Button variant="outline" className="w-full h-12 bg-white/[0.02] hover:bg-white/[0.05] border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic flex items-center justify-between px-6">
                                <span>Configurações Globais</span>
                                <RefreshCw className="h-3 w-3 opacity-50" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-10 rounded-[2.5rem] border border-white/5 bg-blue-500/[0.03] glass">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="h-4 w-4 text-amber-400 shadow-glow" />
                            <p className="text-[10px] font-black text-white uppercase tracking-widest italic">Amostragem Inteligente</p>
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 leading-relaxed uppercase tracking-tight opacity-80">
                            O sistema gere frequências automáticas baseadas no fluxo de produção real.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
