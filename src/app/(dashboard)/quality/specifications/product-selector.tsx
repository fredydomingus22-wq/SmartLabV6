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
import { Package } from "lucide-react";

interface Product {
    id: string;
    name: string;
    sku: string;
    status: string;
}

interface ProductSelectorProps {
    products: Product[];
    selectedProductId?: string;
}

export function ProductSelector({ products, selectedProductId }: ProductSelectorProps) {
    const router = useRouter();

    const handleChange = (productId: string) => {
        router.push(`/quality/specifications?product=${productId}`);
    };

    return (
        <div className="flex items-center gap-4">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 max-w-md">
                <Label className="text-xs text-muted-foreground">Select Product</Label>
                <Select
                    value={selectedProductId || ""}
                    onValueChange={handleChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Choose a product..." />
                    </SelectTrigger>
                    <SelectContent>
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
