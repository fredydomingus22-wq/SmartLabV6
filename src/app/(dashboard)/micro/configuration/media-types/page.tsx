import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { MediaTypeDialog } from "./media-type-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteMediaTypeAction } from "@/app/actions/micro-media";
import { DeleteButton } from "@/components/smart/delete-button";
import {
    AlertCircle,
    ArrowLeft,
    FlaskConical,
    Thermometer,
    Clock,
    Search,
    Settings2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function MediaTypesPage() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // For admins without plant, allow selection or show warning
    let plantId = user.plant_id;
    let plants: { id: string; name: string }[] = [];

    // If no plant (admin without plant assignment), fetch available plants
    if (!plantId) {
        const { data: availablePlants } = await supabase
            .from("plants")
            .select("id, name")
            .eq("organization_id", user.organization_id)
            .order("name");

        plants = availablePlants || [];

        // If only one plant exists, auto-select it
        if (plants.length === 1) {
            plantId = plants[0].id;
        }
    }

    // Still no plant? Show selection UI
    if (!plantId) {
        return (
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/micro/configuration">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <FlaskConical className="h-8 w-8 text-emerald-500" />
                            Tipos de Meio de Cultura
                        </h1>
                        <p className="text-muted-foreground">
                            Configure os meios utilizados nas análises microbiológicas.
                        </p>
                    </div>
                </div>

                <Card className="glass border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
                        <h2 className="text-xl font-bold text-slate-200 mb-2">Selecione uma Planta</h2>
                        <p className="text-slate-400 text-sm max-w-md text-center mb-6">
                            Como administrador, você precisa selecionar uma planta para gerenciar os tipos de meio de cultura.
                        </p>

                        {plants.length > 0 ? (
                            <div className="grid gap-2">
                                {plants.map(plant => (
                                    <Link key={plant.id} href={`/micro/configuration/media-types?plant=${plant.id}`}>
                                        <Button variant="outline" className="w-full min-w-[200px]">
                                            {plant.name}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500">Nenhuma planta configurada na organização.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Fetch Media Types for this organization
    const { data: mediaTypes } = await supabase
        .from("micro_media_types")
        .select("*")
        .eq("organization_id", user.organization_id)
        .order("name");

    // Stats
    const totalMedia = mediaTypes?.length || 0;
    const avgIncubation = mediaTypes?.length
        ? Math.round(mediaTypes.reduce((acc, mt) => acc + ((mt.incubation_hours_min + mt.incubation_hours_max) / 2), 0) / mediaTypes.length)
        : 0;
    const tempRange = mediaTypes?.length
        ? `${Math.min(...mediaTypes.map(mt => mt.incubation_temp_c))} - ${Math.max(...mediaTypes.map(mt => mt.incubation_temp_c))}°C`
        : "-";

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/micro/configuration">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <FlaskConical className="h-8 w-8 text-emerald-500" />
                            Tipos de Meio de Cultura
                        </h1>
                        <p className="text-muted-foreground">
                            Configure os meios utilizados nas análises microbiológicas.
                        </p>
                    </div>
                </div>
                <MediaTypeDialog plantId={plantId!} />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Meios</CardTitle>
                        <FlaskConical className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalMedia}</div>
                        <p className="text-xs text-muted-foreground mt-1">Meios configurados</p>
                    </CardContent>
                </Card>

                <Card className="glass border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Incubação Média</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{avgIncubation}h</div>
                        <p className="text-xs text-muted-foreground mt-1">Tempo médio de incubação</p>
                    </CardContent>
                </Card>

                <Card className="glass border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Faixa de Temperatura</CardTitle>
                        <Thermometer className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{tempRange}</div>
                        <p className="text-xs text-muted-foreground mt-1">Temperaturas de incubação</p>
                    </CardContent>
                </Card>
            </div>

            {/* Media Types Table */}
            <Card className="glass">
                <CardHeader className="border-b border-border/40">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-muted-foreground" />
                                Meios Cadastrados
                            </CardTitle>
                            <CardDescription>
                                Lista de todos os meios de cultura configurados para análises microbiológicas.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {mediaTypes && mediaTypes.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-border/40">
                                    <TableHead className="font-semibold">Nome do Meio</TableHead>
                                    <TableHead className="font-semibold">Tempo de Incubação</TableHead>
                                    <TableHead className="font-semibold">Temperatura</TableHead>
                                    <TableHead className="font-semibold">Descrição</TableHead>
                                    <TableHead className="w-[120px] text-right font-semibold">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mediaTypes.map((mt) => (
                                    <TableRow key={mt.id} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                    <FlaskConical className="h-4 w-4 text-emerald-500" />
                                                </div>
                                                <span className="font-medium">{mt.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <Badge variant="outline" className="font-mono">
                                                    {mt.incubation_hours_min} - {mt.incubation_hours_max}h
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Thermometer className="h-4 w-4 text-orange-500" />
                                                <span className="font-mono font-medium">{mt.incubation_temp_c}°C</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <span className="text-muted-foreground text-sm line-clamp-2">
                                                {mt.description ||
                                                    <span className="italic text-slate-500">Sem descrição</span>
                                                }
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MediaTypeDialog plantId={plantId!} mediaType={mt} />
                                                <DeleteButton
                                                    action={deleteMediaTypeAction}
                                                    id={mt.id}
                                                    confirmMessage={`Tem certeza que deseja excluir "${mt.name}"?`}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                                <FlaskConical className="h-8 w-8 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Nenhum meio cadastrado</h3>
                            <p className="text-muted-foreground text-sm max-w-md mb-6">
                                Comece adicionando os meios de cultura utilizados nas suas análises microbiológicas.
                            </p>
                            <MediaTypeDialog plantId={plantId!} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
