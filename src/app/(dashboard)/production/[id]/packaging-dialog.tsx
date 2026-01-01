"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Plus, Loader2 } from "lucide-react";
import { linkPackagingLotAction } from "@/app/actions/production";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PackagingLot {
    id: string;
    lot_code: string;
    remaining_quantity: number;
    material: { name: string; code: string };
}

interface PackagingDialogProps {
    batchId: string;
    availableLots: PackagingLot[];
}

export function PackagingDialog({ batchId, availableLots }: PackagingDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedLot, setSelectedLot] = useState<string>("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedLot) {
            toast.error("Por favor, selecione um lote de embalagem");
            return;
        }
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("production_batch_id", batchId);
        formData.set("packaging_lot_id", selectedLot);

        const result = await linkPackagingLotAction(formData);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            setSelectedLot("");
            router.refresh();
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    const selectedLotData = availableLots.find(l => l.id === selectedLot);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="glass hover:bg-primary/5 transition-all">
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar Embalagem
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass">
                <DialogHeader>
                    <DialogTitle>Registar Uso de Embalagem</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Lote de Material de Embalagem</Label>
                        <SearchableSelect
                            options={availableLots.map(lot => ({
                                value: lot.id,
                                label: `${lot.lot_code} - ${lot.material?.name || "Desconhecido"} (${lot.remaining_quantity} un)`
                            }))}
                            placeholder="Selecione um lote..."
                            value={selectedLot}
                            onValueChange={setSelectedLot}
                            disabled={loading || availableLots.length === 0}
                            emptyMessage={availableLots.length === 0 ? "Nenhum lote disponível" : "Lote não encontrado"}
                        />
                        {selectedLotData && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Disponível: {selectedLotData.remaining_quantity} unidades
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity_used">Quantidade Utilizada</Label>
                            <Input
                                id="quantity_used"
                                name="quantity_used"
                                type="number"
                                placeholder="0"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unidade</Label>
                            <Input
                                id="unit"
                                name="unit"
                                defaultValue="un"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading || !selectedLot}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Vincular Embalagem
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
