"use client";

import type { EChartsOption } from "echarts";
import { IndustrialChart } from "@/components/shared/industrial-chart";

interface ChartData {
    name: string;
    samples: number;
    quality: number;
}

interface DashboardChartsProps {
    data: ChartData[];
}

export function DashboardCharts({ data }: DashboardChartsProps) {
    const option: EChartsOption = {
        grid: { top: 20, right: 20, bottom: 30, left: 40 },
        xAxis: {
            type: "category",
            data: data.map(d => d.name),
            axisLabel: { color: "#94a3b8", fontSize: 10 },
            axisLine: { show: false },
            axisTick: { show: false }
        },
        yAxis: {
            type: "value",
            axisLabel: { color: "#94a3b8", fontSize: 10 },
            splitLine: { lineStyle: { color: "rgba(255,255,255,0.03)" } }
        },
        tooltip: {
            trigger: "axis",
            backgroundColor: "#020617",
            borderColor: "#1e293b",
            textStyle: { color: "#f8fafc", fontSize: 12 }
        },
        series: [
            {
                name: "Amostras",
                type: "line",
                data: data.map(d => d.samples),
                smooth: true,
                lineStyle: { color: "#3b82f6", width: 2 },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: 'transparent' }]
                    },
                    opacity: 0.2
                }
            },
            {
                name: "Qualidade",
                type: "line",
                data: data.map(d => d.quality),
                smooth: true,
                symbol: "circle",
                symbolSize: 6,
                itemStyle: { color: "#10b981" },
                lineStyle: { color: "#10b981", width: 2 }
            }
        ]
    };

    return <IndustrialChart option={option} height="100%" />;
}
