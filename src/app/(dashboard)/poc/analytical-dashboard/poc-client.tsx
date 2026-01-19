// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { GridEngine } from '@/lib/grid-core/engine';
import { ColumnDefinition, GridState } from '@/lib/grid-core/types';
import { UI5Provider } from '@/components/providers/ui5-provider';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';

// Mock Data
const MOCK_DATA = Array.from({ length: 25 }, (_, i) => ({
    id: `LOT-${1000 + i}`,
    product: i % 4 === 0 ? "Leite Condensado" : i % 4 === 1 ? "Manteiga Extra" : i % 4 === 2 ? "Creme de Leite" : "Doce de Leite",
    sample: `AM-${5000 + i}`,
    parameter: "Gordura (%)",
    result: (12 + Math.random() * 5).toFixed(1),
    status: Math.random() > 0.1 ? "Conforme" : "OOS",
    analyst: i % 2 === 0 ? "Sérgio Ramos" : "Lúcia Santos",
    timestamp: new Date().toISOString()
}));

const COLUMNS: ColumnDefinition<any>[] = [
    { id: 'id', header: 'Lote', field: 'id', width: 120 },
    { id: 'product', header: 'Produto', field: 'product', width: 220 },
    { id: 'parameter', header: 'Parâmetro', field: 'parameter', width: 140 },
    { id: 'result', header: 'V. Medido', field: 'result', width: 120, editable: true, validation: (v) => (parseFloat(v) < 13 || parseFloat(v) > 16) ? 'OOS' : undefined },
    { id: 'status', header: 'Estado', field: 'status', width: 130 },
];

