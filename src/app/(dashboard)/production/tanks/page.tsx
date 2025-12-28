import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container, Plus, Droplets, Settings2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

interface Tank {
    id: string;
    name: string;
    code: string;
    capacity: number | null;
    capacity_unit: string | null;
    status: string;
    created_at: string;
}

interface TankContent {
    id: string;
    code: string;
    status: string;
    volume: number | null;
    unit: string | null;
    equipment_id: string;
    batch: { id: string; code: string; product: { id: string; name: string } | null } | null;
}

const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cleaning: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    decommissioned: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default async function TanksPage() {
    const supabase = await createClient();

    const { data: tanks } = await supabase
        .from("tanks")
        .select("*")
        .order("code");

    // Get current contents for all tanks
    const { data: contents } = await supabase
        .from("intermediate_products")
        .select(`
            id, code, status, volume, unit, equipment_id,
            batch:production_batches(id, code, product:products(id, name))
        `)
        .in("status", ["pending", "approved", "in_use"]);

    const contentMap = new Map<string, TankContent>();
    contents?.forEach((c: any) => {
        if (c.equipment_id) contentMap.set(c.equipment_id, c);
    });

    return (
        <div className="container py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                        <Container className="h-8 w-8 text-blue-400" />
                        Gestão de Tanques
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Vista geral de tanques de armazenamento e seu conteúdo atual.
                    </p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Tanque
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass border-slate-800">
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-slate-100">{tanks?.length || 0}</div>
                        <div className="text-xs text-slate-500 mt-1">Total de Tanques</div>
                    </CardContent>
                </Card>
                <Card className="glass border-slate-800">
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-emerald-400">
                            {tanks?.filter(t => t.status === 'active').length || 0}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Ativos</div>
                    </CardContent>
                </Card>
                <Card className="glass border-slate-800">
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-blue-400">
                            {contentMap.size}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Com Conteúdo</div>
                    </CardContent>
                </Card>
                <Card className="glass border-slate-800">
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-amber-400">
                            {tanks?.filter(t => t.status === 'maintenance').length || 0}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Em Manutenção</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tanks Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tanks?.map((tank: Tank) => {
                    const content = contentMap.get(tank.id);
                    const batch = Array.isArray(content?.batch) ? content.batch[0] : content?.batch;
                    const product = Array.isArray(batch?.product) ? batch.product[0] : batch?.product;

                    return (
                        <Card key={tank.id} className="glass overflow-hidden border-slate-800/50 hover:border-blue-500/30 transition-all group">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Container className="h-4 w-4 text-blue-400" />
                                            {tank.name}
                                        </CardTitle>
                                        <CardDescription className="font-mono text-[10px] uppercase tracking-wider mt-1">
                                            {tank.code}
                                        </CardDescription>
                                    </div>
                                    <Badge className={statusColors[tank.status] || statusColors.active}>
                                        {tank.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Capacity */}
                                {tank.capacity && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Droplets className="h-4 w-4 text-slate-500" />
                                        <span className="text-slate-400">Capacidade:</span>
                                        <span className="font-bold text-slate-200">
                                            {tank.capacity.toLocaleString()} {tank.capacity_unit || 'L'}
                                        </span>
                                    </div>
                                )}

                                {/* Current Content */}
                                {content ? (
                                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">
                                            Conteúdo Atual
                                        </div>
                                        <div className="font-bold text-slate-100">
                                            {product?.name || "Produto Desconhecido"}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            Lote: <span className="font-mono text-blue-300">{batch?.code || content.code}</span>
                                            {content.volume && (
                                                <span className="ml-2">• {content.volume} {content.unit || 'L'}</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-center">
                                        <span className="text-xs text-slate-500 italic">Vazio</span>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <Link href={`/production/tanks/${tank.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full glass border-slate-700">
                                            <Settings2 className="h-3 w-3 mr-1" />
                                            Detalhes
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {(!tanks || tanks.length === 0) && (
                <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                    <Container className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                    <p className="text-slate-500 italic">Nenhum tanque configurado.</p>
                </div>
            )}
        </div>
    );
}
