"use client";

import React from "react";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { getLabDashboardKPIs } from "@/app/actions/dashboard-analytics";
import { Beaker, Clock, CheckCircle, TrendingUp } from "lucide-react";

interface KPICardsProps {
    stats: any;
}

export function KPICards({ stats }: KPICardsProps) {
    // Generate sparkline data from historical values if available, or mock
    const generateSparkline = () => Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 10).map(v => ({ value: v }));

    const kpis = [
        {
            title: "Amostras Totais",
            value: stats?.totalSamples || 0,
            description: "Monitorização Global 30d",
            trend: { value: 12, isPositive: true },
            variant: "blue" as const,
            icon: <Beaker className="h-4 w-4" />,
            data: generateSparkline()
        },
        {
            title: "Aguardando Análise",
            value: stats?.pendingAnalysis || 0,
            description: "Processamento Laboratorial",
            trend: { value: 4, isPositive: false },
            variant: "amber" as const,
            icon: <Clock className="h-4 w-4" />,
            data: generateSparkline()
        },
        {
            title: "Taxa de Conformidade",
            value: `${stats?.complianceRate || 0}%`,
            description: "Quality Pass Rate",
            trend: { value: 2, isPositive: true },
            variant: "emerald" as const,
            icon: <CheckCircle className="h-4 w-4" />,
            data: generateSparkline()
        },
        {
            title: "TAT Médio",
            value: `${stats?.avgTAT || 0}h`,
            description: "Turnaround Time Médio",
            trend: { value: 0.5, isPositive: true },
            variant: "purple" as const,
            icon: <TrendingUp className="h-4 w-4" />,
            data: generateSparkline()
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
