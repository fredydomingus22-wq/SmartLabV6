"use client";

import { useState, useMemo } from "react";
import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Search, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
            label: "Tipo de Meio",
            render: (row: MediaLot) => {
                const mediaType = Array.isArray(row.media_type) ? row.media_type[0] : row.media_type;
                return (
                    <span className="font-medium">{mediaType?.name || "Desconhecido"}</span>
                );
            }
        },
        {
            key: "lot_code",
            label: "Lote",
            render: (row: MediaLot) => (
                <span className="font-mono text-xs">{row.lot_code}</span>
            )
        },
        {
            key: "quantity_current",
            label: "Qtd. Atual",
            render: (row: MediaLot) => (
                <span className={row.quantity_current === 0 ? "text-destructive font-bold" : "font-mono"}>
                    {row.quantity_current}
                </span>
            )
        },
        {
            key: "expiry_date",
            label: "Validade",
            render: (row: MediaLot) => {
                const status = getExpiryStatus(row.expiry_date);
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{new Date(row.expiry_date).toLocaleDateString()}</span>
                        {status === "expired" && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Vencido</Badge>
                        )}
                        {status === "expiring_soon" && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Vence Logo
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
                    {row.status === "active" ? "Ativo" : row.status}
                </Badge>
            )
        },
    ];

    return (
        <Card>
            <CardContent className="p-0">
                <div className="space-y-4 p-4">
                    {/* Filters */}
                    <div className="grid gap-4 md:grid-cols-3 p-4 bg-muted/50 rounded-lg border border-border">
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Buscar</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Lote, tipo..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 bg-background"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Tipo de Meio</Label>
                            <SearchableSelect
                                value={mediaTypeFilter}
                                onValueChange={setMediaTypeFilter}
                                placeholder="Todos os Tipos"
                                options={[
                                    { value: "all", label: "Todos os Tipos" },
                                    ...uniqueMediaTypes.map(type => ({ value: type, label: type }))
                                ]}
                            />
                        </div>

                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Validade</Label>
                            <SearchableSelect
                                value={expiryFilter}
                                onValueChange={setExpiryFilter}
                                placeholder="Todas"
                                options={[
                                    { value: "all", label: "Todas" },
                                    { value: "ok", label: "Dentro da Validade" },
                                    { value: "expiring_soon", label: "Vence em Breve (≤7 dias)" },
                                    { value: "expired", label: "Vencido" },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Filter Status */}
                    <div className="flex items-center justify-between text-sm px-1">
                        <span className="text-muted-foreground">
                            A apresentar {filteredLots.length} de {lots.length} lotes
                        </span>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                                <XCircle className="h-4 w-4 mr-1.5" />
                                Limpar Filtros
                            </Button>
                        )}
                    </div>
                </div>

                <div className="border-t border-border">
                    <DataGrid data={filteredLots} columns={columns} />
                </div>
            </CardContent>
        </Card>
    );
}
