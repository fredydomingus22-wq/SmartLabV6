"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlayCircle, Calendar, Package, Clock, Filter, AlertCircle, ArrowRight, CheckCircle2, Factory, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { planBatchFromOrderAction } from "@/app/actions/production";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Order {
    id: string;
    code: string;
    product: {
        name: string;
        sku: string;
    };
    planned_quantity: number;
    unit: string;
    status: string;
    start_date: string;
    end_date: string;
    completed_quantity?: number; // Assumed for progress
}

interface Shift {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
}

interface ProductionLine {
    id: string;
    code: string;
    name: string;
}

interface OrderPlanningConsoleProps {
    orders: Order[];
    shifts: Shift[];
    availableLines?: ProductionLine[];
}

export function OrderPlanningConsole({ orders, shifts, availableLines = [] }: OrderPlanningConsoleProps) {
    const [filter, setFilter] = useState<string>("all");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isPlanningOpen, setIsPlanningOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const filteredOrders = orders.filter(o =>
        filter === "all" ? true : o.status === filter
    );

    const handlePlanBatch = async (formData: FormData) => {
        setLoading(true);
        try {
            const res = await planBatchFromOrderAction(formData);
            if (res.success) {
                toast.success("Lote planeado e iniciado com sucesso (Em Planeamento).");
                setIsPlanningOpen(false);
                router.refresh();
            }
        } catch (error: any) {
            toast.error("Erro ao planear lote", { description: error.message || "Ocorreu um erro inesperado." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Button
                    variant={filter === "all" ? "default" : "outline"}
                    onClick={() => setFilter("all")}
                    size="sm"
                    className="rounded-full"
                >
                    Todos
                </Button>
                <Button
                    variant={filter === "planned" ? "default" : "outline"}
                    onClick={() => setFilter("planned")}
                    size="sm"
                    className="rounded-full border-blue-500/20 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                >
                    Planeados
                </Button>
                <Button
                    variant={filter === "in_progress" ? "default" : "outline"}
                    onClick={() => setFilter("in_progress")}
                    size="sm"
                    className="rounded-full border-amber-500/20 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                >
                    Em Execução
                </Button>
                <Button
                    variant={filter === "completed" ? "default" : "outline"}
                    onClick={() => setFilter("completed")}
                    size="sm"
                    className="rounded-full border-emerald-500/20 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                >
                    Concluídos
                </Button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredOrders.map(order => (
                    <div
                        key={order.id}
                        className={cn(
                            "group relative overflow-hidden rounded-xl border p-5 transition-all hover:bg-white/[0.02]",
                            order.status === 'in_progress' ? "border-amber-500/20 bg-amber-500/5" : "border-white/5 bg-slate-900/50"
                        )}
                    >
                        {/* Status Stripe */}
                        <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-1",
                            order.status === 'planned' && "bg-blue-500",
                            order.status === 'in_progress' && "bg-amber-500",
                            order.status === 'completed' && "bg-emerald-500",
                        )} />

                        <div className="flex justify-between items-start mb-4 pl-2">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                                    {order.code}
                                </div>
                                <div className="font-bold text-lg text-slate-200 leading-tight">
                                    {order.product.name}
                                </div>
                                <div className="text-xs font-mono text-slate-400 mt-1">
                                    {order.product.sku}
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-slate-950 border-slate-800">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => {
                                        setSelectedOrder(order);
                                        setIsPlanningOpen(true);
                                    }}>
                                        <PlayCircle className="mr-2 h-4 w-4 text-emerald-500" />
                                        Gerar Lote
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-slate-800" />
                                    <DropdownMenuItem className="text-red-500">
                                        Cancelar Ordem
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Progress / Details */}
                        <div className="space-y-3 pl-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 flex items-center gap-2">
                                    <Package className="h-3 w-3" /> Volume
                                </span>
                                <span className="font-mono text-slate-300">
                                    {order.planned_quantity} {order.unit}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 flex items-center gap-2">
                                    <Clock className="h-3 w-3" /> Data
                                </span>
                                <span className="text-slate-300">
                                    {format(new Date(order.start_date), "dd MMM", { locale: pt })}
                                </span>
                            </div>

                            {/* Status Badge */}
                            <div className="pt-2 flex items-center justify-between border-t border-white/5 mt-4">
                                <Badge variant="outline" className={cn(
                                    "uppercase text-[10px] tracking-widest font-black border-0 bg-transparent px-0",
                                    order.status === 'planned' && "text-blue-500",
                                    order.status === 'in_progress' && "text-amber-500",
                                    order.status === 'completed' && "text-emerald-500",
                                )}>
                                    {order.status === 'in_progress' && <>Em Execução</>}
                                    {order.status === 'planned' && <>Planeada</>}
                                    {order.status === 'completed' && <>Concluída</>}
                                </Badge>

                                {order.status === 'planned' && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 px-2"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setIsPlanningOpen(true);
                                        }}
                                    >
                                        Planear Lote <ArrowRight className="ml-1 h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                    <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                        <Filter className="h-6 w-6 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-300">Nenhuma ordem encontrada</h3>
                    <p className="text-slate-500 text-sm mt-1">Ajuste os filtros ou crie uma nova ordem.</p>
                </div>
            )}

            {/* Plan Batch Dialog */}
            <Dialog open={isPlanningOpen} onOpenChange={setIsPlanningOpen}>
                <DialogContent className="bg-slate-950 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Factory className="h-5 w-5 text-emerald-500" />
                            Planear Execução de Lote
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            A partir da Ordem <span className="font-mono text-white">{selectedOrder?.code}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <form action={handlePlanBatch} className="py-4">
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                            <input type="hidden" name="order_id" value={selectedOrder?.id} />

                            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Produto</span>
                                    <span className="font-medium text-white">{selectedOrder?.product.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Volume Planeado</span>
                                    <span className="font-medium text-white">{selectedOrder?.planned_quantity} {selectedOrder?.unit}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Código do Lote *</Label>
                                <Input
                                    name="batch_code"
                                    placeholder={`Ex: B-${selectedOrder?.code}-001`}
                                    className="bg-slate-900 border-slate-800 font-mono"
                                    required
                                />
                                <p className="text-xs text-slate-500">Código único para identificar o lote de produção.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Turno de Produção</Label>
                                <Select name="shift_id" required>
                                    <SelectTrigger className="bg-slate-900 border-slate-800">
                                        <SelectValue placeholder="Selecione o turno..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        {shifts.map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name} ({s.start_time} - {s.end_time})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Linha de Produção *</Label>
                                <Select name="production_line_id" required>
                                    <SelectTrigger className="bg-slate-900 border-slate-800">
                                        <SelectValue placeholder="Selecione a linha..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        {availableLines.length > 0 ? (
                                            availableLines.map(line => (
                                                <SelectItem key={line.id} value={line.id}>
                                                    {line.name} ({line.code})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-xs text-muted-foreground text-center">Nenhuma linha disponível</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Data/Hora Início</Label>
                                <Input
                                    type="datetime-local"
                                    name="planned_date"
                                    defaultValue={new Date().toISOString().slice(0, 16)}
                                    className="bg-slate-900 border-slate-800"
                                    required
                                />
                            </div>

                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsPlanningOpen(false)}>Cancelar</Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar e Gerar Lote
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
