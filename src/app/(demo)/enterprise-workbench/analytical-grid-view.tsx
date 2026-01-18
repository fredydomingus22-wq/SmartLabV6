"use client";

import React, { useState, useEffect } from 'react';
import { useUI5Store } from './store';
import { GridEngine } from '@/lib/grid-core/engine';
import { ColumnDefinition, GridState } from '@/lib/grid-core/types';

const MOCK_DATA = Array.from({ length: 40 }, (_, i) => ({
    id: `LOT-${2000 + i}`,
    product: i % 5 === 0 ? "Leite Condensado 395g" : i % 5 === 1 ? "Manteiga com Sal 200g" : i % 5 === 2 ? "Creme de Leite 200g" : "Leite UHT Integral 1L",
    sample: `AM-${7000 + i}`,
    parameter: i % 2 === 0 ? "Gordura (%)" : "Umidade (%)",
    result: (14 + Math.random() * 8).toFixed(2),
    status: "Pending",
    analyst: "Sérgio Ramos",
    timestamp: new Date().toISOString()
}));

const COLUMNS: ColumnDefinition<any>[] = [
    { id: 'id', header: 'Lote / Batch', field: 'id', width: 140 },
    { id: 'product', header: 'Produto / SKU', field: 'product', width: 260 },
    { id: 'parameter', header: 'Parâmetro', field: 'parameter', width: 160 },
    {
        id: 'result',
        header: 'V. Medido',
        field: 'result',
        width: 140,
        editable: true,
        validation: (v) => {
            const val = parseFloat(v);
            if (isNaN(val)) return 'Invalid Number';
            if (val < 13.5 || val > 16.5) return 'OOS';
            return undefined;
        }
    },
    { id: 'status', header: 'Status', field: 'status', width: 140 },
];

export function AnalyticalGridView() {
    const { showToast } = useUI5Store();
    const [gridState, setGridState] = useState<GridState<any> | null>(null);
    const [engine, setEngine] = useState<GridEngine<any> | null>(null);

    useEffect(() => {
        const gridEngine = new GridEngine(MOCK_DATA, COLUMNS, (newState) => {
            setGridState(newState);
        });
        setEngine(gridEngine);
    }, []);

    const handleCellChange = (rowId: string, colId: string, newValue: string) => {
        engine?.updateCell(rowId, colId, newValue, "ANALYST_SR01");
        showToast(`Audit log generated for ${rowId}: Set ${newValue}`);
    };

    if (!gridState) return null;

    return (
        <div className="flex flex-col h-full bg-slate-900/40 rounded-xl border border-white/10 m-4 overflow-hidden shadow-2xl backdrop-blur-sm">
            <ui5-card class="h-full flex flex-col bg-transparent border-none">
                <ui5-card-header
                    slot="header"
                    title="Analytical Raw Data"
                    subtitle="Real-time Synchronization & Technical Validation"
                    status={`${gridState.rows.length} Records`}
                >
                    <ui5-icon name="table-view" slot="avatar" class="text-emerald-400"></ui5-icon>
                </ui5-card-header>

                <div className="flex-1 overflow-auto p-2">
                    <ui5-table mode="SingleSelect" class="ui5-table-industrial">
                        <ui5-table-header-row slot="headerRow">
                            {gridState.columns.map(col => (
                                <ui5-table-header-cell key={col.id} style={{ width: `${col.width}px` }}>
                                    <ui5-label className="font-black uppercase text-[10px] text-muted-foreground tracking-tighter">
                                        {col.header}
                                    </ui5-label>
                                </ui5-table-header-cell>
                            ))}
                        </ui5-table-header-row>

                        {gridState.rows.map(row => (
                            <ui5-table-row key={row.id}>
                                {gridState.columns.map(col => {
                                    const cell = row.cells[col.id];
                                    const isOOS = cell.status === 'invalid';

                                    return (
                                        <ui5-table-cell key={col.id}>
                                            {col.editable ? (
                                                <div className="flex items-center space-x-2 w-full">
                                                    <ui5-input
                                                        value={cell.value}
                                                        value-state={isOOS ? 'Critical' : 'None'}
                                                        onInput={(e: any) => handleCellChange(row.id, col.id, e.target.value)}
                                                        style={{ width: "100%" }}
                                                        class="bg-white/5"
                                                    ></ui5-input>
                                                    {isOOS && (
                                                        <ui5-icon name="alert" class="text-destructive text-sm"></ui5-icon>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-3">
                                                    {col.id === 'status' ? (
                                                        <ui5-tag
                                                            design={cell.status === 'invalid' ? "Critical" : "Set2"}
                                                            className="min-w-[100px] border-none shadow-sm"
                                                        >
                                                            {cell.status === 'invalid' ? 'OUT OF SPEC' : 'CONFORME'}
                                                        </ui5-tag>
                                                    ) : (
                                                        <span className={`text-[13px] tracking-tight ${col.id === 'id' ? 'font-black font-mono text-emerald-400' : 'text-slate-300'}`}>
                                                            {cell.value}
                                                        </span>
                                                    )}
                                                    {row.auditHistory.some(a => a.columnId === col.id) && (
                                                        <div className="flex items-center">
                                                            <ui5-icon name="edit" class="text-amber-500 text-xs"></ui5-icon>
                                                            <span className="text-[10px] text-amber-500 font-mono ml-1">AUDIT</span>
                                                        </div>
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

            <style jsx global>{`
                .ui5-table-industrial {
                    --_ui5_table_row_height: 3.5rem;
                    background: transparent;
                }
                ui5-table-header-row {
                    background: rgba(15, 23, 42, 0.8) !important;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                }
                ui5-table-row:hover {
                    background: rgba(255, 255, 255, 0.05) !important;
                }
            `}</style>
        </div>
    );
}
