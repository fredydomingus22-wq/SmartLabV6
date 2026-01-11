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
    Boxes,
    ArrowLeft
} from "lucide-react";
import { EquipmentDialog } from "./equipment-dialog";
import { EquipmentUX } from "./equipment-ux";
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
    equipment_type: string;
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

    const { data: rawEquipment } = await supabase
        .from("process_equipment")
        .select("*")
        .order("equipment_category")
        .order("name");

    const equipment = rawEquipment?.map(e => ({
        ...e,
        equipment_type: e.equipment_category
    })) as ProcessEquipment[] || [];

    const today = new Date();

    // Group by category
    const countByCategory: Record<string, number> = {};
    const equipmentByCategory: Record<string, ProcessEquipment[]> = {};

    equipment.forEach(e => {
        countByCategory[e.equipment_category] = (countByCategory[e.equipment_category] || 0) + 1;
        if (!equipmentByCategory[e.equipment_category]) {
            equipmentByCategory[e.equipment_category] = [];
        }
        equipmentByCategory[e.equipment_category].push(e);
    });

    const categories = Object.keys(equipmentByCategory);

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-[#020617] text-slate-100 selection:bg-amber-500/30">
            {/* 🛡️ PREMIUM ASSET HEADER */}
            <header className="sticky top-0 z-40 bg-slate-950/60 backdrop-blur-2xl border-b border-white/5 px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1700px] mx-auto">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/production">
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white hover:bg-white/5 rounded-full">
                                    <ArrowLeft className="h-3 w-3 mr-1" />
                                    Back
                                </Button>
                            </Link>
                            <span className="text-xs font-bold uppercase tracking-widest opacity-70 text-primary">Asset Intelligence</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight">
                            Process Equipment
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Monitor industrial assets, lifecycles, and predictive maintenance schedules.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <EquipmentDialog mode="create" />
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 max-w-[1700px] mx-auto w-full">
                <EquipmentUX
                    equipment={equipment || []}
                    categories={categories}
                    categoryIcons={CATEGORY_ICONS}
                    categoryLabels={CATEGORY_LABELS}
                    statusColors={statusColors}
                />
            </main>
        </div>
    );
}
