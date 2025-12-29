import { getRawMaterialDetails } from "@/lib/queries/raw-materials";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Package,
    Layers,
    ArrowLeft,
    Calendar,
    AlertTriangle,
    FileText,
    ExternalLink,
    ArrowUpRight,
    TrendingDown,
    Activity
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ConsumeLotDialog } from "../_components/consume-lot-dialog";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    in_use: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    quarantine: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    expired: "bg-slate-500/10 text-slate-400 border-slate-800",
    exhausted: "bg-slate-500/5 text-slate-500 border-slate-800 opacity-50",
};

export default async function MaterialDetailPage({ params }: PageProps) {
    const { id } = await params;

    try {
        const { material, lots } = await getRawMaterialDetails(id);

        if (!material) notFound();

        const totalStock = lots.reduce((acc, lot) => acc + (lot.quantity_remaining || 0), 0);
        const approvedLots = lots.filter(l => l.status === 'approved').length;
        const quarantineLots = lots.filter(l => l.status === 'quarantine').length;

        return (
            <div className="container py-8 space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/materials/raw">
                            <Button variant="ghost" size="icon" className="text-slate-400 rounded-full hover:bg-slate-900 border border-slate-800/50">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-blue-500/5 text-blue-400 border-blue-500/20">
                                    Product Specification
                                </Badge>
                                <span className="text-[10px] font-mono text-slate-600">ID: {material.id.slice(0, 8)}</span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                                {material.name}
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                <Badge variant="secondary" className="bg-slate-900 text-slate-400 border-slate-800 font-mono text-[10px]">
                                    {material.code}
                                </Badge>
                                <span className="text-slate-500 text-sm font-medium uppercase tracking-tighter">{material.category || "Sem Categoria"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details & Stats */}
                    <div className="space-y-6">
                        <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden border-l-4 border-l-blue-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-blue-500" />
                                    Visão Geral do Stock
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stock Total Disponível</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-4xl font-black text-white">{totalStock.toLocaleString()}</h3>
                                        <span className="text-lg font-bold text-slate-600 uppercase">{material.unit}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lotes Ativos</p>
                                        <p className="text-xl font-black text-emerald-400">{approvedLots}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Em Quarentena</p>
                                        <p className="text-xl font-black text-amber-400">{quarantineLots}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-950/40 border-slate-800 shadow-xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-slate-500" />
                                    Especificações Técnicas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {material.allergens && material.allergens.length > 0 && (
                                    <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                                            <span className="text-[10px] font-black text-rose-500 uppercase">Alérgenos Presentes</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {material.allergens.map((a: string, i: number) => (
                                                <Badge key={i} className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[9px]">
                                                    {a}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs border-b border-slate-800/40 pb-2">
                                        <span className="text-slate-500">Unidade Base</span>
                                        <span className="text-slate-200 font-bold uppercase">{material.unit}</span>
                                    </div>
                                    <div className="flex justify-between text-xs border-b border-slate-800/40 pb-2">
                                        <span className="text-slate-500">Armazenamento</span>
                                        <span className="text-slate-200 font-medium italic">{material.storage_conditions || "Não especificado"}</span>
                                    </div>
                                    {material.description && (
                                        <div className="pt-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Notas Internas</span>
                                            <p className="text-xs text-slate-400 leading-relaxed italic line-clamp-4">{material.description}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Lot History */}
                    <div className="lg:col-span-2">
                        <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden min-h-[400px]">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50">
                                <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-blue-500" />
                                    Histórico de Lotes
                                </CardTitle>
                                <Badge variant="outline" className="bg-slate-900 border-slate-800 text-slate-500 text-[9px]">
                                    {lots.length} Registos
                                </Badge>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800/50 bg-slate-900/10">
                                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lote</th>
                                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Data Entrada</th>
                                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Validade</th>
                                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Stock Atual</th>
                                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/30">
                                        {lots.map((l: any) => (
                                            <tr key={l.id} className="hover:bg-slate-900/10 transition-colors">
                                                <td className="p-4">
                                                    <Link href={`/materials/raw/lots/${l.id}`} className="font-mono text-xs font-bold text-blue-400 hover:underline">
                                                        {l.lot_code}
                                                    </Link>
                                                </td>
                                                <td className="p-4 text-xs text-slate-400 text-center">
                                                    {l.received_date ? format(new Date(l.received_date), "dd/MM/yyyy") : "-"}
                                                </td>
                                                <td className="p-4 text-[10px] text-slate-500 text-center font-bold">
                                                    {l.expiry_date ? format(new Date(l.expiry_date), "dd/MM/yyyy") : "-"}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-black text-white">{l.quantity_remaining}</span>
                                                        <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">{material.unit}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <Badge className={`text-[9px] uppercase tracking-tighter ${statusColors[l.status]}`}>
                                                        {l.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {l.status === 'approved' && l.quantity_remaining > 0 && (
                                                            <ConsumeLotDialog
                                                                lotId={l.id}
                                                                lotCode={l.lot_code}
                                                                maxQuantity={l.quantity_remaining}
                                                                unit={material.unit}
                                                            />
                                                        )}
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600" asChild>
                                                            <Link href={`/materials/raw/lots/${l.id}`}>
                                                                <ArrowUpRight className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Error loading material details:", error);
        notFound();
    }
}
