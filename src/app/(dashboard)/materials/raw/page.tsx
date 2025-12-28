import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Layers, ArrowLeft, Plus, AlertTriangle, Calendar } from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

interface RawMaterial {
    id: string;
    name: string;
    code: string;
    category: string | null;
    supplier: { name: string } | null;
}

interface RawMaterialLot {
    id: string;
    lot_number: string;
    received_date: string;
    expiry_date: string | null;
    quantity: number | null;
    unit: string | null;
    status: string;
    raw_material: { name: string; code: string } | null;
}

const statusColors: Record<string, string> = {
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    in_use: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    quarantine: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    expired: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default async function RawMaterialsPage() {
    const supabase = await createClient();
    const today = new Date();

    // Fetch catalog
    const { data: materials } = await supabase
        .from("raw_materials")
        .select("id, name, code, category, supplier:suppliers(name)")
        .order("name");

    // Fetch lots
    const { data: lots } = await supabase
        .from("raw_material_lots")
        .select("id, lot_number, received_date, expiry_date, quantity, unit, status, raw_material:raw_materials(name, code)")
        .order("received_date", { ascending: false });

    // Stats
    const activeLots = lots?.filter(l => ["approved", "in_use"].includes(l.status)).length || 0;
    const expiringLots = lots?.filter(l => {
        if (!l.expiry_date) return false;
        const days = differenceInDays(new Date(l.expiry_date), today);
        return days <= 30 && days >= 0;
    }).length || 0;

    return (
        <div className="container py-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/materials">
                        <Button variant="ghost" size="icon" className="text-slate-400">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                            <Package className="h-8 w-8 text-blue-400" />
                            Matérias-Primas
                        </h1>
                        <p className="text-slate-400 mt-1">Catálogo e gestão de lotes de MP</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova MP
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="glass border-slate-800">
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-slate-100">{materials?.length || 0}</div>
                        <div className="text-xs text-slate-500 mt-1">No Catálogo</div>
                    </CardContent>
                </Card>
                <Card className="glass border-slate-800">
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-emerald-400">{activeLots}</div>
                        <div className="text-xs text-slate-500 mt-1">Lotes Ativos</div>
                    </CardContent>
                </Card>
                <Card className={`glass ${expiringLots > 0 ? 'border-amber-500/30' : 'border-slate-800'}`}>
                    <CardContent className="pt-6 text-center">
                        <div className={`text-2xl font-bold ${expiringLots > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {expiringLots}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">A Expirar (&lt;30d)</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="catalog" className="space-y-4">
                <TabsList className="bg-slate-900/50 border border-slate-800">
                    <TabsTrigger value="catalog" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                        <Package className="h-4 w-4 mr-2" />
                        Catálogo ({materials?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="lots" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                        <Layers className="h-4 w-4 mr-2" />
                        Lotes ({lots?.length || 0})
                    </TabsTrigger>
                </TabsList>

                {/* Catalog Tab */}
                <TabsContent value="catalog">
                    <Card className="glass border-slate-800/50">
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-800/50">
                                {materials?.map((m: any) => {
                                    const supplier = Array.isArray(m.supplier) ? m.supplier[0] : m.supplier;
                                    return (
                                        <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                                    <Package className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-100">{m.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        <span className="font-mono">{m.code}</span>
                                                        {supplier?.name && <span className="ml-2">• {supplier.name}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            {m.category && (
                                                <Badge variant="outline" className="text-[10px] border-slate-700">
                                                    {m.category}
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                                {(!materials || materials.length === 0) && (
                                    <div className="p-12 text-center text-slate-500 italic">
                                        Nenhuma matéria-prima no catálogo.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Lots Tab */}
                <TabsContent value="lots">
                    <Card className="glass border-slate-800/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Lotes de Matéria-Prima</CardTitle>
                                <CardDescription>Rastreabilidade e controlo de validade</CardDescription>
                            </div>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-3 w-3 mr-1" />
                                Novo Lote
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-800/50">
                                {lots?.map((l: any) => {
                                    const rawMaterial = Array.isArray(l.raw_material) ? l.raw_material[0] : l.raw_material;
                                    const isExpiring = l.expiry_date && differenceInDays(new Date(l.expiry_date), today) <= 30;
                                    const isExpired = l.expiry_date && differenceInDays(new Date(l.expiry_date), today) < 0;

                                    return (
                                        <div key={l.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${isExpired ? 'bg-rose-500/10 text-rose-400' : isExpiring ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                                                    {isExpired || isExpiring ? <AlertTriangle className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-100 font-mono">{l.lot_number}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {rawMaterial?.name || "MP Desconhecida"}
                                                        {l.quantity && <span className="ml-2">• {l.quantity} {l.unit || 'un'}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {l.expiry_date && (
                                                    <div className={`text-xs flex items-center gap-1 ${isExpired ? 'text-rose-400' : isExpiring ? 'text-amber-400' : 'text-slate-500'}`}>
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(l.expiry_date), "dd/MM/yyyy")}
                                                    </div>
                                                )}
                                                <Badge className={statusColors[l.status] || statusColors.approved}>
                                                    {l.status === 'approved' ? 'Aprovado' :
                                                        l.status === 'in_use' ? 'Em Uso' :
                                                            l.status === 'quarantine' ? 'Quarentena' :
                                                                l.status === 'rejected' ? 'Rejeitado' :
                                                                    l.status === 'expired' ? 'Expirado' : l.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!lots || lots.length === 0) && (
                                    <div className="p-12 text-center text-slate-500 italic">
                                        Nenhum lote registado.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
