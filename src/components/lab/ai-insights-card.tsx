import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ShieldAlert, AlertTriangle, CheckCircle, Info, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIInsight {
    id: string;
    status: 'approved' | 'warning' | 'blocked' | 'info';
    message: string;
    confidence: number;
    created_at: string;
    entity_id: string; // The Result ID
}

interface AiInsightsCardProps {
    insights: AIInsight[];
}

export function AiInsightsCard({ insights }: AiInsightsCardProps) {
    if (!insights || insights.length === 0) return null;

    const sortedInsights = [...insights].sort((a, b) => {
        const priority = { blocked: 0, warning: 1, info: 2, approved: 3 };
        return priority[a.status] - priority[b.status];
    });

    const highestStatus = sortedInsights[0]?.status;
    const hasCritical = highestStatus === 'blocked' || highestStatus === 'warning';

    const riskConfig: Record<string, { color: string; bg: string; icon: any; border: string }> = {
        blocked: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", icon: ShieldAlert },
        warning: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: AlertTriangle },
        approved: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle },
        info: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: Info },
    };

    return (
        <Card className={cn(
            "glass border shadow-2xl overflow-hidden relative group",
            hasCritical ? "border-amber-500/30 shadow-amber-900/10" : "border-slate-800/80"
        )}>
            {/* Header Gradient Overlay */}
            <div className={cn(
                "absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b opacity-20 pointer-events-none",
                hasCritical ? "from-amber-500/20 to-transparent" : "from-blue-500/10 to-transparent"
            )} />

            <CardHeader className="pb-4 relative z-10 border-b border-white/5 bg-slate-900/40">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <BrainCircuit className={cn("h-4 w-4", hasCritical ? "text-amber-400" : "text-blue-400")} />
                        <span className="bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                            Relatório de Inteligência Sintética
                        </span>
                    </CardTitle>
                    <div className="flex gap-1.5">
                        {['blocked', 'warning', 'info'].filter(s => sortedInsights.some(i => i.status === s)).map(s => (
                            <div key={s} className={cn("w-2 h-2 rounded-full animate-pulse", riskConfig[s].bg.replace("/10", ""))} title={s} />
                        ))}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-4 relative z-10 bg-slate-950/20">
                {sortedInsights.map((insight, idx) => {
                    const cfg = riskConfig[insight.status];
                    const Icon = cfg.icon;

                    return (
                        <div key={insight.id} className={cn(
                            "flex gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.01]",
                            cfg.bg, cfg.border, idx === 0 && "ring-1 ring-white/10 shadow-lg"
                        )}>
                            <div className={cn("shrink-0 p-2 rounded-xl bg-slate-950/50 border", cfg.border)}>
                                <Icon className={cn("h-4 w-4", cfg.color)} />
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className={cn("text-xs font-bold leading-relaxed", cfg.color === 'text-emerald-400' ? 'text-slate-200' : cfg.color)}>
                                    {insight.message}
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-1000", cfg.bg.replace("/10", ""))}
                                                style={{ width: `${insight.confidence * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                            Confiança: {Math.round(insight.confidence * 100)}%
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-slate-600 font-mono">
                                        ID: {insight.id.substring(0, 8).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
