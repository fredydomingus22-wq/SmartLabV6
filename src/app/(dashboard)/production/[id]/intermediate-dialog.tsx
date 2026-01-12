"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { createIntermediateProductAction } from "@/app/actions/production";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Beaker } from "lucide-react";

import { SearchableSelect } from "@/components/smart/searchable-select";

interface IntermediateDialogProps {
    batchId: string;
    availableTanks: { id: string; name: string; code: string }[];
    availableProducts?: { id: string; name: string; sku: string }[];
}

export function IntermediateDialog({ batchId, availableTanks, availableProducts }: IntermediateDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedTank, setSelectedTank] = useState<string>("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedTank) {
            toast.error("Por favor selecione um tanque.");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            formData.set("production_batch_id", batchId);

            // Find selected tank to send name/code as 'code'
            const tank = availableTanks.find(t => t.id === selectedTank);
            if (tank) {
                formData.set("code", tank.name); // Using Name as the friendly code/identifier
                formData.set("tank_id", tank.id);
            }

            const result = await createIntermediateProductAction(formData);

            if (result.success) {
                toast.success(result.message);
                setOpen(false);
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (err: any) {
            console.error("[IntermediateDialog] Submission error:", err);
            toast.error("Erro inesperado ao processar o registo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Beaker className="mr-2 h-4 w-4" />
                    Registar Tanque
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass">
                <DialogHeader>
                    <DialogTitle>Novo Produto Intermédio</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="space-y-2">
                        <Label htmlFor="tank_id">Tanque / Equipamento</Label>
                        <SearchableSelect
                            name="tank_id" // Form action reads this
                            options={availableTanks.map(t => ({
                                label: `${t.name} (${t.code})`,
                                value: t.id
                            }))}
                            placeholder="Selecione um tanque..."
                            required
                            onValueChange={(val) => {
                                setSelectedTank(val); // Keep local state for other logic if needed
                            }}
                        />
                        {/* We need to pass the tank NAME as 'code' as per original logic. */}
                        {/* The original code set formData.set("code", tank.name) in handleSubmit based on selectedTank state. */}
                        {/* So we MUST maintain selectedTank state update. */}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="product_id">Produto / Receita (Opcional)</Label>
                        <SearchableSelect
                            name="product_id"
                            options={availableProducts?.map(p => ({
                                label: `${p.name} (${p.sku})`,
                                value: p.id
                            })) || []}
                            placeholder="Mesma do Lote (Padrão)"
                        />
                        <p className="text-[9px] text-muted-foreground uppercase opacity-50">Deixe vazio para herdar a receita do lote principal.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="volume">Volume</Label>
                            <Input
                                id="volume"
                                name="volume"
                                type="number"
                                step="0.01"
                                placeholder="e.g., 1000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Input
                                id="unit"
                                name="unit"
                                placeholder="L"
                                defaultValue="L"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Criar Tanque
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