export default function AnalyticalDashboardPOC() {
    const [gridState, setGridState] = useState<GridState<any> | null>(null);
    const [engine, setEngine] = useState<GridEngine<any> | null>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const gridEngine = new GridEngine(MOCK_DATA, COLUMNS, (newState) => {
            setGridState(newState);
        });
        setEngine(gridEngine);

        // Ensure UI5 is ready before showing content
        const timer = setTimeout(() => setIsReady(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleCellChange = (rowId: string, colId: string, newValue: string) => {
        engine?.updateCell(rowId, colId, newValue, "USER-01");
    };

    if (!gridState || !isReady) return (
        <div className="flex h-screen w-screen items-center justify-center bg-[#0a0d10] font-mono text-emerald-500">
            LOADING INDUSTRIAL KERNEL...
        </div>
    );

    const chartData = gridState.rows.slice(0, 15).map(r => ({
        id: r.id,
        val: parseFloat(r.cells['result'].value) || 0
    }));

    return (
        <UI5Provider>
            <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0d10] text-slate-100">
                <ui5-shellbar
                    primary-title="SmartLab v4"
                    secondary-title="Quality Executive Workbench"
                    show-notifications
                >
                    <ui5-button icon="menu" slot="startButton" design="Transparent" onClick={() => setCollapsed(!collapsed)}></ui5-button>
                    <ui5-avatar slot="profile" icon="customer" shape="Circle" color-scheme="Accent1"></ui5-avatar>
                </ui5-shellbar>

                <div className="flex flex-1 overflow-hidden h-full">
                    <ui5-side-navigation collapsed={collapsed} class="flex-shrink-0 border-r border-slate-800" style={{ height: "100%" }}>
                        <ui5-side-navigation-item text="Overview" icon="home" selected></ui5-side-navigation-item>
                        <ui5-side-navigation-item text="Analytical Execution" icon="activities" expanded>
                            <ui5-side-navigation-sub-item text="Physical-Chemical" icon="table-view"></ui5-side-navigation-sub-item>
                            <ui5-side-navigation-sub-item text="Microbiology" icon="temperature"></ui5-side-navigation-sub-item>
                        </ui5-side-navigation-item>
                        <ui5-side-navigation-item text="Audit Trail" icon="history" slot="fixedItems"></ui5-side-navigation-item>
                    </ui5-side-navigation>

                    <main className="flex-1 flex flex-col min-w-0 bg-[#0f172a] overflow-hidden">
                        <ui5-dynamic-page style={{ height: "100%" }} header-snapped-on-scroll show-footer>
                            <ui5-dynamic-page-title slot="titleArea">
                                <div slot="heading" className="flex items-center space-x-3">
                                    <h2 className="text-xl font-bold uppercase tracking-tight text-slate-200">Execution Workspace</h2>
                                    <ui5-tag design="Positive">Live Traceability</ui5-tag>
                                </div>
                                <div slot="actions">
                                    <ui5-button design="Emphasized">Release Batch</ui5-button>
                                </div>
                            </ui5-dynamic-page-title>

                            <ui5-dynamic-page-header slot="headerArea">
                                <div className="flex gap-16 py-4">
                                    <div className="w-[300px] h-24">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <Line type="stepAfter" dataKey="val" stroke="#0070d2" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Metrics Center</span>
                                        <div className="flex items-baseline space-x-4 mt-1">
                                            <span className="text-3xl font-light text-slate-200">{gridState.rows.length} Batches</span>
                                            <span className="text-sm font-mono text-emerald-500">OEE: 94.2%</span>
                                        </div>
                                    </div>
                                </div>
                            </ui5-dynamic-page-header>

                            <div className="p-4 flex flex-col h-full">
                                <ui5-card class="flex-1 flex flex-col bg-[#1e293b]/30 border-slate-800 shadow-2xl rounded-lg">
                                    <ui5-card-header slot="header" title="Analyses Queue" subtitle="Industrial Grid Core Logic"></ui5-card-header>

                                    <div className="p-1 overflow-auto flex-1 h-[500px]">
                                        <ui5-table mode="SingleSelect" class="w-full">
                                            <ui5-table-header-row slot="headerRow">
                                                {gridState.columns.map(col => (
                                                    <ui5-table-header-cell key={col.id} style={{ width: `${col.width}px` }}>
                                                        <ui5-label className="font-bold uppercase text-[10px] text-slate-400">{col.header}</ui5-label>
                                                    </ui5-table-header-cell>
                                                ))}
                                            </ui5-table-header-row>

                                            {gridState.rows.map(row => (
                                                <ui5-table-row key={row.id}>
                                                    {gridState.columns.map(col => {
                                                        const cell = row.cells[col.id];
                                                        const isOOS = cell.value === 'OOS' || cell.status === 'invalid';

                                                        return (
                                                            <ui5-table-cell key={col.id}>
                                                                {col.editable ? (
                                                                    <ui5-input
                                                                        value={cell.value}
                                                                        value-state={cell.status === 'invalid' ? 'Critical' : 'None'}
                                                                        onInput={(e: any) => handleCellChange(row.id, col.id, e.target.value)}
                                                                        style={{ width: "100%", background: "transparent" }}
                                                                    ></ui5-input>
                                                                ) : (
                                                                    <div className="flex items-center space-x-2">
                                                                        {col.id === 'status' ? (
                                                                            <ui5-tag design={isOOS ? "Critical" : "Set8"} className="min-w-[90px]">
                                                                                {cell.value}
                                                                            </ui5-tag>
                                                                        ) : (
                                                                            <span className={`text-[13px] ${col.id === 'id' ? 'font-black font-mono text-[#00d28d]' : ''}`}>
                                                                                {cell.value}
                                                                            </span>
                                                                        )}
                                                                        {row.auditHistory.some(a => a.columnId === col.id) && (
                                                                            <ui5-icon name="edit" style={{ fontSize: "12px", color: "#f59e0b" }}></ui5-icon>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </ui5-table-cell>
                                                        );
                                                    })}
                                                </ui5-table-row>
                                            ))}
                                        </ui5-table>
                                    </div>
                                </ui5-card>
                            </div>

                            <ui5-bar slot="footer" design="Footer">
                                <ui5-button slot="end" design="Positive" icon="accept">Finalize Analysis</ui5-button>
                            </ui5-bar>
                        </ui5-dynamic-page>
                    </main>
                </div>
            </div>

            <style jsx global>{`
                :root {
                    --_ui5_shellbar_background: #12171c;
                    --_ui5_side_navigation_background: #12171c;
                    --_ui5_dynamic_page_header_background: #0f172a;
                    --_ui5_table_background: transparent;
                }
                body {
                    margin: 0;
                    background: #0a0d10 !important;
                    font-family: 'Inter', sans-serif;
                }
                ui5-dynamic-page::part(content) {
                    background: transparent !important;
                    height: 100% !important;
                }
                ui5-table {
                    --_ui5_table_header_background: rgba(255, 255, 255, 0.03);
                }
            `}</style>
        </UI5Provider>
    );
}
