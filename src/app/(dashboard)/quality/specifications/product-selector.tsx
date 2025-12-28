"use client";

import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Package, Globe } from "lucide-react";

interface Product {
    id: string;
    name: string;
    sku: string;
    status: string;
}

const GLOBAL_SPECS_ID = "global";

interface ProductSelectorProps {
    products: Product[];
    selectedProductId?: string;
}

export function ProductSelector({ products, selectedProductId }: ProductSelectorProps) {
    const router = useRouter();

    const handleChange = (productId: string) => {
        router.push(`/quality/specifications?product=${productId}`);
    };

    const isGlobal = selectedProductId === GLOBAL_SPECS_ID;

    return (
        <div className="flex items-center gap-4">
            {isGlobal ? (
                <Globe className="h-5 w-5 text-emerald-500" />
            ) : (
                <Package className="h-5 w-5 text-muted-foreground" />
            )}
            <div className="flex-1 max-w-md">
                <Label className="text-xs text-muted-foreground">
                    {isGlobal ? "Global Specifications" : "Select Product"}
                </Label>
                <Select
                    value={selectedProductId || ""}
                    onValueChange={handleChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Choose a product..." />
                    </SelectTrigger>
                    <SelectContent>
                        {/* Global Option */}
                        <SelectItem value={GLOBAL_SPECS_ID} className="bg-emerald-500/10">
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-emerald-500" />
                                <span className="font-semibold">Global / Non-Product Specs</span>
                            </div>
                        </SelectItem>

                        {/* Separator */}
                        <div className="h-px bg-border my-2" />

                        {/* Products */}
                        {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                                <span className="font-medium">{product.name}</span>
                                <span className="text-muted-foreground ml-2">({product.sku})</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
