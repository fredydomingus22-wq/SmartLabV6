import { PageHeader } from "@/components/smart/page-header";
import { StatCard } from "@/components/smart/stat-card";
import { Building2, Users, Factory, Activity, Globe, ShieldAlert, Search } from "lucide-react";
import { getGlobalStats } from "@/app/actions/admin/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default async function AdminDashboardPage() {
    const statsResponse = await getGlobalStats();
    const isServiceRoleConfigured = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Safety check for stats data
    const stats = statsResponse.success && statsResponse.data ? statsResponse.data : {
        totalOrganizations: 0,
        totalUsers: 0,
        totalPlants: 0,
        systemStatus: 'Stable'
    };

    return (
        <div className="space-y-8 pb-10">
            {!isServiceRoleConfigured && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-3 animate-pulse">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <span><strong>Atenção:</strong> Configuração `SUPABASE_SERVICE_ROLE_KEY` em falta no ambiente. Ações administrativas globais estão limitadas.</span>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Consola Global do Sistema"
                    description="Gestão centralizada da plataforma SmartLab SaaS"
                />
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        <Input
                            placeholder="Procurar organização..."
                            className="pl-9 w-64 bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-full"
                        />
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-inner">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span className="text-xs font-medium text-slate-300 uppercase tracking-widest">Sistema Operacional</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Organizações"
                    value={stats.totalOrganizations}
                    icon={Building2}
                    description="Clientes ativos no ecossistema"
                    className="border-blue-500/20 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                />
                <StatCard
                    title="Utilizadores Totais"
                    value={stats.totalUsers}
                    icon={Users}
                    description="Em todas as organizações"
                    className="border-indigo-500/10 bg-indigo-500/5"
                />
                <StatCard
                    title="Unidades Operativas"
                    value={stats.totalPlants}
                    icon={Factory}
                    description="Total de unidades em todas as orgs"
                    className="border-slate-800 bg-slate-900/20"
                />
                <StatCard
                    title="Estado Global"
                    value={stats.systemStatus}
                    icon={Activity}
                    description="Monitorização de uptime"
                    trend="Stable"
                    trendUp={true}
                    className="border-emerald-500/20 bg-emerald-500/5"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors duration-500" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-100">
                            <Globe className="h-5 w-5 text-blue-400" />
                            Ações SaaS Rápidas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/saas/tenants" className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-300 group/item">
                            <h4 className="font-semibold text-sm mb-1 group-hover/item:text-blue-400 transition-colors">Nova Organização</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">Configurar nova empresa e owner principal.</p>
                        </Link>
                        <Link href="/saas/plans" className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all duration-300 group/item">
                            <h4 className="font-semibold text-sm mb-1 group-hover/item:text-purple-400">Gestão de Planos</h4>
                            <p className="text-xs text-slate-400">Configurar limites e tiers de serviço.</p>
                        </Link>
                        <Link href="/saas/billing" className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-300 group/item">
                            <h4 className="font-semibold text-sm mb-1 group-hover/item:text-emerald-400">Faturação Global</h4>
                            <p className="text-xs text-slate-400">Relatórios de quota e usage mensal.</p>
                        </Link>
                        <Link href="/saas/plants" className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-300 group/item">
                            <h4 className="font-semibold text-sm mb-1 group-hover/item:text-amber-400">Unidades Globais</h4>
                            <p className="text-xs text-slate-400">Visão consolidada de todas as plantas.</p>
                        </Link>
                        <Link href="/saas/audit" className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all duration-300 group/item">
                            <h4 className="font-semibold text-sm mb-1 group-hover/item:text-indigo-400">Audit Trail</h4>
                            <p className="text-xs text-slate-400">Rastreabilidade total do sistema.</p>
                        </Link>
                        <Link href="/saas/settings" className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-300 group/item">
                            <h4 className="font-semibold text-sm mb-1 group-hover/item:text-blue-400">Infraestrutura</h4>
                            <p className="text-xs text-slate-400">Configurações de rede e segurança.</p>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-100">
                            <ShieldAlert className="h-5 w-5 text-amber-400" />
                            Segurança & Alertas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-200">Manutenção Planeada</p>
                                    <p className="text-xs text-amber-500/60 leading-relaxed">Upgrade do core da base de dados agendado para o próximo ciclo de baixa carga.</p>
                                </div>
                            </div>
                            <div className="px-4 py-8 rounded-xl border border-dashed border-slate-800 text-center">
                                <Activity className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                                <p className="text-xs text-slate-500 font-medium">Todos os sistemas em conformidade</p>
                                <p className="text-[10px] text-slate-600 uppercase mt-1 tracking-tighter">Última auditoria há 12m</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
