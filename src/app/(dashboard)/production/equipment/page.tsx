import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Settings2,
    Plus,
    Calendar,
    Wrench,
    Activity,
    Zap,
    BarChart3,
    ArrowUpRight,
    Search,
    Filter,
    ClipboardCheck,
    ClipboardCheck,
    AlertTriangle,
    Boxes
} from "lucide-react";
import { EquipmentDialog } from "./equipment-dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";
import { pt } from "date-fns/locale";
import { Input } from "@/components/ui/input";

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

    const today = new Date();

    // Group by category
    const countByCategory: Record<string, number> = {};
    const equipmentByCategory: Record<string, ProcessEquipment[]> = {};

    equipment?.forEach(e => {
        countByCategory[e.equipment_category] = (countByCategory[e.equipment_category] || 0) + 1;
        if (!equipmentByCategory[e.equipment_category]) {
            equipmentByCategory[e.equipment_category] = [];
        }
        equipmentByCategory[e.equipment_category].push(e);
    });

    const categories = Object.keys(equipmentByCategory);

    return (
        <div className="container py-8 space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="relative group perspective">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 pointer-events-none"></div>
                <div className="relative glass p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl shadow-inner group-hover:rotate-12 transition-transform duration-500">
                            <Settings2 className="h-10 w-10 text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-white mb-2 bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
                                Equipamentos de Processo
                            </h1>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Zap className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-medium">Gestão de Ativos de Produção & Manutenção Ativa</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <EquipmentDialog mode="create" />
                    </div>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Assets", value: equipment?.length || 0, icon: Boxes, color: "text-blue-400" },
                    { label: "Operacionais", value: equipment?.filter(e => e.status === 'active').length || 0, icon: Activity, color: "text-emerald-400" },
                    { label: "Em Manutenção", value: equipment?.filter(e => e.status === 'maintenance').length || 0, icon: Wrench, color: "text-amber-400" },
                    {
                        label: "Manutenção Vencida", value: equipment?.filter(e => {
                            if (!e.next_maintenance_date) return false;
                            return differenceInDays(new Date(e.next_maintenance_date), today) < 0;
                        }).length || 0, icon: AlertTriangle, color: "text-rose-400"
                    },
                ].map((stat, i) => (
                    <Card key={i} className="glass border-white/5 group hover:border-amber-500/20 transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-white">{stat.value}</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</p>
                                </div>
                                <div className={cn("p-2 rounded-lg bg-white/5 group-hover:bg-amber-500/10 transition-colors", stat.color)}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Pesquisar por nome, código ou fabricante..."
                        className="glass border-white/5 pl-10 h-12 rounded-xl text-white placeholder:text-slate-600 focus:border-amber-500/30 transition-all"
                    />
                </div>
                <Button variant="outline" className="glass border-white/5 text-slate-300 rounded-xl h-12">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                </Button>
            </div>

            {/* Tabs & Content */}
            {categories.length > 0 ? (
                <Tabs defaultValue={categories[0]} className="space-y-6">
                    <TabsList className="glass p-1 h-auto bg-slate-950/40 border border-white/5 rounded-2xl flex-wrap justify-start">
                        {categories.map(cat => (
                            <TabsTrigger
                                key={cat}
                                value={cat}
                                className="rounded-xl px-6 py-3 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 transition-all font-bold text-xs uppercase tracking-widest gap-3"
                            >
                                <span className="text-lg">{CATEGORY_ICONS[cat] || "⚙️"}</span>
                                {CATEGORY_LABELS[cat] || cat}
                                <Badge className="bg-white/10 text-white border-none ml-1">{countByCategory[cat] || 0}</Badge>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {categories.map(cat => (
                        <TabsContent key={cat} value={cat} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {equipmentByCategory[cat]?.map((eq) => {
                                    const daysToMaintenance = eq.next_maintenance_date
                                        ? differenceInDays(new Date(eq.next_maintenance_date), today)
                                        : null;
                                    const isOverdue = daysToMaintenance !== null && daysToMaintenance < 0;

                                    return (
                                        <Card key={eq.id} className="glass border-white/5 group hover:border-amber-500/30 transition-all duration-500 overflow-hidden">
                                            <CardHeader className="pb-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-lg">
                                                        {CATEGORY_ICONS[cat] || "⚙️"}
                                                    </div>
                                                    <Badge className={cn("rounded-lg border-none font-bold text-[10px] uppercase", statusColors[eq.status] || statusColors.active)}>
                                                        {eq.status === 'active' ? 'Operacional' : eq.status}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-1">
                                                    <CardTitle className="text-xl font-black text-white group-hover:text-amber-400 transition-colors flex items-center justify-between">
                                                        {eq.name}
                                                        <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded tracking-widest border border-white/5">
                                                            {eq.code}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 font-medium uppercase">{eq.manufacturer || "---"}</span>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {eq.next_maintenance_date && (
                                                    <div className={cn(
                                                        "p-4 rounded-2xl border transition-all duration-300",
                                                        isOverdue
                                                            ? "bg-rose-500/5 border-rose-500/20 group-hover:bg-rose-500/10"
                                                            : "bg-white/5 border-white/5 group-hover:bg-amber-500/5"
                                                    )}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Próx. Manutenção</span>
                                                            <Wrench className={cn("h-3 w-3", isOverdue ? "text-rose-500" : "text-amber-500")} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={cn("text-lg font-black", isOverdue ? "text-rose-400" : "text-slate-200")}>
                                                                {format(new Date(eq.next_maintenance_date), "dd/MM/yyyy")}
                                                            </span>
                                                            {isOverdue && (
                                                                <span className="text-[9px] text-rose-500 font-bold uppercase mt-1 animate-pulse">
                                                                    Manutenção Urgente
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <Link href={`/production/equipment/${eq.id}`} className="flex-1">
                                                        <Button variant="ghost" className="w-full text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 h-10 border border-transparent hover:border-amber-500/20 rounded-xl transition-all">
                                                            <ClipboardCheck className="h-3 w-3 mr-2" />
                                                            Log & Inspeção
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
            ) : (
                <div className="text-center py-32 glass rounded-[2.5rem] border border-dashed border-white/5 animate-in zoom-in duration-500">
                    <div className="p-6 bg-white/5 rounded-full inline-block mb-6">
                        <Settings2 className="h-16 w-16 text-slate-700 opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-300 mb-2">Sem Equipamento</h3>
                    <p className="text-slate-500 text-sm max-w-[300px] mx-auto">
                        Inicie o inventário de produção para monitorar o seu OEE e planos de manutenção.
                    </p>
                    <Button className="mt-8 bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-10 h-12 uppercase tracking-widest text-xs font-black shadow-lg shadow-amber-600/20">
                        Começar Agora
                    </Button>
                </div>
            )}
        </div>
    );
}
