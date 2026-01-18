"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GridEngine } from '@/lib/grid-core/engine';
import { ColumnDefinition, GridState } from '@/lib/grid-core/types';
import { UI5Provider } from '@/components/providers/ui5-provider';

// Mock Data
const MOCK_DATA = Array.from({ length: 50 }, (_, i) => ({
    id: `BATCH-${1000 + i}`,
    product: i % 3 === 0 ? "Leite UHT Integral" : i % 3 === 1 ? "Iogurte Natural" : "Queijo Prato",
    sample: `S-${2000 + i}`,
    parameter: "Acidez",
    result: (3.5 + Math.random() * 2).toFixed(2),
    status: Math.random() > 0.15 ? "Conforme" : "OOS",
    collectedAt: new Date().toISOString()
}));

const COLUMNS: ColumnDefinition<any>[] = [
    { id: 'batch', header: 'Lote', field: 'id', width: 150 },
    { id: 'product', header: 'Produto', field: 'product', width: 200 },
    { id: 'sample', header: 'Amostra', field: 'sample', width: 120 },
    { id: 'parameter', header: 'Parâmetro', field: 'parameter', width: 120 },
    { id: 'result', header: 'Resultado', field: 'result', width: 100, editable: true, validation: (v) => parseFloat(v) > 5 ? 'Acima do limite' : undefined },
    { id: 'status', header: 'Status', field: 'status', width: 120 },
];

export default function AnalyticalDashboardPOC() {
    const [gridState, setGridState] = useState<GridState<any> | null>(null);
    const [engine, setEngine] = useState<GridEngine<any> | null>(null);

    useEffect(() => {
        const gridEngine = new GridEngine(MOCK_DATA, COLUMNS, (newState) => {
            setGridState(newState);
        });
        setEngine(gridEngine);
    }, []);

    const handleCellChange = (rowId: string, colId: string, newValue: string) => {
        engine?.updateCell(rowId, colId, newValue, "USER_001");
    };

    if (!gridState) return <div className="p-8 text-white">A carregar Grid Core...</div>;

    const stats = {
        total: gridState.rows.length,
        oos: gridState.rows.filter(r => r.cells['status'].value === 'OOS').length,
        pending: gridState.rows.filter(r => r.cells['result'].value === '').length,
    };

    return (
        <UI5Provider>
            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
                {/* @ts-ignore */}
                <ui5-shellbar
                    primary-title="SmartLab v4"
                    secondary-title="Industrial Grid Core POC"
                    show-notifications
                >
                    {/* @ts-ignore */}
                    <ui5-button icon="log" slot="profile"></ui5-button>
                </ui5-shellbar>

                <main className="p-6 space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* @ts-ignore */}
                        <ui5-card heading="Total de Lotes" subtitle="Amostras recolhidas" class="glass-card">
                            <div className="p-4 text-3xl font-bold text-emerald-400">{stats.total}</div>
                        </ui5-card>
                        {/* @ts-ignore */}
                        <ui5-card heading="OOS Detectados" subtitle="Fora de especificação" class="glass-card">
                            <div className="p-4 text-3xl font-bold text-red-400">{stats.oos}</div>
                        </ui5-card>
                        {/* @ts-ignore */}
                        <ui5-card heading="Ações Pendentes" subtitle="Aguardando resultado" class="glass-card">
                            <div className="p-4 text-3xl font-bold text-amber-400">{stats.pending}</div>
                        </ui5-card>
                    </div>

                    {/* Industrial Grid */}
                    {/* @ts-ignore */}
                    <ui5-card heading="Execução de Análises" subtitle="Grid Core Headless Engine" class="glass-card overflow-hidden">
                        <div className="p-2 overflow-x-auto">
                            {/* @ts-ignore */}
                            <ui5-table class="grid-table">
                                {gridState.columns.map(col => (
                                    /* @ts-ignore */
                                    <ui5-table-column key={col.id} slot="columns" style={{ width: `${col.width}px` }}>
                                        {/* @ts-ignore */}
                                        <ui5-label className="font-bold">{col.header}</ui5-label>
                                    </ui5-table-column>
                                ))}

                                {gridState.rows.map(row => (
                                    /* @ts-ignore */
                                    <ui5-table-row key={row.id}>
                                        {gridState.columns.map(col => {
                                            const cell = row.cells[col.id];
                                            const isOOS = cell.value === 'OOS' || cell.status === 'invalid';

                                            return (
                                                /* @ts-ignore */
                                                <ui5-table-cell key={col.id}>
                                                    {col.editable ? (
                                                        /* @ts-ignore */
                                                        <ui5-input
                                                            value={cell.value}
                                                            value-state={cell.status === 'invalid' ? 'Error' : 'None'}
                                                            onInput={(e: any) => handleCellChange(row.id, col.id, e.target.value)}
                                                            className="w-full"
                                                        ></ui5-input>
                                                    ) : (
                                                        <div className="flex items-center space-x-2">
                                                            {col.id === 'status' ? (
                                                                /* @ts-ignore */
                                                                <ui5-badge color-scheme={isOOS ? "1" : "8"}>
                                                                    {cell.value}
                                                                </ui5-badge>
                                                            ) : (
                                                                <span>{cell.value}</span>
                                                            )}
                                                            {row.auditHistory.some(a => a.columnId === col.id) && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Editado (Audit)"></span>
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

                    {/* Audit Timeline Sidebar (Mockup) */}
                    <div className="mt-8 border-t border-slate-800 pt-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center">
                            <span className="mr-2">🕒</span> Trilha de Auditoria (Sessão Atual)
                        </h3>
                        {/* @ts-ignore */}
                        <ui5-timeline>
                            {gridState.rows.flatMap(r => r.auditHistory)
                                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                .slice(0, 10)
                                .map(event => (
                                    /* @ts-ignore */
                                    <ui5-timeline-item
                                        key={event.id}
                                        title-text={`Edição em ${event.entityId}`}
                                        subtitle-text={new Date(event.timestamp).toLocaleString()}
                                        icon="edit"
                                    >
                                        Alteração de <strong>{event.oldValue}</strong> para <strong>{event.newValue}</strong> na coluna <code>{event.columnId}</code>.
                                    </ui5-timeline-item>
                                ))
                            }
                        </ui5-timeline>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                .glass-card {
                    background: rgba(30, 41, 59, 0.7) !important;
                    backdrop-filter: blur(12px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 12px !important;
                }
                .grid-table {
                    background: transparent !important;
                }
                ui5-shellbar {
                    background: #0f172a !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                }
                ui5-input {
                    --_ui5_input_background: rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </UI5Provider>
    );
}
