"use client";

import React, { useMemo } from 'react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { IndustrialGrid } from "@/components/defaults/industrial-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface SampleTableProps {
    samples: any[];
    onEnterResults: (sampleId: string) => void;
}

export function SampleTable({ samples, onEnterResults }: SampleTableProps) {
    const columnDefs = useMemo<ColDef[]>(() => [
        {
            headerName: "Amostra",
            field: "code",
            flex: 1,
            minWidth: 150,
            cellRenderer: (params: ICellRendererParams) => (
                <div className="flex flex-col justify-center h-full py-2">
                    <span className="text-sm font-bold text-slate-100 group-hover:text-blue-400">
                        {params.value}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">
                        {params.data.type?.name}
                    </span>
                </div>
            )
        },
        {
            headerName: "ID Lote",
            field: "batch.code",
            width: 120,
            cellRenderer: (params: ICellRendererParams) => (
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-white/10 text-slate-500 uppercase">
                    {params.value || '—'}
                </Badge>
            )
        },
        {
            headerName: "Produto",
            field: "batch.product.name",
            flex: 1,
            minWidth: 180,
            valueFormatter: (params) => params.value || "Produto N/D"
        },
        {
            headerName: "Lote",
            field: "batch.code",
            flex: 1,
            minWidth: 150,
            valueFormatter: (params) => params.value || "S/ Lote"
        },
        {
            headerName: "Data Colheita",
            field: "collected_at",
            width: 150,
            valueFormatter: (params) => params.value ? format(new Date(params.value), "dd/MM/yy HH:mm") : "—"
        },
        {
            headerName: "Estado",
            field: "status",
            width: 140,
            cellRenderer: (params: ICellRendererParams) => {
                const label = params.value === 'collected' ? 'Colhida' :
                    params.value === 'in_analysis' ? 'Análise' :
                        params.value === 'approved' ? 'Aprovada' : params.value;

                return (
                    <div className="flex items-center h-full">
                        <span className={cn(
                            "text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border border-white/5",
                            params.value === 'collected' ? "text-blue-400 bg-blue-500/10" :
                                params.value === 'in_analysis' ? "text-amber-400 bg-amber-500/10" :
                                    "text-slate-500 bg-slate-500/5"
                        )}>
                            {label}
                        </span>
                    </div>
                );
            }
        },
        {
            headerName: "Ações",
            field: "id",
            width: 180,
            pinned: 'right',
            cellRenderer: (params: ICellRendererParams) => {
                const isActionRequired = params.data.status === 'collected' || params.data.status === 'in_analysis';
                return (
                    <div className="flex items-center justify-end gap-2 h-full pr-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-8 w-8 text-slate-500 hover:text-white"
                        >
                            <a href={`/lab/samples/${params.value}`}>
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                        <Button
                            onClick={() => onEnterResults(params.value)}
                            disabled={!isActionRequired}
                            className={cn(
                                "h-8 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all",
                                isActionRequired
                                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20"
                                    : "bg-slate-800 text-slate-600"
                            )}
                        >
                            {params.data.status === 'collected' ? 'Registar' : 'Resultados'}
                        </Button>
                    </div>
                );
            }
        }
    ], [onEnterResults]);

    return (
        <div className="mb-20 h-[600px] w-full">
            <IndustrialGrid
                rowData={samples}
                columnDefs={columnDefs}
                defaultColDef={{
                    resizable: true,
                    sortable: true,
                    filter: true
                }}
                rowHeight={60}
            />
        </div>
    );
}
