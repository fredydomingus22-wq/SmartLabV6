
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Plus, Loader2 } from "lucide-react";
import { addBOMItemAction } from "@/app/actions/engineering";
import { toast } from "sonner";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

interface Item {
    id: string;
    name: string;
    code?: string;
    sku?: string;
    unit?: string;
}

interface BOMDialogProps {
    productId: string;
    allProducts: Item[];
    allRawMaterials: Item[];
}

export function BOMDialog({ productId, allProducts, allRawMaterials }: BOMDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<"product" | "raw_material">("raw_material");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("parent_product_id", productId);

        const result = await addBOMItemAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
        } else {
            toast.error(result.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2 border-amber-500/20 text-amber-600 hover:bg-amber-500/5">
                    <Plus className="h-4 w-4" /> Gerir BOM
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Componente à BOM</DialogTitle>
                    <DialogDescription>
                        Selecione um produto intermédio ou matéria-prima para compor a ficha técnica.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="raw_material" onValueChange={(v) => setType(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="raw_material">Matéria-Prima</TabsTrigger>
                        <TabsTrigger value="product">Intermédio / Produto</TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <TabsContent value="raw_material" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="component_raw_material_id">Matéria-Prima *</Label>
                                <SearchableSelect
                                    name="component_raw_material_id"
                                    required={type === "raw_material"}
                                    placeholder="Procurar MP..."
                                    options={allRawMaterials.map(item => ({
                                        value: item.id,
                                        label: `${item.name} (${item.code})`
                                    }))}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="product" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="component_product_id">Produto / Intermédio *</Label>
                                <SearchableSelect
                                    name="component_product_id"
                                    required={type === "product"}
                                    placeholder="Procurar Produto..."
                                    options={allProducts.filter(p => p.id !== productId).map(item => ({
                                        value: item.id,
                                        label: `${item.name} (${item.sku})`
                                    }))}
                                />
                            </div>
                        </TabsContent>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Quantidade Standard *</Label>
                                <Input
                                    id="quantity"
                                    name="quantity"
                                    type="number"
                                    step="any"
                                    placeholder="Ex: 0.5"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unidade</Label>
                                <Input
                                    id="unit"
                                    name="unit"
                                    placeholder="Ex: kg, L, un"
                                    required
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Adicionar Componente
                            </Button>
                        </DialogFooter>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
