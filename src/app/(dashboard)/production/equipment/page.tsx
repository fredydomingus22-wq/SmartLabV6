import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, Plus, Calendar, Wrench } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

export const dynamic = "force-dynamic";

interface ProcessEquipment {
    id: string;
    name: string;
    code: string;
    equipment_category: string;
    manufacturer: string | null;
    model: string | null;
    serial_number: string | null;
    status: string;
    next_maintenance_date: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
    filler: "Enchedora",
    pasteurizer: "Pasteurizador",
    homogenizer: "Homogeneizador",
    separator: "Separador",
    mixer: "Misturador",
    sterilizer: "Esterilizador",
    cooler: "Arrefecedor",
    heater: "Aquecedor",
    pump: "Bomba",
    valve: "Válvula",
    other: "Outro",
};

const CATEGORY_ICONS: Record<string, string> = {
    filler: "📦",
    pasteurizer: "🔥",
    homogenizer: "🔄",
    separator: "⚡",
    mixer: "🔀",
    sterilizer: "♨️",
    cooler: "❄️",
    heater: "🌡️",
    pump: "💧",
    valve: "🔧",
    other: "⚙️",
};

const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    decommissioned: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default async function ProcessEquipmentPage() {
    const supabase = await createClient();

    const { data: equipment } = await supabase
        .from("process_equipment")
        .select("*")
        .order("equipment_category")
        .order("name");

    // Get counts by category
    const countByCategory: Record<string, number> = {};
    equipment?.forEach(e => {
        countByCategory[e.equipment_category] = (countByCategory[e.equipment_category] || 0) + 1;
    });

    // Group by category
    const equipmentByCategory: Record<string, ProcessEquipment[]> = {};
    equipment?.forEach(e => {
        if (!equipmentByCategory[e.equipment_category]) {
            equipmentByCategory[e.equipment_category] = [];
        }
        equipmentByCategory[e.equipment_category].push(e);
    });

    const categories = Object.keys(equipmentByCategory);
    const today = new Date();

    return (
        <div className="container py-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                        <Settings2 className="h-8 w-8 text-amber-400" />
                        Equipamentos de Processo
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Gestão de enchedoras, pasteurizadores, homogeneizadores e outros equipamentos de produção.
                    </p>
                </div>
                <Button className="bg-amber-600 hover:bg-amber-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Equipamento
                </Button>
            </div>

            {/* Summary cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass border-slate-800">
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-slate-100">{equipment?.length || 0}</div>
                        <div className="text-xs text-slate-500 mt-1">Total</div>
                    </CardContent>
                </Card>
                <Card className="glass border-slate-800">
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-emerald-400">
                            {equipment?.filter(e => e.status === 'active').length || 0}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Ativos</div>
                    </CardContent>
                </Card>
                <Card className="glass border-slate-800">
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-amber-400">
                            {equipment?.filter(e => e.status === 'maintenance').length || 0}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Em Manutenção</div>
                    </CardContent>
                </Card>
                <Card className="glass border-slate-800">
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-rose-400">
                            {equipment?.filter(e => {
                                if (!e.next_maintenance_date) return false;
                                return differenceInDays(new Date(e.next_maintenance_date), today) < 0;
                            }).length || 0}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Manutenção Vencida</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs by category */}
            {categories.length > 0 && (
                <Tabs defaultValue={categories[0]} className="space-y-4">
                    <TabsList className="bg-slate-900/50 border border-slate-800">
                        {categories.map(cat => (
                            <TabsTrigger key={cat} value={cat} className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                                {CATEGORY_ICONS[cat] || "⚙️"} {CATEGORY_LABELS[cat] || cat} ({countByCategory[cat] || 0})
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {categories.map(cat => (
                        <TabsContent key={cat} value={cat} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {equipmentByCategory[cat]?.map((eq) => {
                                    const daysToMaintenance = eq.next_maintenance_date
                                        ? differenceInDays(new Date(eq.next_maintenance_date), today)
                                        : null;
                                    const isOverdue = daysToMaintenance !== null && daysToMaintenance < 0;

                                    return (
                                        <Card key={eq.id} className="glass hover:shadow-lg transition-shadow border-slate-800/50 hover:border-amber-500/30">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-lg">{eq.name}</CardTitle>
                                                    <Badge variant="outline" className="font-mono text-[10px]">
                                                        {eq.code}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="flex items-center gap-2">
                                                    <Badge className={statusColors[eq.status] || statusColors.active}>
                                                        {eq.status === 'active' ? 'Ativo' : eq.status}
                                                    </Badge>
                                                    {eq.manufacturer && (
                                                        <span className="text-xs text-slate-500">{eq.manufacturer}</span>
                                                    )}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {eq.next_maintenance_date && (
                                                    <div className={cn(
                                                        "p-2 rounded-lg border text-xs",
                                                        isOverdue
                                                            ? "bg-rose-500/10 border-rose-500/20"
                                                            : "bg-slate-800/50 border-slate-700/50"
                                                    )}>
                                                        <div className="flex items-center gap-2">
                                                            <Wrench className={cn("h-3 w-3", isOverdue ? "text-rose-400" : "text-slate-500")} />
                                                            <span className={isOverdue ? "text-rose-400" : "text-slate-400"}>
                                                                Próx. Manutenção:
                                                            </span>
                                                            <span className={cn("font-bold", isOverdue ? "text-rose-400" : "text-slate-200")}>
                                                                {new Date(eq.next_maintenance_date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <Link href={`/production/equipment/${eq.id}`}>
                                                        <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-7 text-xs">
                                                            Ver Detalhes
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            )}

            {(!equipment || equipment.length === 0) && (
                <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                    <Settings2 className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                    <p className="text-slate-500 italic">Nenhum equipamento de processo configurado.</p>
                </div>
            )}
        </div>
    );
}
