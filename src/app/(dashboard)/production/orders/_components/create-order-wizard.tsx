"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
    CalendarIcon,
    CheckCircle2,
    ChevronRight,
    Factory,
    Package,
    Plus,
    Calculator,
    ArrowRight,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createProductionOrderAction } from "@/app/actions/production";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Product {
    id: string;
    name: string;
    sku: string;
}

interface CreateOrderWizardProps {
    products: Product[];
}

type Step = "product" | "volume" | "schedule";

export function CreateOrderWizard({ products }: CreateOrderWizardProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>("product");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Form State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState<string>("");
    const [unit, setUnit] = useState<string>("kg");
    const [plannedDate, setPlannedDate] = useState<Date | undefined>(new Date());

    // Derived State
    const canAdvanceProduct = !!selectedProduct;
    const canAdvanceVolume = !!quantity && Number(quantity) > 0;
    const canSubmit = canAdvanceProduct && canAdvanceVolume && !!plannedDate;

    const handleNext = () => {
        if (step === "product") setStep("volume");
        else if (step === "volume") setStep("schedule");
    };

    const handleBack = () => {
        if (step === "schedule") setStep("volume");
        else if (step === "volume") setStep("product");
    };

    const handleSubmit = () => {
        if (!canSubmit) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.append("product_id", selectedProduct!.id);
            formData.append("code", `OP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`); // Auto-gen code
            formData.append("planned_quantity", quantity);
            formData.append("unit", unit);
            formData.append("start_date", plannedDate!.toISOString());
            formData.append("end_date", plannedDate!.toISOString()); // Same day default

            const result = await createProductionOrderAction(formData);

            if (result.success) {
                toast.success("Ordem de Produção criada com sucesso.");
                setOpen(false);
                resetForm();
                router.refresh();
            } else {
                toast.error("Erro ao criar Ordem", { description: result.message });
            }
        });
    };

    const resetForm = () => {
        setStep("product");
        setSelectedProduct(null);
        setQuantity("");
        setPlannedDate(new Date());
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetForm();
            setOpen(val);
        }}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-900/20">
                    <Plus className="h-4 w-4" />
                    Nova Ordem
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-white p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900/50 p-6 border-b border-white/5">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Factory className="h-5 w-5 text-emerald-500" />
                        Planeamento de Produção
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 mt-1">
                        Assistente de criação de nova Ordem de Produção (OP).
                    </DialogDescription>

                    {/* Steps Indicator */}
                    <div className="flex items-center gap-2 mt-6 text-sm font-medium">
                        <div className={cn("flex items-center gap-2 transition-colors", step === "product" ? "text-emerald-400" : "text-slate-400")}>
                            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs border", step === "product" || selectedProduct ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" : "bg-slate-800 border-slate-700")}>1</div>
                            Produto
                        </div>
                        <div className="h-px w-8 bg-slate-800" />
                        <div className={cn("flex items-center gap-2 transition-colors", step === "volume" ? "text-emerald-400" : "text-slate-400")}>
                            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs border", step === "volume" || quantity ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" : "bg-slate-800 border-slate-700")}>2</div>
                            Volume
                        </div>
                        <div className="h-px w-8 bg-slate-800" />
                        <div className={cn("flex items-center gap-2 transition-colors", step === "schedule" ? "text-emerald-400" : "text-slate-400")}>
                            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs border", step === "schedule" ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" : "bg-slate-800 border-slate-700")}>3</div>
                            Agenda
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 min-h-[300px]">
                    {step === "product" && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                            <Label>Selecione o Produto</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2">
                                {products.map(prod => (
                                    <div
                                        key={prod.id}
                                        onClick={() => setSelectedProduct(prod)}
                                        className={cn(
                                            "cursor-pointer p-4 rounded-xl border transition-all hover:bg-white/5",
                                            selectedProduct?.id === prod.id
                                                ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50"
                                                : "bg-slate-900 border-slate-800"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-slate-200">{prod.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{prod.sku}</div>
                                                </div>
                                            </div>
                                            {selectedProduct?.id === prod.id && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === "volume" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-dashed border-slate-800 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
                                    <Package className="h-6 w-6 text-emerald-500" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-widest">Produto Selecionado</div>
                                    <div className="text-lg font-bold text-white">{selectedProduct?.name}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Quantidade Planeada</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="bg-slate-900 border-slate-800 h-12 text-lg pl-10"
                                            placeholder="0.00"
                                            autoFocus
                                        />
                                        <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Unidade</Label>
                                    <Select value={unit} onValueChange={setUnit}>
                                        <SelectTrigger className="bg-slate-900 border-slate-800 h-12">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                                            <SelectItem value="l">Litros (L)</SelectItem>
                                            <SelectItem value="un">Unidades (un)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "schedule" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Data de Início Prevista</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal bg-slate-900 border-slate-800 h-12",
                                                    !plannedDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {plannedDate ? format(plannedDate, "PPP", { locale: pt }) : <span>Selecione uma data</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={plannedDate}
                                                onSelect={setPlannedDate}
                                                initialFocus
                                                className="bg-slate-950 text-white"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-400 mb-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Resumo da Ordem
                                </h4>
                                <div className="space-y-1 text-sm text-slate-300">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Produto:</span>
                                        <span className="font-medium text-white">{selectedProduct?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Volume Alvo:</span>
                                        <span className="font-medium text-white">{quantity} {unit}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Data:</span>
                                        <span className="font-medium text-white">{plannedDate ? format(plannedDate, "dd/MM/yyyy") : "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="bg-slate-900/50 p-4 border-t border-white/5">
                    {step !== "product" && (
                        <Button variant="ghost" onClick={handleBack} disabled={isPending}>
                            Voltar
                        </Button>
                    )}

                    {step === "schedule" ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={!canSubmit || isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Confirmar Planeamento
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            disabled={step === "product" ? !canAdvanceProduct : !canAdvanceVolume}
                            className="w-full sm:w-auto"
                        >
                            Seguinte
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
