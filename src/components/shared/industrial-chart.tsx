"use client";

import React, { useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { Skeleton } from "@/components/ui/skeleton";

interface IndustrialChartProps {
    option: EChartsOption;
    height?: string | number;
    loading?: boolean;
    className?: string;
    onChartReady?: (instance: any) => void;
}

/**
 * IndustrialChart: Standardized ECharts wrapper for SmartLab Enterprise.
 * Provides consistent styling, performance, and dark-mode defaults.
 */
export function IndustrialChart({
    option,
    height = "100%",
    loading = false,
    className,
    onChartReady
}: IndustrialChartProps) {
    const chartRef = useRef<any>(null);

    // Default SmartLab Enterprise Theme Overrides
    const defaultOption: EChartsOption = {
        backgroundColor: "transparent",
        textStyle: {
            fontFamily: "Inter, sans-serif",
            color: "#94a3b8" // slate-400
        },
        tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)", // slate-950
            borderColor: "rgba(255, 255, 255, 0.1)",
            textStyle: { color: "#f8fafc" },
            borderRadius: 12,
            padding: 12,
            shadowColor: "rgba(0, 0, 0, 0.3)",
            shadowBlur: 10
        },
        grid: {
            top: 20,
            bottom: 20,
            left: 10,
            right: 10,
            containLabel: true
        }
    };

    // Deep merge would be better, but for now we manually combine
    const mergedOption = {
        ...defaultOption,
        ...option,
        // Ensure some defaults aren't easily overridden without intent
        grid: option.grid || defaultOption.grid,
        textStyle: { ...defaultOption.textStyle, ...option.textStyle },
        tooltip: { ...defaultOption.tooltip, ...option.tooltip }
    };

    if (loading) {
        return <Skeleton className="w-full h-full min-h-[150px] rounded-xl bg-slate-800/20" />;
    }

    return (
        <div className={className} style={{ width: "100%", height }}>
            <ReactECharts
                ref={chartRef}
                option={mergedOption}
                style={{ height: "100%", width: "100%" }}
                onEvents={{}}
                onChartReady={onChartReady}
                theme="dark" // Uses echarts built-in dark theme as base
                notMerge={true}
                lazyUpdate={true}
            />
        </div>
    );
}
