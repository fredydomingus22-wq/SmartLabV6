import { getOrganizationDetails, createPlantAction } from "@/app/actions/admin/tenants";
import { PageHeader } from "@/components/smart/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Building2,
    Factory,
    Users,
    ChevronLeft,
    Plus,
    Calendar,
    Globe,
    ShieldCheck,
    Palette,
    Settings,
    LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreatePlantDialog } from "../create-plant-dialog";
import { UpdatePlantDialog } from "../update-plant-dialog";
import { UpdateUserDialog } from "../../users/update-user-dialog";
import { CreateGlobalUserDialog } from "../../users/create-user-dialog";
import { BrandingForm } from "./branding-form";

interface OrgDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function OrgDetailPage({ params }: OrgDetailPageProps) {
    const { id } = await params;
    const res = await getOrganizationDetails(id);

    if (!res.success || !res.data) {
        return notFound();
    }

    const org = res.data;

    return (
        <div className="space-y-8 pb-10">
            {/* Minimal Header */}
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
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className={org.status === 'active' ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-100'}>
                        {org.status === 'active' ? 'Ativo' : 'Suspenso'}
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-slate-950/40 border border-slate-800 p-1">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        <LayoutDashboard className="h-4 w-4 mr-2" /> Visão Geral
                    </TabsTrigger>
                    <TabsTrigger value="plants" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        <Factory className="h-4 w-4 mr-2" /> Unidades
                    </TabsTrigger>
                    <TabsTrigger value="users" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        <Users className="h-4 w-4 mr-2" /> Utilizadores
                    </TabsTrigger>
                    <TabsTrigger value="branding" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        <Palette className="h-4 w-4 mr-2" /> Branding & Config
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden min-h-[400px]">
                                <CardHeader className="border-b border-slate-800 mb-6 bg-slate-900/20">
                                    <CardTitle className="text-lg">Infraestrutura do Tenant</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Plantas</p>
                                            <p className="text-2xl font-black text-white">{org.plants?.length || 0}</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Colaboradores</p>
                                            <p className="text-2xl font-black text-white">{org.user_profiles?.length || 0}</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Estado</p>
                                            <p className="text-2xl font-black text-emerald-400">Verificado</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Plus className="h-4 w-4" /> Atividade Recente
                                        </h4>
                                        <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                                            <div className="p-4 flex items-center justify-between text-xs bg-slate-900/20">
                                                <span className="text-slate-400">Última Auditoria</span>
                                                <span className="text-slate-200">Há 5 horas</span>
                                            </div>
                                            <div className="p-4 flex items-center justify-between text-xs">
                                                <span className="text-slate-400">Criação do Tenant</span>
                                                <span className="text-slate-200">{new Date(org.created_at).toLocaleDateString('pt-PT')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="bg-slate-900/60 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Quotas do Plano</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Utilizadores</span>
                                            <span className="text-slate-200">{org.user_profiles?.length || 0} / 10</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 w-[10%]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Unidades</span>
                                            <span className="text-slate-200">{org.plants?.length || 0} / 3</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-[33%]" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-blue-500/5 border-blue-500/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-blue-200">ISO 27001 Readiness</h4>
                                            <p className="text-xs text-blue-500/70 mt-1 leading-relaxed">
                                                Políticas de retenção e encriptação de dados ativas.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="plants">
                    <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 mb-6 bg-slate-900/20">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Factory className="h-5 w-5 text-indigo-400" />
                                Unidades Operativas
                            </CardTitle>
                            <CreatePlantDialog organizationId={org.id} />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {org.plants?.length === 0 ? (
                                    <div className="col-span-full py-10 text-center border border-dashed border-slate-800 rounded-xl">
                                        <p className="text-slate-500 text-sm">Nenhuma unidade configurada.</p>
                                    </div>
                                ) : (
                                    org.plants?.map((plant: any) => (
                                        <div key={plant.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-slate-800/50">
                                                        <Building2 className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-100 text-sm">{plant.name}</h4>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">ID: {plant.code || plant.id.split('-')[0]}</p>
                                                    </div>
                                                </div>
                                                <UpdatePlantDialog plant={plant} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users">
                    <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 mb-6 bg-slate-900/20">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-400" />
                                Gestão de Identidades
                            </CardTitle>
                            <CreateGlobalUserDialog
                                tenants={[org]}
                                defaultOrganizationId={org.id}
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {org.user_profiles?.length === 0 ? (
                                    <p className="text-center py-6 text-slate-500 text-sm">Nenhum utilizador encontrado.</p>
                                ) : (
                                    org.user_profiles?.map((user: any) => (
                                        <div key={user.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-800/50 hover:bg-slate-900/40 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-xs font-bold text-slate-400 border border-white/5 shadow-lg">
                                                    {user.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-100">{user.full_name}</p>
                                                    <Badge variant="outline" className="text-[8px] uppercase tracking-tighter h-4 mt-1 bg-white/5">
                                                        {user.role}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-[10px] text-slate-500 uppercase font-mono">Scope</p>
                                                    <p className="text-xs text-slate-300 font-bold">{user.plant_id ? 'Unidade' : 'Global'}</p>
                                                </div>
                                                <UpdateUserDialog
                                                    user={user}
                                                    organizations={[org]}
                                                    plants={org.plants}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="branding">
                    <BrandingForm organization={org} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
