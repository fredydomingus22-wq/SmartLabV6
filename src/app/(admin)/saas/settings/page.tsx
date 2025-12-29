import { getGlobalSettings } from "@/app/actions/admin/stats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Cpu, ShieldCheck, Zap, Globe, Lock, Bell, Terminal, Activity, ChevronLeft, Home, Settings } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SaaSSettingsPage() {
    const res = await getGlobalSettings();

    if (!res.success || !res.data) {
        return notFound();
    }

    const { activeFunctions, globalToggles } = res.data;

    return (
        <div className="space-y-8 pb-20">
            {/* Futuristic Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 text-[10px] font-mono tracking-tighter uppercase font-bold">
                            Infrastructure Console
                        </Badge>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <Cpu className="h-8 w-8 text-blue-500" />
                        Orquestração Global
                    </h1>
                    <p className="text-slate-400 text-sm italic opacity-80 leading-relaxed max-w-2xl">
                        Controle central de automação, AI e segurança de infraestrutura para todo o cluster SmartLab.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-11 px-5" asChild>
                        <Link href="/saas">
                            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar à Consola
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Automation & Edge Functions */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                        <CardHeader className="border-b border-slate-800 bg-slate-900/20 px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Cpu className="h-5 w-5 text-indigo-400" />
                                        Edge Functions & AI Triggers
                                    </CardTitle>
                                    <CardDescription>Motor de inteligência distribuído para o SmartLab.</CardDescription>
                                </div>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 font-mono text-[10px] uppercase">
                                    Cluster Online
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-800">
                                {activeFunctions.map((fn: any, i: number) => (
                                    <div key={i} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400">
                                                <Zap className="h-5 w-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-slate-100">{fn.name}</h4>
                                                <p className="text-xs text-slate-500 font-mono">Slug: {fn.slug}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="secondary" className="text-[9px] bg-slate-800 text-slate-400 uppercase tracking-tighter">
                                                        Trigger: {fn.triggers}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Uptime</p>
                                                <p className="text-xs text-emerald-400 font-mono">100%</p>
                                            </div>
                                            <Switch defaultChecked={fn.status === 'ACTIVE'} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Infrastructure Toggles */}
                    <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                        <CardHeader className="border-b border-slate-800 bg-slate-900/20 px-6 py-5">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-blue-400" />
                                Segurança Global & Governança
                            </CardTitle>
                            <CardDescription>Políticas de restrição aplicadas a todos os níveis.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {[
                                { label: "Modo de Manutenção", sub: "Bloqueia acesso a todos os utilizadores não-admin", icon: Settings, checked: globalToggles.maintenanceMode },
                                { label: "Auto-Registo de Organizações", sub: "Permite que novos clientes criem contas trial", icon: Globe, checked: globalToggles.allowSelfRegistration },
                                { label: "MFA Obrigatório (Global)", sub: "Força autenticação de dois fatores", icon: Lock, checked: globalToggles.enforceMFA }
                            ].map((toggle, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-800/50 hover:bg-slate-900/40 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 rounded-lg bg-slate-800 text-slate-500">
                                            <Activity className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">{toggle.label}</p>
                                            <p className="text-xs text-slate-500">{toggle.sub}</p>
                                        </div>
                                    </div>
                                    <Switch defaultChecked={toggle.checked} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Context */}
                <div className="space-y-6">
                    <Card className="bg-slate-900/40 border-slate-800 overflow-hidden">
                        <CardHeader className="bg-blue-600/10 border-b border-blue-500/10">
                            <CardTitle className="text-xs font-mono text-blue-400 uppercase tracking-widest font-black">Cluster Health</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full border-4 border-blue-500/10 border-t-blue-500 flex items-center justify-center">
                                    <Activity className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-200">Load Factor</p>
                                    <p className="text-2xl font-black text-white">0.42 <span className="text-[10px] text-slate-500 font-normal">req/s</span></p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/20 border-slate-800 border-dashed">
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center text-center gap-3">
                                <Bell className="h-8 w-8 text-slate-700" />
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Alertas de Sistema</h4>
                                <p className="text-xs text-slate-600 leading-relaxed italic">
                                    Nenhuma anomalia detetada nos últimos 14 dias de operação contínua.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
