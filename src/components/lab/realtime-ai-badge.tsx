"use client";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, ShieldAlert, AlertTriangle, RefreshCw } from "lucide-react";
import { revalidateAI } from "@/app/actions/ai";
import { toast } from "sonner";

interface AIInsight {
    status: 'approved' | 'warning' | 'blocked' | 'info';
    message: string;
    confidence: number;
}

interface RealtimeAIBadgeProps {
    analysisId: string;
    initialInsight: AIInsight | null;
}

export function RealtimeAIBadge({ analysisId, initialInsight }: RealtimeAIBadgeProps) {
    const [insight, setInsight] = useState<AIInsight | null>(initialInsight);
    const [isPending, startTransition] = useTransition();
    const supabase = createClient();

    const handleRevalidate = (e: React.MouseEvent) => {
        e.stopPropagation();
        startTransition(async () => {
            const res = await revalidateAI(analysisId);
            if (res.success) {
                toast.success("AI Re-validation requested");
            } else {
                toast.error(res.message);
            }
        });
    };

    useEffect(() => {
        const channel = supabase
            .channel(`ai-insight-${analysisId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'ai_insights',
                    filter: `entity_id=eq.${analysisId}`,
                },
                (payload) => {
                    if (payload.eventType === 'DELETE') {
                        setInsight(null);
                    } else if (payload.new) {
                        // Cast payload.new to AIInsight (subset of columns)
                        const newRecord = payload.new as any;
                        setInsight({
                            status: newRecord.status,
                            message: newRecord.message,
                            confidence: newRecord.confidence
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [analysisId, supabase]);

    if (!insight) return null;

    return (
        <div
            onClick={handleRevalidate}
            className={`p-1.5 rounded-full backdrop-blur-md border border-white/5 transition-all duration-500 cursor-pointer hover:scale-110 active:scale-95 ${insight.status === 'approved' ? 'bg-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]' :
                insight.status === 'blocked' ? 'bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                    'bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                }`} title={`AI Analysis: ${insight.message} (${Math.round(insight.confidence * 100)}% confidence) - Click to re-validate`}>
            {isPending ? (
                <RefreshCw className="h-5 w-5 text-white animate-spin" />
            ) : (
                <>
                    {insight.status === 'approved' && <Sparkles className="h-5 w-5 text-indigo-300 animate-in zoom-in spin-in-12 duration-500" />}
                    {insight.status === 'blocked' && <ShieldAlert className="h-5 w-5 text-red-400 animate-in zoom-in duration-300" />}
                    {insight.status === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-400 animate-in zoom-in duration-300" />}
                </>
            )}
        </div>
    );
}
