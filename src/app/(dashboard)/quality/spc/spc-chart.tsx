"use client";

import { ControlChart } from "@/components/smart/control-chart";
import type { SPCResult } from "@/lib/queries/spc";

interface SPCControlChartProps {
    spcData: SPCResult;
}

export function SPCControlChart({ spcData }: SPCControlChartProps) {
    const { data, mean, ucl, lcl, specLimits, parameter } = spcData;

    // Transform data for Recharts (Format Date)
    const chartData = data.map(d => ({
        ...d,
        dateFormatted: new Date(d.date).toLocaleDateString(),
    }));

    return (
        <ControlChart
            title={`Control Chart: ${parameter.name}`}
            description="X-Bar process control monitoring"
            data={chartData}
            xKey="dateFormatted"
            yKey="value"
            ucl={ucl}
            lcl={lcl}
            mean={mean}
            usl={specLimits?.usl ?? undefined}
            lsl={specLimits?.lsl ?? undefined}
            highlightOOC={true}
            height={400}
        />
    );
}
