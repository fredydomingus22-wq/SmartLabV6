"use client";

import React from "react";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { Beaker, Clock, CheckCircle, TrendingUp, FlaskConical } from "lucide-react";

export interface LabStats {
    total: number;
    today: number;
    pending: number;
    collected: number;
    in_analysis: number;
    reviewed: number;
    approved: number;
    rejected: number;
    completed: number;
    todayResultsCount: number;
    tat: string;
    compliance_rate: number;
    approved_today: number;
}

interface KPICardsProps {
    stats: LabStats;
}

export function KPICards({ stats }: KPICardsProps) {
    // Generate static-looking sparkline data based on the current value for stability
    const getSparklineData = (base: number) =>
        Array.from({ length: 7 }, (_, i) => ({
            value: Math.max(0, base + Math.sin(i) * (base * 0.2))
        }));

    const kpis = [
        {
            title: "Amostras Hoje",
            value: stats.today,
            description: "Novas colheitas registadas",
            trend: { value: 12, isPositive: true },
            variant: "blue" as const,
            icon: <Beaker className="h-4 w-4" />,
            data: getSparklineData(stats.today)
        },
        {
            title: "Fila de Análise",
            value: stats.in_analysis + stats.collected,
            description: "Aguardando resultados técnicos",
            trend: { value: 5, isPositive: false },
            variant: "amber" as const,
            icon: <Clock className="h-4 w-4" />,
            data: getSparklineData(stats.in_analysis + stats.collected)
        },
        {
            title: "Taxa de Conformidade",
            value: `${stats.compliance_rate}%`,
            description: "Lotes aprovados vs rejeitados",
            trend: { value: 2, isPositive: true },
            variant: "emerald" as const,
            icon: <CheckCircle className="h-4 w-4" />,
            data: getSparklineData(stats.compliance_rate)
        },
        {
            title: "TAT Médio",
            value: stats.tat,
            description: "Tempo de resposta (30d)",
            trend: { value: 8, isPositive: true },
            variant: "purple" as const,
            icon: <TrendingUp className="h-4 w-4" />,
            data: getSparklineData(parseInt(stats.tat) || 12)
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => (
                <KPISparkCard
                    key={index}
                    variant={kpi.variant}
                    title={kpi.title}
                    value={kpi.value.toString()}
                    description={kpi.description}
                    icon={kpi.icon}
                    data={kpi.data}
                    dataKey="value"
                />
            ))}
        </div>
    );
}
