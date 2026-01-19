"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RetestDialog } from "../retest-dialog";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Search, XCircle, Fingerprint, Database, Calendar, Filter } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { IndustrialGrid } from "@/components/defaults/industrial-grid";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { cn } from "@/lib/utils";

interface HistoryListClientProps {
    results: any[];
}

const unwrap = (val: any): any => {
    if (!val) return null;
    return Array.isArray(val) ? val[0] : val;
};

export function HistoryListClient({ results }: HistoryListClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [batchFilter, setBatchFilter] = useState<string>("all");
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");

    const uniqueBatches = useMemo(() => {
        const batches = new Set<string>();
        results.forEach(r => {
            const sample = unwrap(r.sample);
            const batch = unwrap(sample?.batch);
            if (batch?.code) batches.add(batch.code);
        });
        return Array.from(batches).sort();
    }, [results]);

    const filteredResults = useMemo(() => {
        return results.filter(row => {
            const sample = unwrap(row.sample);
            const batch = unwrap(sample?.batch);
            const product = unwrap(batch?.product);
            const param = unwrap(row.parameter);

            if (searchQuery) {
                const search = searchQuery.toLowerCase();
                const matches =
                    sample?.code?.toLowerCase().includes(search) ||
                    batch?.code?.toLowerCase().includes(search) ||
                    product?.name?.toLowerCase().includes(search) ||
                    param?.name?.toLowerCase().includes(search);
                if (!matches) return false;
            }

            if (statusFilter !== "all") {
                if (statusFilter === "conforming" && !row.is_conforming) return false;
                if (statusFilter === "non_conforming" && row.is_conforming) return false;
                if (statusFilter === "retest" && !row.is_retest) return false;
            }

            if (batchFilter !== "all" && batch?.code !== batchFilter) return false;

            if (dateFrom && row.analyzed_at) {
                if (new Date(row.analyzed_at) < new Date(dateFrom)) return false;
            }
            if (dateTo && row.analyzed_at) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (new Date(row.analyzed_at) > toDate) return false;
            }

            return true;
        });
    }, [results, searchQuery, statusFilter, batchFilter, dateFrom, dateTo]);

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setBatchFilter("all");
        setDateFrom("");
        setDateTo("");
    };

    const hasActiveFilters = searchQuery || statusFilter !== "all" || batchFilter !== "all" || dateFrom || dateTo;

    const columnDefs = useMemo<ColDef[]>(() => [
        {
            headerName: "Assinatura Digital",
            field: "signed_transaction_hash",
            width: 100,
            cellRenderer: (params: ICellRendererParams) => {
                if (!params.value) return null;
                return (
                    <div className="flex items-center justify-center h-full">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center cursor-help">
                                        <Fingerprint className="h-4 w-4 text-emerald-500" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-950 border-slate-800 p-3 rounded-xl shadow-2xl">
                                    <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest italic">Integridade Certificada (21 CFR Part 11)</p>
                                    <p className="text-[9px] font-mono text-slate-500 mt-1 break-all max-w-[200px]">{params.value}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                );
            }
        },
        {
            headerName: "Data de Análise",
            field: "analyzed_at",
            flex: 1,
            cellRenderer: (params: ICellRendererParams) => (
                <div className="flex items-center gap-2 h-full text-slate-300 font-medium">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    {params.value ? format(new Date(params.value), "dd/MM/yyyy HH:mm") : "-"}
                </div>
            )
        },
        {
            headerName: "Amostra / Lote",
            field: "sample.code",
            flex: 1.5,
            cellRenderer: (params: ICellRendererParams) => {
                const sample = unwrap(params.data.sample);
                const batch = unwrap(sample?.batch);
                return (
                    <div className="flex flex-col justify-center h-full leading-tight">
                        <span className="text-sm font-bold text-white tracking-tight">{sample?.code || "-"}</span>
                        <span className="text-[10px] font-mono font-black uppercase text-slate-500">{batch?.code || "S/ Lote"}</span>
                    </div>
                );
            }
        },
        {
            headerName: "Parâmetro / Resultado",
            field: "parameter.name",
            flex: 2,
            cellRenderer: (params: ICellRendererParams) => {
                const param = unwrap(params.data.parameter);
                const isConforming = params.data.is_conforming;
                return (
                    <div className="flex items-center gap-3 h-full">
                        <div className={cn(
                            "h-2 w-2 rounded-full",
                            isConforming === true ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                isConforming === false ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "bg-slate-600"
                        )} />
                        <div className="flex flex-col justify-center leading-tight">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-400">{param?.name || "-"}</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-sm font-black text-white italic">{params.data.value_numeric ?? params.data.value_text ?? "-"}</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase">{param?.unit}</span>
                            </div>
                        </div>
                    </div>
                );
            }
        },
        {
            headerName: "Ações",
            field: "actions",
            width: 120,
            cellRenderer: (params: ICellRendererParams) => {
                const sample = unwrap(params.data.sample);
                const param = unwrap(params.data.parameter);
                const canRetest = params.data.is_valid !== false && params.data.is_conforming === false && sample?.status !== "approved";

                if (!canRetest) return null;

                return (
                    <div className="flex items-center h-full">
                        <RetestDialog
                            resultId={params.data.id}
                            parameterName={param?.name || "Desconhecido"}
                            sampleCode={sample?.code || "Desconhecido"}
                            currentValue={params.data.value_numeric ?? params.data.value_text ?? "-"}
                            isConforming={params.data.is_conforming ?? true}
                        />
                    </div>
                );
            }
        }
    ], []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 p-6 bg-slate-950/40 rounded-2xl border border-white/5 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Pesquisa Inteligente</Label>
                        <div className="relative group">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-600 group-focus-within:text-purple-400 transition-colors" />
                            <Input
                                placeholder="Amostra, Lote, Produto..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-900/50 border-white/5 rounded-xl h-10 text-xs font-bold italic"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Estado de Conformidade</Label>
                        <SearchableSelect
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                            placeholder="Todos os Estados"
                            options={[
                                { value: "all", label: "Todos" },
                                { value: "conforming", label: "Conforme (OK)" },
                                { value: "non_conforming", label: "Não Conforme (NC)" },
                                { value: "retest", label: "Apenas Retestes" },
                            ]}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Lote de Produção</Label>
                        <SearchableSelect
                            value={batchFilter}
                            onValueChange={setBatchFilter}
                            placeholder="Todos os Lotes"
                            options={[
                                { value: "all", label: "Todos os Lotes" },
                                ...uniqueBatches.map(batch => ({ value: batch, label: batch }))
                            ]}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data Inicial</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="pl-10 bg-slate-900/50 border-white/5 rounded-xl h-10 text-xs font-bold uppercase"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data Final</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="pl-10 bg-slate-900/50 border-white/5 rounded-xl h-10 text-xs font-bold uppercase"
                            />
                        </div>
                    </div>
                </div>

                {hasActiveFilters && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">
                            Resultados Filtrados: {filteredResults.length} / {results.length}
                        </span>
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 text-[9px] font-black uppercase tracking-widest">
                            <XCircle className="h-3 w-3 mr-2" />
                            Limpar Filtros
                        </Button>
                    </div>
                )}
            </div>

            <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-slate-950/20">
                <IndustrialGrid
                    rowData={filteredResults}
                    columnDefs={columnDefs}
                    rowHeight={64}
                />
            </div>
        </div>
    );
}
