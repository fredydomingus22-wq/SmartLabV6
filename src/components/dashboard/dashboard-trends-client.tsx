"use client";

import { useState, useMemo } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { IndustrialCard } from "@/components/shared/industrial-card";
import { IndustrialChart } from "@/components/shared/industrial-chart";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Filter, Activity } from "lucide-react";
import type { EChartsOption } from "echarts";
import { Box, Typography, Stack } from "@mui/material";
import { getTrendDataAction } from "@/app/(dashboard)/dashboard/actions";

interface DashboardTrendsClientProps {
    products: any[];
    parameters: any[];
    initialData: any[];
    initialSpecs: {
        min_value: number | null;
        max_value: number | null;
        target_value: number | null;
    } | null;
}

export function DashboardTrendsClient({ products, parameters, initialData, initialSpecs }: DashboardTrendsClientProps) {
    const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || "");
    const [selectedParameter, setSelectedParameter] = useState(parameters[0]?.id || "");

    const [data, setData] = useState(initialData);
    const [specs, setSpecs] = useState(initialSpecs);
    const [loading, setLoading] = useState(false);

    const handleFilterChange = async (prodId: string, paramId: string) => {
        if (!prodId || !paramId) return;
        setLoading(true);
        try {
            const result = await getTrendDataAction(prodId, paramId);
            setData(result.data || []);
            setSpecs(result.specs);
        } catch (error) {
            console.error("Failed to fetch trend data", error);
        } finally {
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        return [...data].reverse();
    }, [data]);

    const categories = chartData.map(d => d.batchCode || d.sampleCode);
    const values = chartData.map(d => d.value);

    const LSL = specs?.min_value;
    const USL = specs?.max_value;

    const option: EChartsOption = {
        xAxis: {
            type: "category",
            data: categories,
            axisLabel: { color: "#64748b", fontSize: 10 }
        },
        yAxis: {
            type: "value",
            scale: true,
            axisLabel: { color: "#64748b", fontSize: 10 },
            splitLine: { lineStyle: { color: "rgba(255,255,255,0.03)" } }
        },
        series: [
            {
                name: "Valor",
                type: "line",
                data: values,
                smooth: true,
                symbol: "circle",
                symbolSize: 8,
                itemStyle: { color: "#10b981" },
                lineStyle: { width: 3, color: "#10b981" },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#10b981' },
                            { offset: 1, color: 'transparent' }
                        ]
                    },
                    opacity: 0.1
                },
                markLine: {
                    symbol: ["none", "none"],
                    data: [
                        ...(USL != null ? [{ yAxis: USL, label: { formatter: 'USL' }, lineStyle: { color: "#ef4444", type: "dashed" as const } }] : []),
                        ...(LSL != null ? [{ yAxis: LSL, label: { formatter: 'LSL' }, lineStyle: { color: "#ef4444", type: "dashed" as const } }] : [])
                    ]
                }
            }
        ],
        tooltip: {
            trigger: "axis",
            formatter: (params: any) => {
                const p = params[0];
                const d = chartData[p.dataIndex];
                return `
                    <div style="padding: 4px">
                        <div style="font-weight: bold; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
                            ${d.sampleCode}
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 20px;">
                            <span style="color: #94a3b8">Valor:</span>
                            <span style="font-weight: bold; color: #10b981">${p.value}</span>
                        </div>
                        ${d.batchCode ? `<div style="display: flex; justify-content: space-between; gap: 20px; font-size: 10px;">
                            <span style="color: #64748b">Lote:</span>
                            <span style="color: #cbd5e1">${d.batchCode}</span>
                        </div>` : ''}
                    </div>
                `;
            }
        }
    };

    const actions = (
        <Stack direction="row" spacing={1}>
            <Select
                value={selectedProduct}
                onValueChange={(val) => {
                    setSelectedProduct(val);
                    handleFilterChange(val, selectedParameter);
                }}
            >
                <SelectTrigger className="w-[140px] h-7 text-[10px] bg-slate-950/50 border-slate-800 text-slate-300">
                    <SelectValue placeholder="Produto" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800">
                    {products.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={selectedParameter}
                onValueChange={(val) => {
                    setSelectedParameter(val);
                    handleFilterChange(selectedProduct, val);
                }}
            >
                <SelectTrigger className="w-[130px] h-7 text-[10px] bg-slate-950/50 border-slate-800 text-slate-300">
                    <SelectValue placeholder="Parâmetro" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800">
                    {parameters.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Stack>
    );

    const footer = (
        <Box className="flex flex-wrap items-center justify-between gap-4">
            <Stack direction="row" spacing={3}>
                <Box className="flex items-center gap-2">
                    <Box className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <Typography className="text-[10px] font-bold uppercase text-slate-400">Resultado Atual</Typography>
                </Box>
                <Box className="flex items-center gap-2">
                    <Box className="h-0.5 w-6 border-t border-dashed border-red-500/50" />
                    <Typography className="text-[10px] font-bold uppercase text-slate-400">Limites Críticos</Typography>
                </Box>
            </Stack>
            <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-[10px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1.5 h-6">
                <Activity className="h-3 w-3" />
                Engine: SmartLab Analytics 4.0
            </Badge>
        </Box>
    );

    return (
        <IndustrialCard
            title="Tendências de Qualidade"
            subtitle="Performance real vs. Limites de Especificação"
            icon={TrendingUp}
            actions={actions}
            footer={footer}
            loading={loading}
            className="h-full"
        >
            <IndustrialChart option={option} height={350} />
        </IndustrialCard>
    );
}
