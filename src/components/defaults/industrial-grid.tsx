"use client";

import React, { useState, useEffect } from 'react';
import { AgGridReact, AgGridReactProps } from 'ag-grid-react';
import {
    themeQuartz,
    AllCommunityModule,
    ModuleRegistry
} from 'ag-grid-community';

// IMPORTANT: Do NOT import ag-grid.css or ag-theme-quartz.css when using the programmatic Theming API (v32+)
// This avoids AG Grid Error #106.

// IMPORTANT: Register modules outside the component to prevent repeated registration on re-renders
ModuleRegistry.registerModules([AllCommunityModule]);

export const industrialTheme = themeQuartz
    .withParams({
        backgroundColor: "#1f2836",
        browserColorScheme: "dark",
        chromeBackgroundColor: {
            ref: "foregroundColor",
            mix: 0.07,
            onto: "backgroundColor"
        },
        foregroundColor: "#FFF",
        headerFontSize: 14,
        headerFontWeight: 700,
        headerTextColor: "#94a3b8",
        spacing: 8
    });

export function IndustrialGrid(props: AgGridReactProps) {
    const [mounted, setMounted] = useState(false);

    // Prevent AG Grid from initializing before the component is mounted to avoid
    // state update warnings and hydration mismatches in Next.js
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-full h-full bg-[#1f2836]/20 animate-pulse rounded-lg border border-white/5" />
        );
    }

    return (
        <AgGridReact
            theme={industrialTheme}
            animateRows={true}
            headerHeight={48}
            {...props}
        />
    );
}
