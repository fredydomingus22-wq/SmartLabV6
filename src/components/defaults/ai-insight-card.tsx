import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Zap, Trophy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIInsightCardProps {
    insight: string | null;
    loading?: boolean;
    title?: string;
    emptyMessage?: string;
    className?: string;
}

export function AIInsightCard({
    insight,
    loading = false,
    title = "Insights Inteligentes",
    emptyMessage = "Workstation em Standby...",
    className
}: AIInsightCardProps) {
    return (
        <Card className={cn("bg-card border-slate-800 shadow-2xl overflow-hidden rounded-2xl", className)}>
            <CardHeader className="pb-4 bg-slate-900/50 border-b border-slate-800">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] italic text-white flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                {loading ? (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-pulse shadow-inner">
                        <div className="h-2 w-3/4 bg-slate-900 rounded-full" />
                        <div className="h-2 w-1/2 bg-slate-900 rounded-full" />
                    </div>
                ) : insight ? (
                    <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                            <Zap className="h-3 w-3 text-emerald-500" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed italic relative z-10">
                            "{insight}"
                        </p>
                        <div className="mt-6 flex items-center justify-between border-t border-slate-800/50 pt-4">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 italic">SmartLab AI Assistant • v4.0</span>
                            <Trophy className="h-3 w-3 text-amber-500/40" />
                        </div>
                    </div>
                ) : (
                    <div className="p-8 rounded-xl bg-slate-950/20 border border-slate-800 border-dashed text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 italic">{emptyMessage}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
