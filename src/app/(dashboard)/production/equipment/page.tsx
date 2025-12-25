import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Container, Settings2 } from "lucide-react";
import Link from "next/link";
import { EquipmentDialog } from "./equipment-dialog";
import { EquipmentStatusSelect } from "./equipment-status-select";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
    tank: "Tank",
    mixer: "Mixer",
    pasteurizer: "Pasteurizer",
    filler: "Filler",
    incubator: "Incubator",
    production_line: "Production Line",
    other: "Other",
};

const TYPE_ICONS: Record<string, string> = {
    tank: "🛢️",
    mixer: "🔄",
    pasteurizer: "🔥",
    filler: "📦",
    incubator: "🧫",
    production_line: "🏭",
    other: "⚙️",
};

export default async function EquipmentPage() {
    const supabase = await createClient();

    const { data: equipment } = await supabase
        .from("equipments")
        .select("*")
        .order("equipment_type")
        .order("name");

    // Get counts by type
    const countByType: Record<string, number> = {};
    equipment?.forEach(e => {
        countByType[e.equipment_type] = (countByType[e.equipment_type] || 0) + 1;
    });

    // Group by type
    const equipmentByType: Record<string, typeof equipment> = {};
    equipment?.forEach(e => {
        if (!equipmentByType[e.equipment_type]) {
            equipmentByType[e.equipment_type] = [];
        }
        equipmentByType[e.equipment_type]!.push(e);
    });

    const types = Object.keys(equipmentByType);

    return (
        <div className="container py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/production">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Production
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Settings2 className="h-8 w-8 text-blue-500" />
                        Equipment Management
                    </h1>
                    <p className="text-muted-foreground">
                        Manage physical equipment: tanks, mixers, pasteurizers, and more.
                    </p>
                </div>
                <EquipmentDialog mode="create" />
            </div>

            {/* Summary cards */}
            <div className="grid gap-4 md:grid-cols-4">
                {["tank", "mixer", "pasteurizer", "filler"].map(type => (
                    <Card key={type} className="glass">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span>{TYPE_ICONS[type]}</span>
                                {TYPE_LABELS[type]}s
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{countByType[type] || 0}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs by type */}
            <Tabs defaultValue={types[0] || "tank"} className="space-y-4">
                <TabsList>
                    {types.map(type => (
                        <TabsTrigger key={type} value={type}>
                            {TYPE_ICONS[type]} {TYPE_LABELS[type]}s ({countByType[type] || 0})
                        </TabsTrigger>
                    ))}
                </TabsList>

                {types.map(type => (
                    <TabsContent key={type} value={type} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {equipmentByType[type]?.map((eq) => (
                                <Card key={eq.id} className="glass hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{eq.name}</CardTitle>
                                            <Badge variant="outline" className="font-mono">
                                                {eq.code}
                                            </Badge>
                                        </div>
                                        <CardDescription className="flex items-center gap-2">
                                            <EquipmentStatusSelect
                                                equipmentId={eq.id}
                                                currentStatus={eq.status}
                                            />
                                            {eq.capacity && (
                                                <span className="text-xs">
                                                    • {eq.capacity} {eq.capacity_unit || 'L'}
                                                </span>
                                            )}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {(eq.next_calibration_date || eq.serial_number) && (
                                            <div className="text-[11px] space-y-1 py-2 border-y border-slate-800/50">
                                                {eq.serial_number && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500 uppercase tracking-wider">S/N:</span>
                                                        <span className="text-slate-300 font-mono">{eq.serial_number}</span>
                                                    </div>
                                                )}
                                                {eq.next_calibration_date && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500 uppercase tracking-wider">Próxima Calibração:</span>
                                                        <span className={cn(
                                                            "font-bold",
                                                            new Date(eq.next_calibration_date) < new Date() ? "text-rose-500" : "text-emerald-400"
                                                        )}>
                                                            {new Date(eq.next_calibration_date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <Link href={`/production/equipment/${eq.id}`}>
                                                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 text-xs">
                                                    Monitorizar
                                                </Button>
                                            </Link>
                                            <EquipmentDialog mode="edit" equipment={eq} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            {(!equipment || equipment.length === 0) && (
                <Card className="glass">
                    <CardContent className="py-12 text-center">
                        <Container className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-2">No equipment</h3>
                        <p className="text-muted-foreground mb-4">
                            Add your first equipment to get started.
                        </p>
                        <EquipmentDialog mode="create" />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
