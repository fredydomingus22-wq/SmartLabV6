import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ShieldAlert, AlertTriangle, CheckCircle, Info } from "lucide-react";

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

    // Filter relevant insights (skip pure approvals if we want to reduce noise, or show all?)
    // Let's show everything but prioritize warnings/blocks.
    const sortedInsights = [...insights].sort((a, b) => {
        const priority = { blocked: 0, warning: 1, info: 2, approved: 3 };
        return priority[a.status] - priority[b.status];
    });

    const hasIssues = sortedInsights.some(i => i.status === 'blocked' || i.status === 'warning');

    return (
        <Card className={`border shadow-sm mb-6 ${hasIssues ? 'border-amber-200 bg-amber-50/50' : 'border-indigo-100 bg-indigo-50/30'}`}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sparkles className={`h-5 w-5 ${hasIssues ? 'text-amber-500' : 'text-indigo-500'}`} />
                    <span className={hasIssues ? 'text-amber-900' : 'text-indigo-900'}>
                        AI Analysis Summary
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {sortedInsights.map(insight => (
                    <div key={insight.id} className="flex gap-3 items-start text-sm">
                        <div className="mt-0.5 shrink-0">
                            {insight.status === 'blocked' && <ShieldAlert className="h-4 w-4 text-red-500" />}
                            {insight.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                            {insight.status === 'approved' && <CheckCircle className="h-4 w-4 text-indigo-500" />}
                            {insight.status === 'info' && <Info className="h-4 w-4 text-blue-500" />}
                        </div>
                        <div className="space-y-0.5">
                            <p className={`font-medium ${insight.status === 'blocked' ? 'text-red-700' :
                                    insight.status === 'warning' ? 'text-amber-700' :
                                        'text-slate-700'
                                }`}>
                                {insight.message}
                            </p>
                            <p className="text-xs text-slate-500">
                                Confidence: {Math.round(insight.confidence * 100)}%
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
