import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Microscope, Clock, CheckCircle, AlertTriangle, AlertCircle, Beaker, Layers, FlaskConical, Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { getSafeUser } from "@/lib/auth.server";
import { CreateMicroSampleDialog } from "./create-micro-sample-dialog";
import { cn } from "@/lib/utils";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { PageShell } from "@/components/defaults/page-shell";
import { PageHeader } from "@/components/layout/page-header";
import { KPICard } from "@/components/defaults/kpi-card";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function MicroSamplesPage() {
    const supabase = await createClient();
    const user = await getSafeUser();
    const plantId = user.plant_id;

    if (!plantId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8 bg-muted/30 rounded-3xl border border-dashed border-border text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground animate-pulse" />
                <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground">Sem Unidade Associada</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm font-medium italic">O seu perfil não está associado a nenhuma unidade fabril microbiológica.</p>
                </div>
                <Button asChild variant="outline" className="rounded-xl border-border text-foreground hover:bg-muted">
                    <Link href="/micro">Voltar ao Laboratório</Link>
                </Button>
            </div>
        );
    }

    const { data: sampleTypes } = await supabase.from("sample_types").select("id, name, code, test_category").in("test_category", ["microbiological", "both"]).order("name");
    const microTypeIds = sampleTypes?.map(t => t.id) || [];

    const [tanksRes, samplingPointsRes, samplesRes] = await Promise.all([
        supabase.from("intermediate_products").select(`id, code, status, batch:production_batches(id, code, product:products(id, name))`).in("status", ["pending", "approved", "in_use"]).order("code"),
        supabase.from("sampling_points").select("id, name, code").eq("status", "active").order("name"),
        supabase.from("samples").select(`id, code, status, collected_at, sample_type:sample_types(id, name, code, test_category), batch:production_batches(id, code, product:products(name)), intermediate_product:intermediate_products(code)`).in("sample_type_id", microTypeIds.length > 0 ? microTypeIds : ["00000000-0000-0000-0000-000000000000"]).order("collected_at", { ascending: false }).limit(50)
    ]);

    const tanks = tanksRes.data;
    const samplingPoints = samplingPointsRes.data;
    const samples = samplesRes.data;

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'pending': return { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Clock, label: "Pendente" };
            case 'in_analysis': return { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Microscope, label: "Em Incubação" };
            case 'reviewed': return { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: CheckCircle, label: "Leitura OK" };
            case 'approved': return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle, label: "Aprovada" };
            case 'rejected': return { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: AlertTriangle, label: "Rejeitada" };
            default: return { color: "text-muted-foreground", bg: "bg-muted", border: "border-border", icon: Clock, label: status };
        }
    };

    return (
        <PageShell className="space-y-6">
            <PageHeader
                variant="purple"
                icon={<Microscope className="h-4 w-4" />}
                overline="Microbiologia"
                title="Amostras & Incubação"
                description="Monitorização de amostras e controlo de incubação."
                backHref="/micro"
                actions={
                    <CreateMicroSampleDialog
                        sampleTypes={sampleTypes || []}
                        tanks={tanks || []}
                        samplingPoints={samplingPoints || []}
                        plantId={plantId!}
                        trigger={
                            <Button className="h-9 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-[10px] tracking-widest px-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all">
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Amostra
                            </Button>
                        }
                    />
                }
            />

            <div className="p-6 space-y-6">
                {/* Standard KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <KPICard
                        title="Pendentes"
                        value={samples?.filter(s => s.status === "pending").length || 0}
                        icon={Clock}
                        description="A aguardar incubação"
                        trend="Pendente"
                        trendDirection="neutral"
                    />
                    <KPICard
                        title="Em Incubação"
                        value={samples?.filter(s => s.status === "in_analysis").length || 0}
                        icon={FlaskConical}
                        description="Incubadoras ativas"
                        trend="Em curso"
                        trendDirection="up"
                    />
                    <KPICard
                        title="A aguardar revisão"
                        value={samples?.filter(s => s.status === "reviewed").length || 0}
                        icon={CheckCircle}
                        description="Leitura concluída"
                        trend="Revisão"
                        trendDirection="neutral"
                    />
                    <KPICard
                        title="Não Conformidades"
                        value={samples?.filter(s => s.status === "rejected").length || 0}
                        icon={AlertTriangle}
                        description="Requer atenção"
                        trend="Crítico"
                        trendDirection="down"
                    />
                </div>

                {/* Standard Shadcn Table */}
                <Card className="bg-card border-border shadow-sm">
                    <div className="rounded-xl overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent border-border">
                                    <TableHead className="pl-6 h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-[250px]">Código / Tipo</TableHead>
                                    <TableHead className="h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Origem / Matriz</TableHead>
                                    <TableHead className="h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recolha</TableHead>
                                    <TableHead className="text-center h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estado</TableHead>
                                    <TableHead className="text-right pr-6 h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ação Rápida</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {samples?.map((sample) => {
                                    const styles = getStatusStyles(sample.status);
                                    const StatusIcon = styles.icon;
                                    const sampleType = Array.isArray(sample.sample_type) ? (sample.sample_type[0] as any) : (sample.sample_type as any);
                                    const batch = Array.isArray(sample.batch) ? (sample.batch[0] as any) : (sample.batch as any);
                                    const intermediate = Array.isArray(sample.intermediate_product) ? (sample.intermediate_product[0] as any) : (sample.intermediate_product as any);

                                    return (
                                        <TableRow key={sample.id} className="cursor-pointer hover:bg-muted/50 border-border group transition-colors">
                                            <TableCell className="pl-6 py-4">
                                                <Link href={`/micro/samples/${sample.id}`} className="block">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/20 transition-colors">
                                                            <Layers className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-foreground text-sm block">{sample.code}</span>
                                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{sampleType?.name}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                                                        <p className="text-xs font-semibold text-foreground">{batch?.code || "S/ Lote"}</p>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground pl-3.5">
                                                        {intermediate?.code ? `Tanque: ${intermediate.code}` : 'Ponto de Recolha Fixo'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span className="text-xs font-medium font-mono">
                                                        {sample.collected_at ? format(new Date(sample.collected_at), "dd/MM HH:mm") : "—"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex justify-center">
                                                    <Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider gap-1.5 shadow-sm", styles.bg, styles.color, styles.border)}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {styles.label}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-4">
                                                {sample.status === "pending" ? (
                                                    <Link href="/micro/incubators">
                                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                                                            Incubar →
                                                        </Button>
                                                    </Link>
                                                ) : sample.status === "in_analysis" ? (
                                                    <Link href="/micro/reading">
                                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                            Ler →
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Link href={`/micro/samples/${sample.id}`}>
                                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                                                            Detalhes
                                                        </Button>
                                                    </Link>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        {(!samples || samples.length === 0) && (
                            <div className="py-24 text-center">
                                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-border border-dashed">
                                    <Microscope className="h-8 w-8 text-muted-foreground opacity-50" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Sem Registos Ativos</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1 mb-6">
                                    Crie uma nova amostra para iniciar o registo.
                                </p>
                                <CreateMicroSampleDialog
                                    sampleTypes={sampleTypes || []}
                                    tanks={tanks || []}
                                    samplingPoints={samplingPoints || []}
                                    plantId={plantId!}
                                    trigger={
                                        <Button variant="outline" className="border-border hover:bg-muted">
                                            Criar Primeira Amostra
                                        </Button>
                                    }
                                />
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </PageShell>
    );
}
