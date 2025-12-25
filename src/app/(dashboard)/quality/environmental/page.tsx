import { getEnvironmentalZones } from "@/lib/queries/compliance";
import { ZoneCard } from "@/app/(dashboard)/quality/environmental/_components/zone-card";
import { ZoneDialog } from "@/app/(dashboard)/quality/environmental/_components/zone-dialog";
import { Microscope, ShieldAlert, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EnvironmentalMonitoringPage() {
    const zones = await getEnvironmentalZones();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/quality">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Microscope className="h-8 w-8 text-blue-500" />
                            Monitorização Ambiental Estratégica
                        </h1>
                        <p className="text-muted-foreground">
                            Gestão de zonas de higiene, pontos de amostragem e conformidade FSSC 22000
                        </p>
                    </div>
                </div>
                <ZoneDialog mode="create" />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="glass p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-full">
                        <ShieldAlert className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Zonas de Alto Risco</p>
                        <p className="text-2xl font-bold">{zones.filter(z => z.risk_level === 1).length}</p>
                    </div>
                </div>
                <div className="glass p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-full">
                        <Activity className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pontos Totais</p>
                        <p className="text-2xl font-bold">{zones.reduce((acc, z) => acc + (z.sampling_points?.length || 0), 0)}</p>
                    </div>
                </div>
                <div className="glass p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-full">
                        <Microscope className="h-6 w-6 text-green-500" />
                    </div>
                    <Link href="/micro" className="group">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider group-hover:text-green-600 transition-colors">Integração Micro</p>
                        <p className="text-sm font-semibold group-hover:underline">Aceder Laboratório Micro →</p>
                    </Link>
                </div>
            </div>

            {/* Zones List */}
            <div className="grid gap-6">
                {zones.length > 0 ? (
                    zones.map((zone) => (
                        <ZoneCard key={zone.id} zone={zone} />
                    ))
                ) : (
                    <div className="glass p-12 text-center space-y-4">
                        <Microscope className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                        <h3 className="text-xl font-semibold">Nenhuma Zona Configurada</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Comece por definir as suas zonas ambientais (ex: Zona 1, Zona 2) para organizar os seus pontos de monitorização.
                        </p>
                        <ZoneDialog mode="create" />
                    </div>
                )}
            </div>
        </div>
    );
}
