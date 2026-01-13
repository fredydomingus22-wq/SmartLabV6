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
    AlertTriangle,
    Boxes
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";
import { pt } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";

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
        <div className="space-y-10 pb-20">
            <PageHeader
                variant="amber"
                icon={<Settings2 className="h-4 w-4" />}
                overline="Production Assets • MES Hardware"
                title="Equipamentos de Processo"
                description="Gestão de Ativos de Produção & Manutenção Ativa com monitorização de estado."
                backHref="/assets"
                actions={
                    <Button className="bg-amber-600 hover:bg-amber-500 text-white font-bold h-9 shadow-lg shadow-amber-600/20 px-6">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Equipamento
                    </Button>
                }
            />

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPISparkCard
                    variant="blue"
                    title="Total Assets"
                    value={String(equipment?.length || 0).padStart(3, '0')}
                    description="Ativos registrados"
                    icon={<Boxes className="h-4 w-4" />}
                    data={Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 5) + 10 }))}
                />
                <KPISparkCard
                    variant="emerald"
                    title="Operacionais"
                    value={String(equipment?.filter(e => e.status === 'active').length || 0).padStart(3, '0')}
                    description="Disponíveis para produção"
                    icon={<Activity className="h-4 w-4" />}
                    data={Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 5) + 8 }))}
                />
                <KPISparkCard
                    variant="amber"
                    title="Em Manutenção"
                    value={String(equipment?.filter(e => e.status === 'maintenance').length || 0).padStart(3, '0')}
                    description="Intervenções ativas"
                    icon={<Wrench className="h-4 w-4" />}
                    data={Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 3) }))}
                />
                <KPISparkCard
                    variant="destructive"
                    title="Manutenção Vencida"
                    value={String(equipment?.filter(e => {
                        if (!e.next_maintenance_date) return false;
                        return differenceInDays(new Date(e.next_maintenance_date), today) < 0;
                    }).length || 0).padStart(3, '0')}
                    description="Requer atenção imediata"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    data={Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 2) }))}
                />
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Pesquisar por nome, código ou fabricante..."
                        className="bg-card border-slate-800 pl-12 h-11 rounded-xl text-white placeholder:text-slate-600 focus:border-amber-500/30 transition-all shadow-lg"
                    />
                </div>
                <Button variant="outline" className="bg-card border-slate-800 text-slate-300 rounded-xl h-11 hover:bg-slate-900 px-6">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                </Button>
            </div>

            {/* Tabs & Content */}
            {categories.length > 0 ? (
                <Tabs defaultValue={categories[0]} className="space-y-8">
                    <TabsList className="bg-slate-900/50 border border-slate-800 p-1.5 h-auto rounded-2xl flex-wrap justify-start gap-2">
                        {categories.map(cat => (
                            <TabsTrigger
                                key={cat}
                                value={cat}
                                className="rounded-xl px-5 py-2.5 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-amber-600/20 text-slate-500 transition-all font-black text-[10px] uppercase tracking-widest gap-2.5"
                            >
                                <span className="text-sm">{CATEGORY_ICONS[cat] || "⚙️"}</span>
                                {CATEGORY_LABELS[cat] || cat}
                                <Badge className="bg-slate-950/50 text-[10px] text-white border-slate-800 ml-1.5 px-2 py-0 h-5 min-w-[20px] justify-center">{countByCategory[cat] || 0}</Badge>
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
                                        <Card key={eq.id} className="bg-card border-slate-800 group hover:border-amber-500/30 transition-all duration-300 overflow-hidden shadow-lg">
                                            <CardHeader className="pb-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-lg group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-colors">
                                                        {CATEGORY_ICONS[cat] || "⚙️"}
                                                    </div>
                                                    <Badge className={cn("rounded-lg border font-bold text-[9px] uppercase tracking-wider", statusColors[eq.status] || statusColors.active)}>
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
                                                        "p-4 rounded-xl border transition-all duration-300",
                                                        isOverdue
                                                            ? "bg-rose-500/5 border-rose-500/20 group-hover:bg-rose-500/10"
                                                            : "bg-slate-900/50 border-slate-800 group-hover:bg-amber-500/5 group-hover:border-amber-500/10"
                                                    )}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Próx. Manutenção</span>
                                                            <Wrench className={cn("h-3 w-3", isOverdue ? "text-rose-500" : "text-amber-500")} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={cn("text-lg font-black tracking-tight", isOverdue ? "text-rose-400" : "text-slate-200")}>
                                                                {format(new Date(eq.next_maintenance_date), "dd/MM/yyyy")}
                                                            </span>
                                                            {isOverdue && (
                                                                <span className="text-[9px] text-rose-500 font-black uppercase mt-1 animate-pulse tracking-widest">
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
                <div className="text-center py-32 bg-card rounded-[2.5rem] border border-dashed border-slate-800 animate-in zoom-in duration-500 shadow-xl">
                    <div className="p-8 bg-slate-900 border border-slate-800 rounded-full inline-block mb-6">
                        <Settings2 className="h-16 w-16 text-slate-700 opacity-20" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Sem Equipamento</h3>
                    <p className="text-slate-500 text-sm max-w-[350px] mx-auto font-medium">
                        Inicie o inventário de produção para monitorar o seu OEE e planos de manutenção automatizados.
                    </p>
                    <Button className="mt-10 bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-12 h-12 uppercase tracking-widest text-[10px] font-black shadow-lg shadow-amber-600/20 active:scale-95 transition-all">
                        Começar Agora
                    </Button>
                </div>
            )}
        </div>
    );
}
