import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Wrench,
    ArrowLeft
} from "lucide-react";
import { EquipmentDialog } from "./equipment-dialog";
import { EquipmentUX } from "./equipment-ux";
import { PageHeader } from "@/components/layout/page-header";

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

    // Group by category
    const equipmentByCategory: Record<string, ProcessEquipment[]> = {};

    equipment.forEach(e => {
        if (!equipmentByCategory[e.equipment_category]) {
            equipmentByCategory[e.equipment_category] = [];
        }
        equipmentByCategory[e.equipment_category].push(e);
    });

    const categories = Object.keys(equipmentByCategory);

    return (
        <div className="space-y-10">
            <PageHeader
                variant="amber"
                icon={<Wrench className="h-4 w-4" />}
                overline="Asset Intelligence"
                title="Process Equipment"
                description="Monitoramento de ativos industriais, ciclos de vida e cronogramas de manutenção preventiva."
                backHref="/production"
                actions={<EquipmentDialog mode="create" />}
            />

            <main className="relative">
                <EquipmentUX
                    equipment={equipment || []}
                    categories={categories}
                    categoryIcons={CATEGORY_ICONS}
                    categoryLabels={CATEGORY_LABELS}
                    statusColors={statusColors}
                />
            </main>

            {/* Global Status Footer */}
            <footer className="flex items-center justify-between pt-10 border-t border-white/5 opacity-50">
                <span className="text-[10px] font-mono tracking-widest uppercase">Asset Management • GAMP 5 Ready</span>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Global Asset Synchronization</span>
                </div>
            </footer>
        </div>
    );
}
