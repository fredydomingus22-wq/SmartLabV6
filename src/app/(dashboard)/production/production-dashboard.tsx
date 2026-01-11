"use client";

import React from "react";
import { IndustrialCard, IndustrialGrid } from "@/components/shared/industrial-card";
import { Box, Typography } from "@mui/material";
import {
    Clock,
    Activity,
    CheckCircle2,
    ShieldAlert,
    ArrowUpRight,
    AlertTriangle,
    TrendingUp,
    Workflow
} from "lucide-react";
import { ProductionCharts } from "./production-charts";
import { ProductionPageClient } from "./production-page-client";

interface ProductionDashboardProps {
    stats: {
        planned: number;
        inProcess: number;
        completed: number;
        blocked: number;
        released: number;
        rejected: number;
        yieldRate: string;
        qualityRate: string;
        avgTAT: string;
    };
    batchesList: any[];
}

export function ProductionDashboard({ stats, batchesList }: ProductionDashboardProps) {
    return (
        <div className="space-y-10">
            {/* 📊 INDUSTRIAL KPI GRID */}
            <IndustrialGrid cols={4}>
                <IndustrialCard
                    variant="analytics"
                    title="Ordens Planeadas"
                    value={stats.planned}
                    description="Próximas 24 horas"
                    status="active"
                    icon={Clock}
                />
                <IndustrialCard
                    variant="analytics"
                    title="Em Processamento"
                    value={stats.inProcess}
                    description="Atividade em linha"
                    status="warning"
                    icon={Activity}
                />
                <IndustrialCard
                    variant="analytics"
                    title="Taxa de Qualidade"
                    value={`${stats.qualityRate}%`}
                    description="Batch Release Efficiency"
                    status="success"
                    icon={ShieldAlert}
                    trend={{ value: 1.2, isPositive: true }}
                />
                <IndustrialCard
                    variant="analytics"
                    title="Finalizados (Release)"
                    value={stats.released}
                    description="Lotes prontos para logística"
                    status="success"
                    icon={CheckCircle2}
                />
            </IndustrialGrid>

            {/* 📈 STRATEGIC OVERLAYS */}
            <div className="grid gap-6 md:grid-cols-3">
                <IndustrialCard title="Industrial Yield" icon={ArrowUpRight} status="success">
                    <Box className="mt-2">
                        <Typography className="text-3xl font-black text-white">{stats.yieldRate}%</Typography>
                        <Typography className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Release vs Planned ratio</Typography>
                    </Box>
                </IndustrialCard>
                <IndustrialCard title="Average TAT" icon={Clock} status="active">
                    <Box className="mt-2">
                        <Typography className="text-3xl font-black text-white">{stats.avgTAT}h</Typography>
                        <Typography className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Mean turnaround time</Typography>
                    </Box>
                </IndustrialCard>
                <IndustrialCard title="Rejeições Histórico" icon={AlertTriangle} status="error">
                    <Box className="mt-2">
                        <Typography className="text-3xl font-black text-white">{stats.rejected}</Typography>
                        <Typography className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Non-compliant assets</Typography>
                    </Box>
                </IndustrialCard>
            </div>

            {/* 📉 VISUAL ANALYTICS */}
            <IndustrialCard
                title="Análise de Tendências de Produção"
                subtitle="Throughput em tempo real e eficiência de linha"
                icon={TrendingUp}
            >
                <Box className="h-[400px] mt-6">
                    <ProductionCharts batches={batchesList} />
                </Box>
            </IndustrialCard>

            {/* 📑 PRODUCTION QUEUE TABLE */}
            <IndustrialCard
                title="Fila de Produção & Monitoramento"
                subtitle="Gestão ativa de lotes e estados de conformidade"
                icon={Workflow}
                bodyClassName="p-0"
            >
                <ProductionPageClient batches={batchesList} />
            </IndustrialCard>
        </div>
    );
}
