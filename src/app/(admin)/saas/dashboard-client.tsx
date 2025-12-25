"use client";

import { Building2, Users, Activity, Globe, ShieldAlert, Search, ArrowUpRight, Cpu, Layers, ShieldCheck, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion } from "framer-motion";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

interface DashboardClientProps {
    stats: {
        totalOrganizations: number;
        totalUsers: number;
        totalPlants: number;
        systemStatus: string;
        recentLogs?: any[];
    };
    isServiceRoleConfigured: boolean;
}

export function DashboardClient({ stats, isServiceRoleConfigured }: DashboardClientProps) {
    const recentLogs = stats.recentLogs || [];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-10 pb-20 relative"
        >
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 -right-24 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

            {!isServiceRoleConfigured && (
                <motion.div variants={item} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-3 animate-pulse relative z-10">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <span><strong>Atenção:</strong> CONFIG_ERROR: Chave de Service Role não detetada. O sistema está em modo de leitura limitada.</span>
                </motion.div>
            )}

            {/* Futuristic Header */}
            <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 text-[10px] font-mono tracking-tighter uppercase font-bold">
                            Live Infrastructure
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase opacity-50">Production Ready</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <Cpu className="h-8 w-8 text-blue-500" />
                        Consola <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">SaaS</span>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium italic opacity-80 leading-relaxed">
                        Orquestração global em tempo real do ecossistema industrial SmartLab.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-all duration-300" />
                        <Input
                            placeholder="Procurar instância..."
                            className="pl-11 pr-4 py-6 w-72 bg-white/5 border-white/10 focus:border-blue-500/30 transition-all rounded-2xl backdrop-blur-md shadow-2xl text-sm"
                        />
                    </div>
                </div>
            </motion.div>

            {/* High-Tech Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {[
                    { label: "Organizações", value: stats.totalOrganizations, icon: Building2, color: "blue", desc: "Instâncias Provisionadas" },
                    { label: "Utilizadores", value: stats.totalUsers, icon: Users, color: "indigo", desc: "Contas Auth Ativas" },
                    { label: "Unidades", value: stats.totalPlants, icon: Layers, color: "purple", desc: "Plantas em Operação" },
                    { label: "Uptime Mensal", value: "99.98%", icon: Activity, color: "emerald", desc: "Estado: Operacional" },
                ].map((stat, i) => (
                    <motion.div key={i} variants={item}>
                        <Card className="glass group overflow-hidden border-white/5 hover:border-white/10 transition-all duration-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.05)]">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/40 group-hover:w-1.5 transition-all" />
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-500 flex items-center justify-between">
                                    {stat.label}
                                    <stat.icon className="h-4 w-4 text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-white tracking-tighter mb-1 font-mono">
                                    {stat.value}
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{stat.desc}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Central Navigation Hub */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
                <motion.div variants={item} className="xl:col-span-2">
                    <Card className="glass border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden">
                        <CardHeader className="border-b border-white/5 pb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-blue-400" />
                                        Navegação de Sistema
                                    </CardTitle>
                                    <CardDescription>Gestão centralizada de ativos e identidades.</CardDescription>
                                </div>
                                <Link href="/saas/audit" className="text-[10px] font-mono p-2 px-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors uppercase tracking-widest text-slate-400 font-bold">
                                    Audit Trail Completo
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-y divide-white/5">
                                {[
                                    { label: "Organizações", path: "/saas/tenants", icon: Building2, sub: "Registar novas empresas e plantas", color: "blue" },
                                    { label: "Identidade & Acessos", path: "/saas/users", icon: ShieldCheck, sub: "Gerir contas Auth e perfis globais", color: "purple" },
                                    { label: "Planos & Tiers", path: "/saas/plans", icon: Layers, sub: "Definir limites e funcionalidades", color: "emerald" },
                                    { label: "Infraestrutura", path: "/saas/settings", icon: Cpu, sub: "Configurações de rede e segurança", color: "amber" }
                                ].map((action, i) => (
                                    <Link key={i} href={action.path} className="group/btn p-8 hover:bg-white/[0.02] transition-all relative overflow-hidden">
                                        <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover/btn:w-full bg-blue-500/50 transition-all duration-700" />
                                        <div className="flex items-start gap-4">
                                            <div className="p-4 rounded-2xl bg-slate-900/50 text-blue-400 group-hover/btn:scale-110 transition-transform duration-500 border border-white/5">
                                                <action.icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-white font-bold mb-1 flex items-center gap-2 group-hover/btn:text-blue-400 transition-colors">
                                                    {action.label}
                                                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover/btn:opacity-50 transition-all translate-y-1 group-hover/btn:translate-y-0" />
                                                </h4>
                                                <p className="text-xs text-slate-500 leading-relaxed">{action.sub}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Real-time System Logs */}
                <motion.div variants={item} className="space-y-6">
                    <Card className="glass border-white/5 overflow-hidden">
                        <CardHeader className="pb-2 border-b border-white/5 mb-4">
                            <CardTitle className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold flex items-center justify-between">
                                Eventos Recentes
                                <span className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" />
                                    Live
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {recentLogs.length > 0 ? (
                                recentLogs.map((log, i) => (
                                    <div key={i} className="flex items-start gap-3 group/log border-b border-white/[0.02] pb-4 last:border-0 last:pb-0">
                                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 mt-0.5">
                                            <Activity className="h-3 w-3 text-slate-400" />
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-tight truncate">
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-mono text-slate-500 uppercase truncate max-w-[120px]">
                                                    ID: {log.entity_id?.slice(0, 8) || 'SYSTEM'}
                                                </span>
                                                <span className="text-[9px] font-mono text-blue-500/50">
                                                    {new Date(log.created_at).toLocaleTimeString('pt-PT')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Sem logs recentes</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="glass border-emerald-500/20 bg-emerald-500/[0.02]">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-200 uppercase tracking-widest">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                Integridade
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center text-[10px] font-black text-emerald-400">
                                    100%
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-emerald-100">Criptografia Base-Layer</p>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-tighter mt-0.5">All protocols are secure</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Terminal Style Footer */}
            <motion.div variants={item} className="pt-10 flex items-center justify-between border-t border-white/5 opacity-40 relative z-10">
                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 tracking-tighter uppercase font-bold">
                    <span>SmartLab OS v6.2.0-LTS</span>
                    <span className="h-3 w-[1px] bg-white/10" />
                    <span>User: System_Owner</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Verificação Biométrica Ativa</span>
                </div>
            </motion.div>
        </motion.div>
    );
}
