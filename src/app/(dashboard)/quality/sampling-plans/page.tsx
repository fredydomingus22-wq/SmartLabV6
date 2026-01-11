import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Clock,
    Zap,
    ArrowLeft,
    Plus,
    Activity,
    FlaskConical,
    Settings2,
    RefreshCw,
    AlertCircle,
    LayoutList
} from "lucide-react";
import Link from "next/link";
import { PlanDialog } from "./PlanDialog";

export const dynamic = "force-dynamic";

export default async function SamplingPlansPage() {
    const supabase = await createClient();

    // Fetch plans with hydration
    const { data: plans, error } = await supabase
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

    const getTriggerIcon = (type: string) => {
        switch (type) {
            case 'time_based': return <Clock className="h-4 w-4 text-blue-400" />;
            case 'event_based': return <Zap className="h-4 w-4 text-amber-400" />;
            default: return <Settings2 className="h-4 w-4 text-slate-400" />;
        }
    };

    const getAnchorLabel = (anchor: string) => {
        const anchors: Record<string, string> = {
            batch_start: "Início de Lote",
            batch_end: "Fim de Lote",
            shift_change: "Troca de Turno",
            process_step: "Passo de Processo"
        };
        return anchors[anchor] || anchor;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/quality">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                            <Calendar className="h-8 w-8 text-blue-500" />
                            Planos de Amostragem
                        </h1>
                        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mt-1">
                            Orquestração MES-LIMS • Automação de Amostras
                        </p>
                    </div>
                </div>
                <PlanDialog
                    products={products || []}
                    sampleTypes={sampleTypes || []}
                />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard
                    title="Planos Ativos"
                    value={plans?.filter(p => p.is_active).length || 0}
                    icon={<Activity className="h-4 w-4 text-emerald-400" />}
                    color="emerald"
                />
                <StatsCard
                    title="Freq. Baseada em Tempo"
                    value={plans?.filter(p => p.trigger_type === 'time_based').length || 0}
                    icon={<Clock className="h-4 w-4 text-blue-400" />}
                    color="blue"
                />
                <StatsCard
                    title="Gatilhos de Evento"
                    value={plans?.filter(p => p.trigger_type === 'event_based').length || 0}
                    icon={<Zap className="h-4 w-4 text-amber-400" />}
                    color="amber"
                />
                <StatsCard
                    title="Amostras por Mês (Est.)"
                    value="~420"
                    icon={<RefreshCw className="h-4 w-4 text-purple-400" />}
                    color="purple"
                />
            </div>

            {/* Grid de Planos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(!plans || plans.length === 0) ? (
                    <Card className="lg:col-span-2 glass border-dashed bg-white/5">
                        <CardContent className="py-20 flex flex-col items-center justify-center text-center">
                            <div className="p-4 rounded-full bg-slate-900 border border-slate-700 mb-4 animate-bounce">
                                <AlertCircle className="h-8 w-8 text-slate-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Nenhum Plano Configurado</h3>
                            <p className="text-slate-500 max-w-sm mt-2">
                                Configure as regras de amostragem automática para que o sistema gere pedidos para o laboratório sem intervenção humana.
                            </p>
                            <Button variant="outline" className="mt-6 border-slate-700">
                                <Plus className="h-4 w-4 mr-2" /> Começar Agora
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    plans.map(plan => (
                        <Card key={plan.id} className="glass group hover:border-blue-500/50 transition-all duration-300 bg-slate-900/40">
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg font-bold text-white uppercase tracking-tight">
                                            {plan.name || `Plano: ${plan.sample_type?.name}`}
                                        </CardTitle>
                                        {!plan.is_active && (
                                            <Badge variant="secondary" className="bg-slate-800 text-slate-500 text-[10px] uppercase">Draft</Badge>
                                        )}
                                    </div>
                                    <CardDescription className="flex items-center gap-2 text-xs font-medium">
                                        <FlaskConical className="h-3 w-3 text-purple-400" />
                                        {plan.sample_type?.name} ({plan.sample_type?.code})
                                    </CardDescription>
                                </div>
                                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shadow-inner group-hover:bg-blue-950/20 transition-colors">
                                    <LayoutList className="h-5 w-5 text-slate-500 group-hover:text-blue-400" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Gatilho Principal</span>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                                            {getTriggerIcon(plan.trigger_type)}
                                            {plan.trigger_type === 'time_based' ? `A cada ${plan.frequency_minutes}min` : getAnchorLabel(plan.event_anchor)}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Produto Alvo</span>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-200 truncate">
                                            {plan.product ? (
                                                <span className="truncate">{plan.product.name}</span>
                                            ) : (
                                                <Badge variant="outline" className="text-blue-400 border-blue-400/20 bg-blue-400/5 py-0 px-2 h-4 text-[9px] uppercase tracking-tighter">Global</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-[10px] text-slate-500 italic">
                                        Última atualização: {new Date(plan.updated_at || plan.created_at).toLocaleDateString()}
                                    </span>
                                    <PlanDialog
                                        mode="edit"
                                        plan={plan}
                                        products={products || []}
                                        sampleTypes={sampleTypes || []}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon, color }: { title: string, value: any, icon: any, color: string }) {
    const colorClasses: any = {
        emerald: "border-emerald-500/20 bg-emerald-500/5",
        blue: "border-blue-500/20 bg-blue-500/5",
        amber: "border-amber-500/20 bg-amber-500/5",
        purple: "border-purple-500/20 bg-purple-500/5"
    };

    return (
        <Card className={`glass bg-slate-900/40 border-l-4 border-l-${color}-500/50`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none">{title}</CardTitle>
                <div className={`p-1.5 rounded-lg ${colorClasses[color]} border`}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black text-white">{value}</div>
            </CardContent>
        </Card>
    );
}
