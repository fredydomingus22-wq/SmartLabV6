import { Suspense } from "react";
import { getEnvironmentalZones } from "@/lib/queries/compliance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Microscope,
    MapPin,
    Activity,
    AlertCircle,
    LayoutGrid,
    Map as MapIcon,
    Timer
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const metadata = {
    title: "Monitoramento Ambiental | SmartLab",
    description: "Gestão estratégica de zonas de amostragem e patógenos ambientais.",
};

export default async function EnvironmentalMonitoringPage() {
    const zones = await getEnvironmentalZones();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 italic">
                        Monitoramento <span className="text-sky-600">Ambiental</span>
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <MapIcon className="h-4 w-4" />
                        Controle estratégico de patógenos e indicadores por zonas de risco.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button className="bg-sky-600 hover:bg-sky-700 text-white shadow-lg transition-all hover:scale-105">
                        <Plus className="mr-2 h-4 w-4" />
                        Configurar Zona
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-sky-100 dark:border-sky-900 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <LayoutGrid className="h-12 w-12 text-sky-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-500">Zonas Ativas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{zones.length}</div>
                        <p className="text-xs text-muted-foreground">Mapeadas no plano diretor</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-amber-100 dark:border-amber-900 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <MapPin className="h-12 w-12 text-amber-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-500">Pontos de Coleta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                            {zones.reduce((acc, z) => acc + (z.sampling_points?.length || 0), 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Pontos fixos e rotativos</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-emerald-100 dark:border-emerald-900 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Activity className="h-12 w-12 text-emerald-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-500">Conformidade</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">98.2%</div>
                        <p className="text-xs text-muted-foreground">Últimos 30 dias (Simulado)</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-rose-100 dark:border-rose-900 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Timer className="h-12 w-12 text-rose-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-500">Amostras Pendentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600">12</div>
                        <p className="text-xs text-muted-foreground">Aguardando coleta semanal</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 grid-cols-1">
                <h3 className="text-lg font-semibold mt-4">Mapa de Zonas e Pontos</h3>
                {zones.length === 0 ? (
                    <Card className="border-dashed flex items-center justify-center h-[300px] bg-slate-50/50">
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                                <LayoutGrid className="h-6 w-6 text-sky-600" />
                            </div>
                            <p className="text-muted-foreground">
                                Nenhuma zona ambiental configurada.<br />
                                Defina zonas (1-4) conforme o Plano de Monitoramento Ambiental (EMP).
                            </p>
                            <Button variant="outline">Começar Mapeamento</Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {zones.map((zone) => (
                            <Card key={zone.id} className="border-l-4 border-l-sky-500 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">Zona {zone.risk_level}</Badge>
                                                {zone.name}
                                            </CardTitle>
                                            <CardDescription className="mt-1">{zone.description}</CardDescription>
                                        </div>
                                        <Button variant="ghost" size="icon">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Pontos de Amostragem ({zone.sampling_points?.length || 0})</h4>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {zone.sampling_points?.length === 0 ? (
                                                <p className="text-xs text-muted-foreground italic py-2">Nenhum ponto definido para esta zona.</p>
                                            ) : (
                                                zone.sampling_points.map((pt: any) => (
                                                    <div key={pt.id} className="py-2 flex justify-between items-center group">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium group-hover:text-sky-600 transition-colors">{pt.name}</span>
                                                            <span className="text-[10px] text-muted-foreground">{pt.frequency || 'Frequência não definida'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <div className="text-[10px] text-muted-foreground uppercase">Última Coleta</div>
                                                                <div className="text-xs font-semibold">
                                                                    {pt.last_swabbed_at
                                                                        ? format(new Date(pt.last_swabbed_at), "dd/MM/yyyy")
                                                                        : "Nunca"}
                                                                </div>
                                                            </div>
                                                            <Badge variant="secondary" className="text-[10px]">OK</Badge>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
