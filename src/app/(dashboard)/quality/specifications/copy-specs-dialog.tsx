"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Copy, Loader2 } from "lucide-react";
import { copySpecsFromProductAction } from "@/app/actions/specifications";
import { toast } from "sonner";

interface Product {
    id: string;
    name: string;
    sku: string;
}

interface CopySpecsDialogProps {
    products: Product[];
    currentProductId: string;
}

export function CopySpecsDialog({ products, currentProductId }: CopySpecsDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sourceProductId, setSourceProductId] = useState<string>("");

    const availableProducts = products.filter(p => p.id !== currentProductId);

    async function handleCopy() {
        if (!sourceProductId) {
            toast.error("Please select a source product");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.set("source_product_id", sourceProductId);
        formData.set("target_product_id", currentProductId);

        const result = await copySpecsFromProductAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            setSourceProductId("");
        } else {
            toast.error(result.message);
        }
    }

    if (availableProducts.length === 0) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy from Product
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Copy Specifications</DialogTitle>
                    <DialogDescription>
                        Copy all specifications from another product.
                        Existing specifications will not be overwritten.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Copy from</Label>
                        <Select
                            value={sourceProductId}
                            onValueChange={setSourceProductId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select source product..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableProducts.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                        {product.name} ({product.sku})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCopy} disabled={loading || !sourceProductId}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Copy Specifications
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
