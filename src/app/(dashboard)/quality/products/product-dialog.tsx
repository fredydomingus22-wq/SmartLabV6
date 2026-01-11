"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Loader2, Info } from "lucide-react";
import { createProductAction, updateProductAction, deleteProductAction, getProductsAction } from "@/app/actions/products";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Product {
    id: string;
    name: string;
    sku: string;
    description?: string;
    category?: string;
    unit?: string;
    status: string;
    shelf_life_days?: number;
    storage_conditions?: string;
    parent_id?: string | null;
    bev_category?: string | null;
}

interface ProductDialogProps {
    mode: "create" | "edit";
    product?: Product;
}

export function ProductDialog({ mode, product }: ProductDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [intermediates, setIntermediates] = useState<Product[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        description: "",
        category: "final",
        unit: "unit",
        status: "active",
        shelf_life_days: "",
        storage_conditions: "",
        parent_id: "",
        bev_category: "",
    });

    useEffect(() => {
        if (open && product) {
            setFormData({
                name: product.name || "",
                sku: product.sku || "",
                description: product.description || "",
                category: product.category || "final",
                unit: product.unit || "unit",
                status: product.status || "active",
                shelf_life_days: product.shelf_life_days ? String(product.shelf_life_days) : "",
                storage_conditions: product.storage_conditions || "",
                parent_id: product.parent_id || "",
                bev_category: product.bev_category || "",
            });
        } else if (open && mode === "create") {
            setFormData({
                name: "",
                sku: "",
                description: "",
                category: "final",
                unit: "unit",
                status: "active",
                shelf_life_days: "",
                storage_conditions: "",
                parent_id: "",
                bev_category: "",
            });
        }

        if (open) {
            fetchIntermediates();
        }
    }, [open, product, mode]);

    async function fetchIntermediates() {
        const result = await getProductsAction();
        if (result.success && result.data) {
            setIntermediates(result.data.filter((p: any) => p.category === 'intermediate' && p.id !== product?.id));
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const fd = new FormData();
        fd.set("name", formData.name);
        fd.set("sku", formData.sku);
        fd.set("description", formData.description);
        fd.set("category", formData.category);
        fd.set("unit", formData.unit);
        fd.set("status", formData.status);
        fd.set("shelf_life_days", formData.shelf_life_days);
        fd.set("storage_conditions", formData.storage_conditions);
        fd.set("parent_id", formData.parent_id);
        fd.set("bev_category", formData.bev_category);

        if (product?.id) {
            fd.set("id", product.id);
        }

        const action = mode === "create" ? createProductAction : updateProductAction;
        const result = await action(fd);

        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.message);
        }
    }

    async function handleDelete() {
        if (!product?.id) return;
        if (!confirm("Desativar este produto?")) return;

        setLoading(true);
        const fd = new FormData();
        fd.set("id", product.id);

        const result = await deleteProductAction(fd);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.message);
        }
    }

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button suppressHydrationWarning>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Produto
                    </Button>
                ) : (
                    <Button variant="ghost" size="sm" suppressHydrationWarning>
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>
                        {mode === "create" ? "Criar Produto" : `Editar: ${product?.name}`}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Adicionar novo produto ao catálogo"
                            : "Atualizar dados do produto"
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <ScrollArea className="max-h-[70vh] px-6 py-2">
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => updateField("name", e.target.value)}
                                        placeholder="e.g., Sumo de Laranja 1L"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU *</Label>
                                    <Input
                                        id="sku"
                                        value={formData.sku}
                                        onChange={(e) => updateField("sku", e.target.value.toUpperCase())}
                                        placeholder="e.g., PROD-001"
                                        className="uppercase"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Categoria</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(v) => updateField("category", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecionar categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="final">Produto Final</SelectItem>
                                            <SelectItem value="intermediate">Intermédio</SelectItem>
                                            <SelectItem value="raw_material">Matéria-Prima</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.category === 'final' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                        <Label htmlFor="parent_id" className="flex items-center gap-2">
                                            Produto Intermédio de Origem *
                                            <Info className="h-3 w-3 text-slate-400" />
                                        </Label>
                                        <Select
                                            value={formData.parent_id || "none"}
                                            onValueChange={(v) => updateField("parent_id", v === "none" ? "" : v)}
                                        >
                                            <SelectTrigger className={cn(!formData.parent_id && "border-amber-500/50 bg-amber-500/5")}>
                                                <SelectValue placeholder="Selecionar intermédio..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum (Independente)</SelectItem>
                                                {intermediates.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name} ({p.sku})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="unit">Unidade</Label>
                                        <Input
                                            id="unit"
                                            value={formData.unit}
                                            onChange={(e) => updateField("unit", e.target.value)}
                                            placeholder="e.g., L, kg, unit"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bev_category">Categoria de Bebida</Label>
                                        <Select
                                            value={formData.bev_category || "none"}
                                            onValueChange={(v) => updateField("bev_category", v === "none" ? "" : v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecionar categoria..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhuma</SelectItem>
                                                <SelectItem value="Leites">Leites</SelectItem>
                                                <SelectItem value="Sumos">Sumos</SelectItem>
                                                <SelectItem value="Refrigerantes">Refrigerantes</SelectItem>
                                                <SelectItem value="Águas">Águas</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="shelf_life_days">Validade (dias)</Label>
                                    <Input
                                        id="shelf_life_days"
                                        type="number"
                                        min="1"
                                        value={formData.shelf_life_days}
                                        onChange={(e) => updateField("shelf_life_days", e.target.value)}
                                        placeholder="e.g., 30"
                                    />
                                </div>
                                {mode === "edit" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(v) => updateField("status", v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecionar status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Ativo</SelectItem>
                                                <SelectItem value="inactive">Inativo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="storage_conditions">Condições de Armazenamento</Label>
                                <Input
                                    id="storage_conditions"
                                    value={formData.storage_conditions}
                                    onChange={(e) => updateField("storage_conditions", e.target.value)}
                                    placeholder="e.g., 2-8°C, ambiente seco"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => updateField("description", e.target.value)}
                                    placeholder="Descrição opcional do produto..."
                                    rows={2}
                                />
                            </div>

                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 pt-2 bg-slate-50/50 dark:bg-slate-900/50 border-t">
                        <div className="flex w-full justify-between items-center gap-2">
                            {mode === "edit" && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={loading}
                                >
                                    Desativar
                                </Button>
                            )}
                            <div className="flex gap-2 ml-auto">
                                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    {mode === "create" ? "Criar" : "Guardar"}
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
