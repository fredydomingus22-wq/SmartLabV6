"use client";

import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Search, XCircle, Clock, AlertTriangle, CheckCircle, ThermometerSun, AlertCircle, Calendar } from "lucide-react";
import { ResultFormDialog } from "./result-form-dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface MicroResult {
    id: string;
    status: string;
    created_at: string;
    max_colony_count?: number | null;
    sample?: { code: string }[] | { code: string };
    parameter?: { id?: string; name: string }[] | { id?: string; name: string };
    session?: {
        started_at: string;
        incubator?: { name: string }[] | { name: string }
    }[] | {
        started_at: string;
        incubator?: { name: string }[] | { name: string }
    };
    media_lot?: {
        lot_code: string;
        media_type?: { incubation_hours_min: number; name?: string }[] | { incubation_hours_min: number; name?: string }
    }[] | {
        lot_code: string;
        media_type?: { incubation_hours_min: number; name?: string }[] | { incubation_hours_min: number; name?: string }
    };
}

interface ReadingPageClientProps {
    results: MicroResult[];
}

// Helper to safely unwrap nested Supabase relations
const unwrap = <T,>(val: T[] | T | undefined): T | undefined => {
    return Array.isArray(val) ? val[0] : val;
};

// --- Countdown Component ---
function Countdown({ targetDate }: { targetDate: Date }) {
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isOverdue, setIsOverdue] = useState(false);

    useEffect(() => {
        const update = () => {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();

            if (diff <= 0) {
                const overdueDiff = Math.abs(diff);
                const hours = Math.floor(overdueDiff / (1000 * 60 * 60));
                const minutes = Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`+ ${hours}h ${minutes}m`);
                setIsOverdue(true);
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${minutes}m`);
                setIsOverdue(false);
            }
        };

        update();
        const interval = setInterval(update, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <span className={cn("font-mono font-bold tracking-tight", isOverdue ? "text-destructive" : "text-amber-500")}>
            {timeLeft}
        </span>
    );
}

export function ReadingPageClient({ results }: ReadingPageClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [incubatorFilter, setIncubatorFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [mediaFilter, setMediaFilter] = useState<string>("all");

    // Extract unique incubators
    const uniqueIncubators = useMemo(() => {
        const incubators = new Set<string>();
        results.forEach(r => {
            const session = unwrap(r.session);
            const incubator = unwrap(session?.incubator);
            if (incubator?.name) incubators.add(incubator.name);
        });
        return Array.from(incubators).sort();
    }, [results]);

    // Extract unique media types
    const uniqueMedia = useMemo(() => {
        const media = new Set<string>();
        results.forEach(r => {
            const mediaLot = unwrap(r.media_lot);
            const mediaType = unwrap(mediaLot?.media_type);
            if (mediaType?.name) media.add(mediaType.name);
        });
        return Array.from(media).sort();
    }, [results]);

    const getRowStatus = (row: MicroResult) => {
        const session = unwrap(row.session);
        const mediaLot = unwrap(row.media_lot);
        const mediaType = unwrap(mediaLot?.media_type);
        const start = new Date(session?.started_at || 0);
        const hours = mediaType?.incubation_hours_min || 0;
        const readyTime = new Date(start.getTime() + hours * 60 * 60 * 1000);
        const now = new Date();

        if (now >= readyTime) {
            // Check if overdue by more than 2 hours
            const diffHours = (now.getTime() - readyTime.getTime()) / (1000 * 60 * 60);
            return diffHours > 2 ? 'overdue' : 'ready';
        }
        return 'incubating';
    };

    // Filter results
    const filteredResults = useMemo(() => {
        return results.filter(row => {
            const sample = unwrap(row.sample);
            const parameter = unwrap(row.parameter);
            const session = unwrap(row.session);
            const incubator = unwrap(session?.incubator);
            const mediaLot = unwrap(row.media_lot);
            const mediaType = unwrap(mediaLot?.media_type);

            // Search filter
            if (searchQuery) {
                const search = searchQuery.toLowerCase();
                const matches =
                    sample?.code?.toLowerCase().includes(search) ||
                    parameter?.name?.toLowerCase().includes(search) ||
                    incubator?.name?.toLowerCase().includes(search);
                if (!matches) return false;
            }

            // Incubator filter
            if (incubatorFilter !== "all" && incubator?.name !== incubatorFilter) {
                return false;
            }

            // Media filter
            if (mediaFilter !== "all" && mediaType?.name !== mediaFilter) {
                return false;
            }

            // Status filter
            const status = getRowStatus(row);
            if (statusFilter !== "all" && status !== statusFilter) {
                return false;
            }

            return true;
        });
    }, [results, searchQuery, incubatorFilter, statusFilter, mediaFilter]);

    const clearFilters = () => {
        setSearchQuery("");
        setIncubatorFilter("all");
        setStatusFilter("all");
        setMediaFilter("all");
    };

    const hasActiveFilters = searchQuery || incubatorFilter !== "all" || statusFilter !== "all" || mediaFilter !== "all";

    // Summary Stats
    const summary = useMemo(() => {
        let overdue = 0;
        let ready = 0;
        let incubating = 0;
        results.forEach(r => {
            const s = getRowStatus(r);
            if (s === 'overdue') overdue++;
            else if (s === 'ready') ready++;
            else incubating++;
        });
        return { overdue, ready, incubating };
    }, [results]);

    return (
        <div className="space-y-6">
            {/* Action Header */}
            {(summary.ready > 0 || summary.overdue > 0) && (
                <div className="grid gap-4 md:grid-cols-2 animate-in slide-in-from-top-4 duration-500">
                    {summary.ready > 0 && (
                        <Card className="border-emerald-500/20 bg-emerald-500/5">
                            <div className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-600">
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-emerald-600">Ação Necessária</h3>
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-bold text-foreground">{summary.ready}</span> amostras prontas para leitura.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="ml-auto border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                                    onClick={() => setStatusFilter('ready')}
                                >
                                    Filtrar
                                </Button>
                            </div>
                        </Card>
                    )}
                    {summary.overdue > 0 && (
                        <Card className="border-red-500/20 bg-red-500/5">
                            <div className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-red-500/20 rounded-xl text-red-600 animate-pulse">
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-red-600">Atraso Crítico</h3>
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-bold text-foreground">{summary.overdue}</span> amostras excederam o tempo.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="ml-auto border-red-500/30 text-red-600 hover:bg-red-500/10"
                                    onClick={() => setStatusFilter('overdue')}
                                >
                                    Ver Agora
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Filters Bar */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Pesquisa</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Amostra, parâmetro..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Estado</Label>
                            <SearchableSelect
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                                placeholder="Todos"
                                options={[
                                    { value: "all", label: "Todos os Estados" },
                                    { value: "ready", label: "Prontas para Leitura" },
                                    { value: "overdue", label: "Atrasadas (Crítico)" },
                                    { value: "incubating", label: "Em Incubação" },
                                ]}
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Incubadora</Label>
                            <SearchableSelect
                                value={incubatorFilter}
                                onValueChange={setIncubatorFilter}
                                placeholder="Todas"
                                options={[
                                    { value: "all", label: "Todas as Incubadoras" },
                                    ...uniqueIncubators.map(inc => ({ value: inc, label: inc }))
                                ]}
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Meio de Cultura</Label>
                            <SearchableSelect
                                value={mediaFilter}
                                onValueChange={setMediaFilter}
                                placeholder="Todos"
                                options={[
                                    { value: "all", label: "Todos os Meios" },
                                    ...uniqueMedia.map(m => ({ value: m, label: m }))
                                ]}
                            />
                        </div>
                    </div>

                    {/* Active Filter status */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-xs font-medium text-muted-foreground">
                            A apresentar <span className="text-foreground font-bold">{filteredResults.length}</span> de {results.length} placas
                        </span>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs hover:bg-muted">
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Limpar Filtros
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* List View */}
            <div className="grid gap-3">
                <AnimatePresence>
                    {filteredResults.map((row) => {
                        const sample = unwrap(row.sample);
                        const parameter = unwrap(row.parameter);
                        const session = unwrap(row.session);
                        const incubator = unwrap(session?.incubator);
                        const mediaLot = unwrap(row.media_lot);
                        const mediaType = unwrap(mediaLot?.media_type);

                        const status = getRowStatus(row);
                        const start = new Date(session?.started_at || 0);
                        const hours = mediaType?.incubation_hours_min || 0;
                        const readyTime = new Date(start.getTime() + hours * 60 * 60 * 1000);

                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={row.id}
                            >
                                <Card className={cn(
                                    "hover:shadow-md transition-all group relative overflow-hidden",
                                    status === 'ready' && "border-l-4 border-l-emerald-500",
                                    status === 'overdue' && "border-l-4 border-l-red-500",
                                    status === 'incubating' && "border-l-4 border-l-amber-500"
                                )}>
                                    <div className="p-4 flex flex-col md:flex-row md:items-center gap-6">

                                        {/* Sample Info */}
                                        <div className="flex-1 min-w-0 pl-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-bold tracking-tight">{sample?.code || "N/A"}</span>
                                                <Badge variant="secondary" className="font-mono">
                                                    {parameter?.name || "Desconhecido"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-medium">
                                                <span className="flex items-center gap-1.5">
                                                    <ThermometerSun className="h-3.5 w-3.5" />
                                                    {incubator?.name || "N/D"}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-border block" />
                                                <span>{mediaType?.name || "N/D"}</span>
                                                <span className="w-1 h-1 rounded-full bg-border block" />
                                                <span className="font-mono">Lote: {mediaLot?.lot_code}</span>
                                            </div>
                                        </div>

                                        {/* Timer / Status */}
                                        <div className="flex flex-col items-end shrink-0 min-w-[140px]">
                                            <div className="flex items-center gap-2 mb-1">
                                                {status === 'incubating' ? (
                                                    <>
                                                        <Clock className="h-4 w-4 text-amber-500" />
                                                        <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">A Incubar</span>
                                                    </>
                                                ) : status === 'ready' ? (
                                                    <>
                                                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                                                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Pronto</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                                        <span className="text-xs font-bold text-destructive uppercase tracking-wider">Atrasado</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="text-sm">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">
                                                        {status === 'incubating' ? 'Faltam' : 'Desde'}
                                                    </span>
                                                    <Countdown targetDate={readyTime} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div>
                                            <ResultFormDialog
                                                resultId={row.id}
                                                sampleCode={sample?.code}
                                                parameterName={parameter?.name}
                                                maxColonyCount={row.max_colony_count}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {filteredResults.length === 0 && (
                    <div className="p-12 text-center border-2 border-dashed rounded-3xl">
                        <ThermometerSun className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-bold text-muted-foreground">Nenhuma amostra encontrada</h3>
                        <p className="text-sm text-muted-foreground mt-1">Ajuste os filtros ou inicie novas incubações.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

