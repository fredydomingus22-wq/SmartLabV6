"use client";

import { useState, useMemo } from "react";
import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Search, XCircle, AlertTriangle } from "lucide-react";

interface MediaLot {
    id: string;
    lot_code: string;
    quantity_current: number;
    expiry_date: string;
    status: string;
    media_type?: { name: string }[] | { name: string };
}

interface MediaPageClientProps {
    lots: MediaLot[];
}

const getExpiryStatus = (expiryDate: string): "expired" | "expiring_soon" | "ok" => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return "expired";
    if (daysUntilExpiry <= 7) return "expiring_soon";
    return "ok";
};

export function MediaPageClient({ lots }: MediaPageClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [mediaTypeFilter, setMediaTypeFilter] = useState<string>("all");
    const [expiryFilter, setExpiryFilter] = useState<string>("all");

    // Extract unique media types
    const uniqueMediaTypes = useMemo(() => {
        const types = new Set<string>();
        lots.forEach(lot => {
            const mediaType = Array.isArray(lot.media_type) ? lot.media_type[0] : lot.media_type;
            if (mediaType?.name) types.add(mediaType.name);
        });
        return Array.from(types).sort();
    }, [lots]);

    // Filter results
    const filteredLots = useMemo(() => {
        return lots.filter(lot => {
            const mediaType = Array.isArray(lot.media_type) ? lot.media_type[0] : lot.media_type;

            // Search filter
            if (searchQuery) {
                const search = searchQuery.toLowerCase();
                const matches =
                    lot.lot_code?.toLowerCase().includes(search) ||
                    mediaType?.name?.toLowerCase().includes(search);
                if (!matches) return false;
            }

            // Media type filter
            if (mediaTypeFilter !== "all" && mediaType?.name !== mediaTypeFilter) {
                return false;
            }

            // Expiry filter
            if (expiryFilter !== "all") {
                const status = getExpiryStatus(lot.expiry_date);
                if (expiryFilter !== status) return false;
            }

            return true;
        });
    }, [lots, searchQuery, mediaTypeFilter, expiryFilter]);

    const clearFilters = () => {
        setSearchQuery("");
        setMediaTypeFilter("all");
        setExpiryFilter("all");
    };

    const hasActiveFilters = searchQuery || mediaTypeFilter !== "all" || expiryFilter !== "all";

    const columns = [
        {
            key: "media_type.name",
            label: "Media Type",
            render: (row: MediaLot) => {
                const mediaType = Array.isArray(row.media_type) ? row.media_type[0] : row.media_type;
                return mediaType?.name || "Unknown";
            }
        },
        { key: "lot_code", label: "Lot Code" },
        {
            key: "quantity_current",
            label: "Qty Available",
            render: (row: MediaLot) => (
                <span className={row.quantity_current === 0 ? "text-red-500 font-semibold" : ""}>
                    {row.quantity_current}
                </span>
            )
        },
        {
            key: "expiry_date",
            label: "Expiry",
            render: (row: MediaLot) => {
                const status = getExpiryStatus(row.expiry_date);
                return (
                    <div className="flex items-center gap-2">
                        <span>{new Date(row.expiry_date).toLocaleDateString()}</span>
                        {status === "expired" && (
                            <Badge variant="destructive" className="text-xs">Expired</Badge>
                        )}
                        {status === "expiring_soon" && (
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Soon
                            </Badge>
                        )}
                    </div>
                );
            }
        },
        {
            key: "status",
            label: "Status",
            render: (row: MediaLot) => (
                <Badge variant={row.status === "active" ? "default" : "secondary"}>
                    {row.status}
                </Badge>
            )
        },
    ];

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-3 p-4 bg-muted/30 rounded-lg">
                <div>
                    <Label className="text-xs text-muted-foreground">Search</Label>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Lot code, media type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                <div>
                    <Label className="text-xs text-muted-foreground">Media Type</Label>
                    <SearchableSelect
                        value={mediaTypeFilter}
                        onValueChange={setMediaTypeFilter}
                        placeholder="All Types"
                        options={[
                            { value: "all", label: "All Types" },
                            ...uniqueMediaTypes.map(type => ({ value: type, label: type }))
                        ]}
                    />
                </div>

                <div>
                    <Label className="text-xs text-muted-foreground">Expiry Status</Label>
                    <SearchableSelect
                        value={expiryFilter}
                        onValueChange={setExpiryFilter}
                        placeholder="All"
                        options={[
                            { value: "all", label: "All" },
                            { value: "ok", label: "Valid" },
                            { value: "expiring_soon", label: "Expiring Soon (≤7 days)" },
                            { value: "expired", label: "Expired" },
                        ]}
                    />
                </div>
            </div>

            {/* Filter Status */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                    Showing {filteredLots.length} of {lots.length} lots
                </span>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Clear Filters
                    </Button>
                )}
            </div>

            <DataGrid data={filteredLots} columns={columns} />
        </div>
    );
}
