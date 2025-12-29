import { getAllTenantsAction } from "@/app/actions/admin/tenants";
import { PageHeader } from "@/components/smart/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Factory, Building2, MapPin, ArrowRight, ChevronLeft, Home } from "lucide-react";
import Link from "next/link";

export default async function GlobalPlantsPage() {
    const res = await getAllTenantsAction();
    const organizations = res.data || [];

    // Flatten all plants from all organizations
    const allPlants = organizations.flatMap(org =>
        (org.plants || []).map((plant: any) => ({
            ...plant,
            organization_name: org.name,
            organization_slug: org.slug
        }))
    );

    return (
        <div className="space-y-8">
            {/* Futuristic Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 text-[10px] font-mono tracking-tighter uppercase font-bold">
                            Asset Visibility
                        </Badge>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <Factory className="h-8 w-8 text-indigo-500" />
                        Unidades Operativas
                    </h1>
                    <p className="text-slate-400 text-sm italic opacity-80 leading-relaxed max-w-2xl">
                        Visão consolidada de todas as plantas e centros logísticos do ecossistema SmartLab em tempo real.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-11 px-5" asChild>
                        <Link href="/saas/tenants">
                            <Building2 className="mr-2 h-4 w-4 text-slate-400" /> Ver Organizações
                        </Link>
                    </Button>
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-11 px-5" asChild>
                        <Link href="/saas">
                            <ChevronLeft className="mr-2 h-4 w-4 text-slate-400" /> Voltar à Consola
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allPlants.length === 0 ? (
                    <Card className="col-span-full bg-slate-900/40 border-slate-800 border-dashed py-20 text-center">
                        <p className="text-slate-500">Nenhuma unidade operacional registada no sistema.</p>
                    </Card>
                ) : (
                    allPlants.map((plant: any) => (
                        <Card key={plant.id} className="bg-slate-900/40 border-slate-800 hover:border-indigo-500/50 transition-all group overflow-hidden">
                            <CardContent className="p-0">
                                <div className="p-5 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                                <Factory className="h-5 w-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-100">{plant.name}</h3>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                                    <Building2 className="h-3 w-3" /> {plant.organization_name}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                                            {plant.id.split('-')[0]}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <MapPin className="h-3.5 w-3.5" />
                                            <span className="truncate">{plant.timezone || 'Timezone não definido'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Badge className="bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px] h-5">
                                                Active
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900/60 border-t border-slate-800 flex items-center justify-between px-5 py-3">
                                    <span className="text-[10px] text-slate-500">Registada em {new Date(plant.created_at).toLocaleDateString()}</span>
                                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs gap-1 group-hover:text-indigo-400">
                                        <Link href={`/saas/tenants/${plant.organization_id}`}>
                                            Ver Org <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
