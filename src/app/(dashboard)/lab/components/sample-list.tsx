"use client";

import React, { useMemo } from 'react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { IndustrialGrid } from "@/components/defaults/industrial-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink, Database } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface SampleListProps {
    samples: any[];
    onEnterResults: (sampleId: string) => void;
}

export function SampleList({ samples, onEnterResults }: SampleListProps) {
    const columnDefs = useMemo<ColDef[]>(() => [
        {
            headerName: "Identificação",
            field: "code",
            flex: 2,
            minWidth: 250,
            cellRenderer: (params: ICellRendererParams) => (
                <div className="flex items-center gap-3 h-full">
                    <div className="h-8 w-8 flex items-center justify-center rounded-md bg-[#2f3744] text-slate-400 group-hover:text-blue-400 transition-colors shrink-0">
                        <Database className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col justify-center gap-0.5 leading-tight">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-white group-hover:text-blue-400 transition-colors">
                                {params.value}
                            </span>
                            <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 border-[#2f3744] text-slate-400 uppercase bg-[#2f3744]/30">
                                {params.data.batch?.code || 'NO BATCH'}
                            </Badge>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500">
                            {params.data.type?.name}
                        </span>
                    </div>
                </div>
            )
        },
        {
            headerName: "Produto",
            field: "batch.product.name",
            flex: 1.5,
            minWidth: 200,
            cellRenderer: (params: ICellRendererParams) => (
                <div className="flex items-center h-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {params.value || "Produto N/D"}
                    </span>
                </div>
            )
        },
        {
            headerName: "Lote",
            field: "batch.code",
            flex: 1,
            minWidth: 150,
            cellRenderer: (params: ICellRendererParams) => (
                <div className="flex flex-col justify-center h-full leading-tight">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#2f3744]/60">Lote Industrial</span>
                    <span className="text-[12px] font-medium text-slate-300">
                        {params.value || "S/ Lote"}
                    </span>
                </div>
            )
        },
        {
            headerName: "Data",
            field: "collected_at",
            width: 150,
            cellRenderer: (params: ICellRendererParams) => {
                const date = params.value ? new Date(params.value) : new Date(params.data.created_at);
                return (
                    <div className="flex flex-col justify-center h-full leading-tight">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#2f3744]/60">Colheita</span>
                        <span className="text-[12px] font-medium text-slate-300">
                            {format(date, "dd MMM, HH:mm", { locale: pt })}
                        </span>
                    </div>
                );
            }
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
                    <div className="flex items-center justify-center h-full">
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md border border-[#2f3744]",
                            params.value === 'collected' ? "text-blue-400 bg-blue-500/10" :
                                params.value === 'in_analysis' ? "text-amber-400 bg-amber-500/10" :
                                    "text-slate-400 bg-[#2f3744]/50"
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
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-[#2f3744]"
                        >
                            <a href={`/lab/samples/${params.value}`}>
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </Button>

                        <Button
                            onClick={() => onEnterResults(params.value)}
                            disabled={!isActionRequired}
                            className={cn(
                                "h-8 px-5 rounded-md font-bold text-[10px] uppercase tracking-widest transition-all",
                                isActionRequired
                                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40"
                                    : "bg-[#2f3744] text-slate-500"
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
        <div className="mb-20 h-[700px] w-full shadow-2xl rounded-xl overflow-hidden border border-[#2f3744]">
            <IndustrialGrid
                rowData={samples}
                columnDefs={columnDefs}
                defaultColDef={{
                    resizable: true,
                    sortable: true,
                    filter: true
                }}
                rowHeight={70}
            />
        </div>
    );
}
