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
    Settings2,
    Beaker
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/defaults/page-shell";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function MediaTypesPage({
    searchParams,
}: {
    searchParams: Promise<{ plant: string }>;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();
    const params = await searchParams;

    // For admins without plant, allow selection or show warning
    let plantId = user.plant_id || params.plant;
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
            <PageShell>
                <PageHeader
                    variant="purple"
                    icon={<FlaskConical className="h-6 w-6" />}
                    title="Tipos de Meio de Cultura"
                    description="Configure os meios utilizados nas análises microbiológicas."
                    backHref="/micro/configuration"
                />

                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 rounded-full bg-yellow-500/10 mb-4">
                            <AlertCircle className="h-10 w-10 text-yellow-500" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Selecione uma Unidade</h2>
                        <p className="text-muted-foreground text-sm max-w-md text-center mb-6">
                            Como administrador, selecione uma unidade para gerir os tipos de meio de cultura.
                        </p>

                        {plants.length > 0 ? (
                            <div className="grid gap-2 w-full max-w-xs">
                                {plants.map(plant => (
                                    <Link key={plant.id} href={`/micro/configuration/media-types?plant=${plant.id}`}>
                                        <Button variant="outline" className="w-full">
                                            {plant.name}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Nenhuma unidade configurada na organização.</p>
                        )}
                    </CardContent>
                </Card>
            </PageShell >
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
        <PageShell>
            <PageHeader
                variant="purple"
                icon={<FlaskConical className="h-6 w-6" />}
                title="Tipos de Meio de Cultura"
                description="Configure os meios utilizados nas análises microbiológicas."
                backHref="/micro/configuration"
                actions={<MediaTypeDialog plantId={plantId!} />}
            />

            <div className="p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-emerald-500/20 bg-emerald-500/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Meios</CardTitle>
                            <FlaskConical className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalMedia}</div>
                            <p className="text-xs text-muted-foreground mt-1">Meios configurados</p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-500/20 bg-blue-500/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Incubação Média</CardTitle>
                            <Clock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{avgIncubation}h</div>
                            <p className="text-xs text-muted-foreground mt-1">Tempo médio de incubação</p>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-500/20 bg-orange-500/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Faixa de Temperatura</CardTitle>
                            <Thermometer className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{tempRange}</div>
                            <p className="text-xs text-muted-foreground mt-1">Temperaturas de incubação</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Media Types Table */}
                <Card>
                    <CardHeader className="border-b">
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
                                    <TableRow>
                                        <TableHead className="font-semibold">Nome do Meio</TableHead>
                                        <TableHead className="font-semibold">Tempo de Incubação</TableHead>
                                        <TableHead className="font-semibold">Temperatura</TableHead>
                                        <TableHead className="font-semibold">Descrição</TableHead>
                                        <TableHead className="w-[120px] text-right font-semibold">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mediaTypes.map((mt) => (
                                        <TableRow key={mt.id} className="group hover:bg-muted/50 transition-colors">
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
                                                    <Badge variant="outline" className="font-mono bg-background">
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
                                                        <span className="italic text-muted-foreground/50">Sem descrição</span>
                                                    }
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MediaTypeDialog plantId={plantId!} mediaType={mt} />
                                                    <DeleteButton
                                                        action={deleteMediaTypeAction}
                                                        id={mt.id}
                                                        confirmMessage={`Tem a certeza que deseja eliminar "${mt.name}"?`}
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
                                    Comece por adicionar os meios de cultura utilizados nas suas análises microbiológicas.
                                </p>
                                <MediaTypeDialog plantId={plantId!} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageShell>
    );
}
