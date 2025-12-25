import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Microscope, Clock, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getSafeUser } from "@/lib/auth";
import { CreateMicroSampleDialog } from "./create-micro-sample-dialog";

export const dynamic = "force-dynamic";

export default async function MicroSamplesPage() {
    const supabase = await createClient();

    // Get plant from safe user
    const user = await getSafeUser();
    const plantId = user.plant_id;

    if (!plantId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8 glass rounded-2xl border-purple-100 border-2">
                <AlertCircle className="h-12 w-12 text-purple-500 animate-pulse" />
                <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-900 italic uppercase underline decoration-purple-500 underline-offset-4">Sem Planta Associada</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">O seu perfil não está associado a nenhuma unidade fabril microbiológica. <br />Contacte o administrador do sistema para configurar o seu acesso.</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/micro">Voltar ao Laboratório</Link>
                </Button>
            </div>
        );
    }

    // Get microbiological sample types only
    const { data: sampleTypes } = await supabase
        .from("sample_types")
        .select("id, name, code, test_category")
        .in("test_category", ["microbiological", "both"])
        .order("name");

    // Get all sample type IDs for filtering samples
    const microTypeIds = sampleTypes?.map(t => t.id) || [];

    // Get tanks with batches - Broaden filtering to include approved and in_use
    const { data: tanks } = await supabase
        .from("intermediate_products")
        .select(`
            id, code, status,
            batch:production_batches(id, code, product:products(id, name))
        `)
        .in("status", ["pending", "approved", "in_use"])
        .order("code");

    // Get sampling points
    const { data: samplingPoints } = await supabase
        .from("sampling_points")
        .select("id, name, code")
        .eq("status", "active")
        .order("name");

    // Get micro samples (filtered by sample type)
    const { data: samples } = await supabase
        .from("samples")
        .select(`
            id, code, status, collected_at,
            sample_type:sample_types(id, name, code, test_category),
            batch:production_batches(id, code, product:products(name)),
            intermediate_product:intermediate_products(code)
        `)
        .in("sample_type_id", microTypeIds.length > 0 ? microTypeIds : ["00000000-0000-0000-0000-000000000000"])
        .order("collected_at", { ascending: false })
        .limit(50);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { class: string; icon: React.ReactNode }> = {
            pending: { class: "bg-yellow-100 text-yellow-700", icon: <Clock className="h-3 w-3" /> },
            in_analysis: { class: "bg-blue-100 text-blue-700", icon: <Microscope className="h-3 w-3" /> },
            reviewed: { class: "bg-purple-100 text-purple-700", icon: <CheckCircle className="h-3 w-3" /> },
            approved: { class: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3" /> },
            rejected: { class: "bg-red-100 text-red-700", icon: <AlertTriangle className="h-3 w-3" /> },
        };
        const style = styles[status] || styles.pending;
        return (
            <Badge className={`${style.class} flex items-center gap-1`}>
                {style.icon}
                {status}
            </Badge>
        );
    };

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Microscope className="h-8 w-8 text-purple-500" />
                        Amostras Microbiológicas
                    </h1>
                    <p className="text-muted-foreground">
                        Gestão de amostras para análise microbiológica
                    </p>
                </div>
                <CreateMicroSampleDialog
                    sampleTypes={sampleTypes || []}
                    tanks={tanks || []}
                    samplingPoints={samplingPoints || []}
                    plantId={plantId}
                />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardDescription>Pendentes</CardDescription>
                        <CardTitle className="text-2xl text-yellow-600">
                            {samples?.filter(s => s.status === "pending").length || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardDescription>Em Incubação</CardDescription>
                        <CardTitle className="text-2xl text-blue-600">
                            {samples?.filter(s => s.status === "in_analysis").length || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardDescription>Aprovadas</CardDescription>
                        <CardTitle className="text-2xl text-green-600">
                            {samples?.filter(s => s.status === "approved").length || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardDescription>Rejeitadas</CardDescription>
                        <CardTitle className="text-2xl text-red-600">
                            {samples?.filter(s => s.status === "rejected").length || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Samples List */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Amostras Recentes</CardTitle>
                    <CardDescription>
                        Últimas 50 amostras microbiológicas registadas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {samples && samples.length > 0 ? (
                        <div className="rounded-lg border">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-3 font-medium">Código</th>
                                        <th className="text-left p-3 font-medium">Tipo</th>
                                        <th className="text-left p-3 font-medium">Lote/Tanque</th>
                                        <th className="text-left p-3 font-medium">Coleta</th>
                                        <th className="text-left p-3 font-medium">Status</th>
                                        <th className="text-right p-3 font-medium">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {samples.map((sample) => {
                                        const sampleType = Array.isArray(sample.sample_type) ? sample.sample_type[0] : sample.sample_type;
                                        const batch = Array.isArray(sample.batch) ? sample.batch[0] : sample.batch;
                                        const intermediate = Array.isArray(sample.intermediate_product) ? sample.intermediate_product[0] : sample.intermediate_product;

                                        return (
                                            <tr key={sample.id} className="border-b hover:bg-muted/30">
                                                <td className="p-3 font-mono font-medium">{sample.code}</td>
                                                <td className="p-3 text-muted-foreground">{sampleType?.name || "—"}</td>
                                                <td className="p-3">
                                                    <span className="text-sm">{batch?.code || "—"}</span>
                                                    {intermediate?.code && (
                                                        <span className="text-xs text-muted-foreground ml-1">
                                                            ({intermediate.code})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-sm text-muted-foreground">
                                                    {sample.collected_at
                                                        ? format(new Date(sample.collected_at), "dd/MM/yyyy HH:mm")
                                                        : "—"
                                                    }
                                                </td>
                                                <td className="p-3">{getStatusBadge(sample.status)}</td>
                                                <td className="p-3 text-right">
                                                    {sample.status === "pending" ? (
                                                        <Link href="/micro/incubators">
                                                            <Badge variant="outline" className="cursor-pointer hover:bg-purple-50">
                                                                Iniciar Incubação →
                                                            </Badge>
                                                        </Link>
                                                    ) : sample.status === "in_analysis" ? (
                                                        <Link href="/micro/reading">
                                                            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">
                                                                Ver Leituras →
                                                            </Badge>
                                                        </Link>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Microscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma amostra microbiológica registada.</p>
                            <p className="text-sm">Clique em &quot;Nova Amostra Micro&quot; para começar.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
