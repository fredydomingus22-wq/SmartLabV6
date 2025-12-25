"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Filter, X, Loader2 } from "lucide-react";

interface Product {
    id: string;
    name: string;
}

interface Specification {
    id: string;
    qa_parameter_id: string;
    min_value: number | null;
    max_value: number | null;
    parameter: {
        id: string;
        name: string;
        code: string;
        unit: string;
    };
}

interface Batch {
    id: string;
    code: string;
}

interface SPCFiltersProps {
    products: Product[];
    batches: Batch[];
    selectedProductId?: string;
    selectedSpecId?: string;
    selectedBatchId?: string;
    dateFrom?: string;
    dateTo?: string;
}

export function SPCFilters({
    products,
    batches,
    selectedProductId,
    selectedSpecId,
    selectedBatchId,
    dateFrom,
    dateTo
}: SPCFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [specifications, setSpecifications] = useState<Specification[]>([]);
    const [loadingSpecs, setLoadingSpecs] = useState(false);

    // Load specifications when product changes
    useEffect(() => {
        if (selectedProductId) {
            setLoadingSpecs(true);
            fetch(`/api/lab/specifications?productId=${selectedProductId}`)
                .then(res => res.json())
                .then(data => {
                    setSpecifications(data.specifications || []);
                    setLoadingSpecs(false);
                })
                .catch(() => {
                    setSpecifications([]);
                    setLoadingSpecs(false);
                });
        } else {
            setSpecifications([]);
        }
    }, [selectedProductId]);

    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "all") {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        // If changing product, clear spec selection
        if (key === "product") {
            params.delete("spec");
        }

        router.push(`/quality/spc?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push("/quality/spc");
    };

    const hasFilters = selectedProductId || selectedBatchId || dateFrom || dateTo;

    // Get selected specification info
    const selectedSpec = specifications.find(s => s.id === selectedSpecId);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                SPC Filters
                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-3 w-3 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {/* Product (Required first) */}
                <div className="space-y-1">
                    <Label className="text-xs">Product *</Label>
                    <Select
                        value={selectedProductId || ""}
                        onValueChange={(v) => updateFilter("product", v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select product..." />
                        </SelectTrigger>
                        <SelectContent>
                            {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Specification (Parameter) - depends on Product */}
                <div className="space-y-1">
                    <Label className="text-xs">Specification (Parameter) *</Label>
                    <Select
                        value={selectedSpecId || ""}
                        onValueChange={(v) => updateFilter("spec", v)}
                        disabled={!selectedProductId || loadingSpecs}
                    >
                        <SelectTrigger>
                            {loadingSpecs ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <SelectValue placeholder={selectedProductId ? "Select spec..." : "Select product first"} />
                            )}
                        </SelectTrigger>
                        <SelectContent>
                            {specifications.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.parameter.name} ({s.parameter.code})
                                    {s.min_value !== null && s.max_value !== null && (
                                        <span className="text-muted-foreground ml-1">
                                            [{s.min_value} - {s.max_value}]
                                        </span>
                                    )}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Batch */}
                <div className="space-y-1">
                    <Label className="text-xs">Batch (Optional)</Label>
                    <Select
                        value={selectedBatchId || "all"}
                        onValueChange={(v) => updateFilter("batch", v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All batches" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Batches</SelectItem>
                            {batches.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                    {b.code}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Date From */}
                <div className="space-y-1">
                    <Label className="text-xs">From Date</Label>
                    <Input
                        type="date"
                        value={dateFrom || ""}
                        onChange={(e) => updateFilter("from", e.target.value)}
                    />
                </div>

                {/* Date To */}
                <div className="space-y-1">
                    <Label className="text-xs">To Date</Label>
                    <Input
                        type="date"
                        value={dateTo || ""}
                        onChange={(e) => updateFilter("to", e.target.value)}
                    />
                </div>
            </div>

            {/* Selected Spec Details */}
            {selectedSpec && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <strong>Selected:</strong> {selectedSpec.parameter.name} ({selectedSpec.parameter.unit})
                    {selectedSpec.min_value !== null && selectedSpec.max_value !== null && (
                        <span className="ml-2">
                            | Spec Limits: {selectedSpec.min_value} - {selectedSpec.max_value}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
