"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { BrainCircuit } from "lucide-react";

interface NC {
    id: string;
    nc_number: string;
    title: string;
    nc_type: string;
    severity: string;
    status: string;
    detected_date: string;
    due_date?: string;
    ai_insight?: {
        status: string;
        message: string;
        raw_response: any;
        confidence: number;
    } | null;
}

interface NCListClientProps {
    nonconformities: NC[];
}

export function NCListClient({ nonconformities }: NCListClientProps) {
    const severityColors: Record<string, string> = {
        minor: "bg-slate-800 text-slate-400",
        major: "bg-orange-900/30 text-orange-400 border border-orange-500/20",
        critical: "bg-red-900/30 text-red-400 border border-red-500/20",
    };

    const severityLabels: Record<string, string> = {
        minor: "Menor",
        major: "Maior",
        critical: "Crítica",
    };

    const statusLabels: Record<string, string> = {
        open: "Aberta",
        under_investigation: "Em Investigação",
        containment: "Contenção",
        corrective_action: "Ação Corretiva",
        verification: "Verificação",
        closed: "Fechada",
    };

    const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        open: "destructive",
        under_investigation: "secondary",
        containment: "secondary",
        corrective_action: "outline",
        verification: "outline",
        closed: "default",
    };

    const columns = [
        {
            key: "nc_number",
            label: "NC #",
            render: (row: NC) => (
                <Link
                    href={`/quality/qms/${row.id}`}
                    className="font-mono font-semibold text-primary hover:underline hover:text-primary/80 transition-colors"
                >
                    {row.nc_number}
                </Link>
            ),
        },
        {
            key: "title",
            label: "Título",
            render: (row: NC) => (
                <span className="line-clamp-1 max-w-[200px] text-slate-300">{row.title}</span>
            ),
        },
        {
            key: "nc_type",
            label: "Tipo",
            render: (row: NC) => (
                <Badge variant="outline" className="capitalize text-slate-400 border-slate-800 glass">
                    {row.nc_type === 'internal' ? 'Interna' : row.nc_type === 'supplier' ? 'Fornecedor' : row.nc_type === 'customer' ? 'Cliente' : row.nc_type}
                </Badge>
            ),
        },
        {
            key: "severity",
            label: "Gravidade",
            render: (row: NC) => (
                <Badge className={`${severityColors[row.severity]} capitalize`}>
                    {severityLabels[row.severity] || row.severity}
                </Badge>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (row: NC) => (
                <Badge variant={statusColors[row.status] || "outline"} className="glass">
                    {statusLabels[row.status] || row.status.replace("_", " ")}
                </Badge>
            ),
        },
        {
            key: "detected_date",
            label: "Detetada",
            render: (row: NC) => (
                <span className="text-slate-400">{row.detected_date?.split("T")[0] || "-"}</span>
            ),
        },
        {
            key: "due_date",
            label: "Limite",
            render: (row: NC) => {
                if (!row.due_date) return "-";
                const isOverdue = new Date(row.due_date) < new Date() && row.status !== "closed";
                return (
                    <span className={isOverdue ? "text-red-500 font-semibold" : "text-slate-400"}>
                        {row.due_date.split("T")[0]}
                    </span>
                );
            },
        },
        {
            key: "risk",
            label: "Risco AI",
            render: (row: NC) => {
                if (!row.ai_insight?.raw_response?.risk_level) return <span className="text-slate-700">-</span>;

                const risk = row.ai_insight.raw_response.risk_level;
                const score = row.ai_insight.raw_response.severity_score;

                const riskColors: Record<string, string> = {
                    Low: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
                    Medium: "border-yellow-500/30 text-yellow-400 bg-yellow-500/5",
                    High: "border-orange-500/30 text-orange-400 bg-orange-500/5",
                    Critical: "border-rose-500/30 text-rose-400 bg-rose-500/5",
                };

                return (
                    <TooltipProvider>
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                                <Badge variant="outline" className={`gap-1.5 cursor-help ${riskColors[risk] || "border-slate-700"}`}>
                                    <BrainCircuit className="h-3 w-3" />
                                    {risk} <span className="opacity-70 text-[10px]">({score})</span>
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-[320px] bg-slate-950 border-slate-800 p-4 shadow-xl">
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold text-sm flex items-center gap-2 text-slate-200">
                                            <BrainCircuit className="h-4 w-4 text-purple-400" />
                                            Análise Inteligente
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                            {row.ai_insight.message}
                                        </p>
                                    </div>

                                    {row.ai_insight.raw_response.suggested_immediate_action && (
                                        <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                                            <p className="font-semibold text-xs mb-1 text-emerald-400">Sugestão Imediata:</p>
                                            <p className="text-xs text-slate-300">
                                                {row.ai_insight.raw_response.suggested_immediate_action}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                                        <span className="text-[10px] text-slate-500">Modelo: {row.ai_insight.raw_response.model_used || 'GPT-4o'}</span>
                                        <span className="text-[10px] text-slate-500">Confiança: {(row.ai_insight.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            },
        },
        {
            key: "actions",
            label: "",
            render: (row: NC) => (
                <Link href={`/quality/qms/${row.id}`}>
                    <Button variant="ghost" size="sm" className="hover:bg-slate-800">
                        <Eye className="h-4 w-4" />
                    </Button>
                </Link>
            ),
        },
    ];

    return <DataGrid data={nonconformities} columns={columns} className="glass" />;
}

