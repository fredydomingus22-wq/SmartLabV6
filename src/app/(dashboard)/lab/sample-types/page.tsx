import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, FlaskConical, Clock, Settings2 } from "lucide-react";
import { SampleTypeDialog } from "./sample-type-dialog";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function SampleTypesPage() {
    const supabase = await createClient();

    const { data: sampleTypes } = await supabase
        .from("sample_types")
        .select("id, name, code, description, test_category, retention_time_days, default_sla_minutes")
        .order("name");

    // Get usage counts - This logic is no longer used in the new UI, but keeping it for now as per instructions.
    const { data: usageCounts } = await supabase
        .from("samples")
        .select("sample_type_id");

    const countByType: Record<string, number> = {};
    usageCounts?.forEach(s => {
        countByType[s.sample_type_id] = (countByType[s.sample_type_id] || 0) + 1;
    });

    return (
        <div className="space-y-10">
            <PageHeader
                variant="indigo"
                icon={<Settings2 className="h-4 w-4" />}
                overline="Master Data Configuration"
                title="Tipos de Amostra"
                description="Configure os templates de amostras utilizados no laboratório. Defina prefixos de codificação, categorias de teste e SLAs padrão."
                backHref="/lab"
                actions={
                    <SampleTypeDialog
                        mode="create"
                        trigger={
                            <Button className="h-9 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[9px] tracking-widest px-4 rounded-xl shadow-lg shadow-indigo-500/10 transition-all">
                                <Plus className="h-3.5 w-3.5 mr-1" /> Novo Tipo
                            </Button>
                        }
                    />
                }
            />

            <main className="relative">

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sampleTypes?.map((type) => (
                        <Card key={type.id} className="glass border-slate-700/50 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <SampleTypeDialog
                                    mode="edit"
                                    sampleType={type}
                                    trigger={
                                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-slate-800 rounded-full">
                                            <Edit className="h-4 w-4 text-slate-400 hover:text-blue-400" />
                                        </Button>
                                    }
                                />
                            </div>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-semibold text-slate-200 flex items-center gap-2">
                                            {getIconForCategory(type.test_category)}
                                            {type.name}
                                        </CardTitle>
                                        <CardDescription className="text-xs font-mono text-slate-500">
                                            PREFIX: <span className="text-slate-300">{type.code}</span>
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Categoria</span>
                                        <Badge variant="outline" className={cn(
                                            "capitalize",
                                            type.test_category === 'microbiological' ? "border-purple-500/20 text-purple-400 bg-purple-500/5" :
                                                type.test_category === 'environmental' ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" :
                                                    "border-blue-500/20 text-blue-400 bg-blue-500/5"
                                        )}>
                                            {type.test_category}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Retenção</span>
                                        <span className="text-slate-200 font-medium">{type.retention_time_days || '-'} dias</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">SLA Padrão</span>
                                        <div className="flex items-center gap-1.5 text-orange-400">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span className="font-medium">{type.default_sla_minutes ? `${type.default_sla_minutes / 60}h` : '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative gradient footer */}
                                <div className={cn(
                                    "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-50",
                                    type.test_category === 'microbiological' ? "from-purple-500/0 via-purple-500 to-purple-500/0" :
                                        type.test_category === 'environmental' ? "from-emerald-500/0 via-emerald-500 to-emerald-500/0" :
                                            "from-blue-500/0 via-blue-500 to-blue-500/0"
                                )} />
                            </CardContent>
                        </Card>
                    ))}

                    {(!sampleTypes || sampleTypes.length === 0) && (
                        <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-lg">
                            <FlaskConical className="h-10 w-10 text-slate-600 mx-auto mb-3 opacity-50" />
                            <h3 className="text-lg font-medium text-slate-400">Nenhum tipo de amostra configurado</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                                Comece criando tipos de amostra para padronizar o registo no laboratório.
                            </p>
                            <SampleTypeDialog
                                mode="create"
                                trigger={
                                    <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
                                        Criar Primeiro Tipo
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function getIconForCategory(category: string) {
    switch (category) {
        case 'microbiological': return <span className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />;
        case 'environmental': return <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />;
        default: return <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />;
    }
}
