"use client";

import { useState, useMemo } from "react";
import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Search, XCircle } from "lucide-react";
import { ResultFormDialog } from "./result-form-dialog";

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

const isReady = (row: MicroResult): boolean => {
    const session = unwrap(row.session);
    const mediaLot = unwrap(row.media_lot);
    const mediaType = unwrap(mediaLot?.media_type);
    const start = new Date(session?.started_at || 0);
    const hours = mediaType?.incubation_hours_min || 0;
    const readyTime = new Date(start.getTime() + hours * 60 * 60 * 1000);
    return new Date() >= readyTime;
};

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

            // Status filter (ready/incubating)
            if (statusFilter !== "all") {
                const ready = isReady(row);
                if (statusFilter === "ready" && !ready) return false;
                if (statusFilter === "incubating" && ready) return false;
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

    const columns = [
        {
            key: "sample.code",
            label: "Sample",
            render: (row: MicroResult) => {
                const sample = unwrap(row.sample);
                return sample?.code || "Unknown";
            }
        },
        {
            key: "parameter.name",
            label: "Parameter",
            render: (row: MicroResult) => {
                const parameter = unwrap(row.parameter);
                return parameter?.name || "Unknown";
            }
        },
        {
            key: "session.incubator.name",
            label: "Location",
            render: (row: MicroResult) => {
                const session = unwrap(row.session);
                const incubator = unwrap(session?.incubator);
                return incubator?.name || "-";
            }
        },
        {
            key: "media_lot.media_type.name",
            label: "Media",
            render: (row: MicroResult) => {
                const mediaLot = unwrap(row.media_lot);
                const mediaType = unwrap(mediaLot?.media_type);
                return mediaType?.name || "-";
            }
        },
        {
            key: "readiness",
            label: "Status",
            render: (row: MicroResult) => {
                return isReady(row)
                    ? <Badge className="bg-green-500">Ready</Badge>
                    : <Badge variant="outline">Incubating</Badge>;
            }
        },
        {
            key: "actions",
            label: "Action",
            render: (row: MicroResult) => {
                const sample = unwrap(row.sample);
                const parameter = unwrap(row.parameter);
                return (
                    <ResultFormDialog
                        resultId={row.id}
                        sampleCode={sample?.code}
                        parameterName={parameter?.name}
                        maxColonyCount={row.max_colony_count}
                    />
                );
            }
        }
    ];

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-4 p-4 bg-muted/30 rounded-lg">
                <div>
                    <Label className="text-xs text-muted-foreground">Search</Label>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Sample, parameter..."
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
                            { value: "ready", label: "Ready to Read" },
                            { value: "incubating", label: "Still Incubating" },
                        ]}
                    />
                </div>

                <div>
                    <Label className="text-xs text-muted-foreground">Incubator</Label>
                    <SearchableSelect
                        value={incubatorFilter}
                        onValueChange={setIncubatorFilter}
                        placeholder="All Incubators"
                        options={[
                            { value: "all", label: "All Incubators" },
                            ...uniqueIncubators.map(inc => ({ value: inc, label: inc }))
                        ]}
                    />
                </div>

                <div>
                    <Label className="text-xs text-muted-foreground">Media Type</Label>
                    <SearchableSelect
                        value={mediaFilter}
                        onValueChange={setMediaFilter}
                        placeholder="All Media"
                        options={[
                            { value: "all", label: "All Media" },
                            ...uniqueMedia.map(m => ({ value: m, label: m }))
                        ]}
                    />
                </div>
            </div>

            {/* Filter Status */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                    Showing {filteredResults.length} of {results.length} plates
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
