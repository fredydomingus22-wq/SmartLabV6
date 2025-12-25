"use client";

import { format } from "date-fns";
import { useState, useMemo } from "react";
import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RetestDialog } from "../retest-dialog";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Search, Filter, XCircle, Fingerprint, ShieldCheck } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyResult = any;

interface HistoryListClientProps {
    results: AnyResult[];
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

    // Extract unique batches for filter dropdown
    const uniqueBatches = useMemo(() => {
        const batches = new Set<string>();
        results.forEach(r => {
            const sample = unwrap(r.sample);
            const batch = unwrap(sample?.batch);
            if (batch?.code) batches.add(batch.code);
        });
        return Array.from(batches).sort();
    }, [results]);

    // Filter results
    const filteredResults = useMemo(() => {
        return results.filter(row => {
            const sample = unwrap(row.sample);
            const batch = unwrap(sample?.batch);
            const product = unwrap(batch?.product);
            const param = unwrap(row.parameter);

            // Search filter (sample code, batch, product, parameter)
            if (searchQuery) {
                const search = searchQuery.toLowerCase();
                const matches =
                    sample?.code?.toLowerCase().includes(search) ||
                    batch?.code?.toLowerCase().includes(search) ||
                    product?.name?.toLowerCase().includes(search) ||
                    param?.name?.toLowerCase().includes(search);
                if (!matches) return false;
            }

            // Status filter
            if (statusFilter !== "all") {
                if (statusFilter === "conforming" && !row.is_conforming) return false;
                if (statusFilter === "non_conforming" && row.is_conforming) return false;
                if (statusFilter === "retest" && !row.is_retest) return false;
            }

            // Batch filter
            if (batchFilter !== "all" && batch?.code !== batchFilter) {
                return false;
            }

            // Date range filter
            if (dateFrom && row.analyzed_at) {
                const rowDate = new Date(row.analyzed_at);
                const fromDate = new Date(dateFrom);
                if (rowDate < fromDate) return false;
            }
            if (dateTo && row.analyzed_at) {
                const rowDate = new Date(row.analyzed_at);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (rowDate > toDate) return false;
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

    const columns = [
        {
            key: "analyzed_at",
            label: "Date",
            render: (row: AnyResult) => row.analyzed_at ? format(new Date(row.analyzed_at), "dd/MM/yyyy HH:mm:ss") : "-"
        },
        {
            key: "sample.code",
            label: "Sample",
            render: (row: AnyResult) => {
                const sample = unwrap(row.sample);
                return sample?.code || "-";
            }
        },
        {
            key: "batch",
            label: "Batch",
            render: (row: AnyResult) => {
                const sample = unwrap(row.sample);
                const batch = unwrap(sample?.batch);
                return batch?.code || "-";
            }
        },
        {
            key: "product",
            label: "Product",
            render: (row: AnyResult) => {
                const sample = unwrap(row.sample);
                const batch = unwrap(sample?.batch);
                const product = unwrap(batch?.product);
                return product?.name || "-";
            }
        },
        {
            key: "parameter.name",
            label: "Parameter",
            render: (row: AnyResult) => {
                const param = unwrap(row.parameter);
                return `${param?.name || "-"} (${param?.unit || ""})`;
            }
        },
        {
            key: "value_numeric",
            label: "Value",
            render: (row: AnyResult) => row.value_numeric ?? row.value_text ?? "-"
        },
        {
            key: "is_conforming",
            label: "Status",
            render: (row: AnyResult) => (
                <div className="flex items-center gap-2">
                    <Badge variant={row.is_conforming ? "default" : "destructive"}>
                        {row.is_conforming ? "OK" : "NC"}
                    </Badge>
                    {row.is_retest && (
                        <Badge variant="secondary" className="text-xs">Retest</Badge>
                    )}
                    {row.is_valid === false && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Superseded</Badge>
                    )}
                </div>
            )
        },
        {
            key: "signature",
            label: "Sign",
            render: (row: AnyResult) => {
                if (!row.signed_transaction_hash) return null;
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <Fingerprint className="h-4 w-4 text-emerald-500" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-950 border-slate-800">
                                <p className="text-[10px] font-bold text-emerald-400">Assinatura Digital (21 CFR Part 11)</p>
                                <p className="text-[9px] text-slate-500 font-mono mt-1 break-all max-w-[200px]">
                                    Hash: {row.signed_transaction_hash.substring(0, 16)}...
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            }
        },
        {
            key: "actions",
            label: "Actions",
            render: (row: AnyResult) => {
                const sample = unwrap(row.sample);
                const param = unwrap(row.parameter);

                const canRetest = row.is_valid !== false &&
                    row.is_conforming === false &&
                    sample?.status !== "approved";

                if (!canRetest) return null;

                return (
                    <RetestDialog
                        resultId={row.id}
                        parameterName={param?.name || "Unknown"}
                        sampleCode={sample?.code || "Unknown"}
                        currentValue={row.value_numeric ?? row.value_text ?? "-"}
                        isConforming={row.is_conforming ?? true}
                    />
                );
            }
        },
    ];

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-5 p-4 bg-muted/30 rounded-lg">
                <div>
                    <Label className="text-xs text-muted-foreground">Search</Label>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Sample, batch, product..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <SearchableSelect
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                        placeholder="All Status"
                        options={[
                            { value: "all", label: "All" },
                            { value: "conforming", label: "Conforming (OK)" },
                            { value: "non_conforming", label: "Non-conforming (NC)" },
                            { value: "retest", label: "Retests Only" },
                        ]}
                    />
                </div>

                <div>
                    <Label className="text-xs text-muted-foreground">Batch</Label>
                    <SearchableSelect
                        value={batchFilter}
                        onValueChange={setBatchFilter}
                        placeholder="All Batches"
                        options={[
                            { value: "all", label: "All Batches" },
                            ...uniqueBatches.map(batch => ({ value: batch, label: batch }))
                        ]}
                    />
                </div>

                <div>
                    <Label className="text-xs text-muted-foreground">Date From</Label>
                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                </div>

                <div>
                    <Label className="text-xs text-muted-foreground">Date To</Label>
                    <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Status */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                    Showing {filteredResults.length} of {results.length} results
                </span>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Clear Filters
                    </Button>
                )}
            </div>

            <DataGrid data={filteredResults} columns={columns} />
        </div>
    );
}
