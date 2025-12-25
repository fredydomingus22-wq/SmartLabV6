import { getOrganizationDetails, createPlantAction } from "@/app/actions/admin/tenants";
import { PageHeader } from "@/components/smart/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Building2,
    Factory,
    Users,
    ChevronLeft,
    Plus,
    Calendar,
    Globe,
    ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/smart/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrgDetailPageProps {
    params: { id: string };
}

export default async function OrgDetailPage({ params }: OrgDetailPageProps) {
    const res = await getOrganizationDetails(params.id);

    if (!res.success || !res.data) {
        return notFound();
    }

    const org = res.data;

    return (
        <div className="space-y-8 pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="hover:bg-slate-900 rounded-full">
                    <Link href="/saas/tenants">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-slate-100">{org.name}</h1>
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 capitalize">
                            {org.plan}
                        </Badge>
                    </div>
                    <p className="text-slate-400 text-sm flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1.5 font-mono">
                            <Globe className="h-3.5 w-3.5" /> {org.slug}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" /> Registado em {new Date(org.created_at).toLocaleDateString('pt-PT')}
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className={org.status === 'active' ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-100'}>
                        {org.status === 'active' ? 'Ativo' : 'Suspenso'}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Plants / Unidades */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 mb-4 bg-slate-900/40">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Factory className="h-5 w-5 text-indigo-400" />
                                    Unidades Operativas (Plantas)
                                </CardTitle>
                            </div>

                            <div className="flex items-center gap-2">
                                <ActionForm
                                    action={createPlantAction}
                                    submitText="Adicionar"
                                    onSuccess={() => { }} // Revalidate happens in action
                                    className="flex items-center gap-2"
                                >
                                    <input type="hidden" name="organization_id" value={org.id} />
                                    <Input
                                        name="name"
                                        placeholder="Nome da unidade..."
                                        className="h-9 w-48 bg-slate-900 border-slate-700 text-sm"
                                        required
                                    />
                                    <Button size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-700">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </ActionForm>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {org.plants?.length === 0 ? (
                                    <div className="col-span-2 py-10 text-center border border-dashed border-slate-800 rounded-xl">
                                        <p className="text-slate-500 text-sm">Nenhuma unidade configurada para esta organização.</p>
                                    </div>
                                ) : (
                                    org.plants?.map((plant: any) => (
                                        <div key={plant.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-slate-800">
                                                        <Building2 className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-100 text-sm">{plant.name}</h4>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">ID: {plant.id.split('-')[0]}</p>
                                                    </div>
                                                </div>
                                                <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 h-8 text-[10px] uppercase font-bold">Gerir</Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Users Section */}
                    <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 mb-4 bg-slate-900/40">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-400" />
                                Utilizadores Associados
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {org.user_profiles?.length === 0 ? (
                                    <p className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">Inexistente</p>
                                ) : (
                                    org.user_profiles?.map((user: any) => (
                                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 hover:bg-slate-900/40 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                                    {user.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-200">{user.full_name}</p>
                                                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                                                </div>
                                            </div>
                                            <Badge variant="ghost" className="text-[10px] text-slate-600">Context {user.plant_id ? 'Planta' : 'Global'}</Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="bg-slate-900/60 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Resumo de Quotas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Armazenamento</span>
                                    <span className="text-slate-200">0%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[2%]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Utilizadores</span>
                                    <span className="text-slate-200">{org.user_profiles?.length || 0} / 10</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-[50%]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-500/5 border-blue-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-semibold text-blue-200">Conformidade ISO</h4>
                                    <p className="text-xs text-blue-500/70 mt-1 leading-relaxed">
                                        Esta organização possui políticas de retenção de dados ativas e auditorias automáticas.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
