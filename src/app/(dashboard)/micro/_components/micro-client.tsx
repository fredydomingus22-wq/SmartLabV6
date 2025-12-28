"use client";

import { motion } from "framer-motion";
import { Microscope, ThermometerSun, ClipboardCheck, History, ArrowLeft, Target, Beaker, Database, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MicroDashboardProps {
    kpis: {
        incubating: number;
        pendingReading: number;
        completedToday: number;
    };
    activities: any[];
}

export function MicroDashboardClient({ kpis, activities }: MicroDashboardProps) {
    const stats = [
        { label: "Em Incubação", value: kpis.incubating, icon: ThermometerSun, color: "text-orange-400", bg: "from-orange-500/10" },
        { label: "Pendentes de Leitura", value: kpis.pendingReading, icon: ClipboardCheck, color: "text-rose-400", bg: "from-rose-500/10" },
        { label: "Concluídas Hoje", value: kpis.completedToday, icon: History, color: "text-emerald-400", bg: "from-emerald-500/10" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Premium Header */}
            <div className="glass p-8 rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-purple-500/10 via-slate-900/50 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-4 rounded-3xl bg-purple-500/20 border border-purple-500/30">
                            <Microscope className="h-8 w-8 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                                Microbiologia
                            </h1>
                            <p className="text-slate-400 font-medium">
                                Controlo de incubação, leituras e conformidade microbiológica
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/micro/samples">
                            <Button className="glass-primary rounded-2xl h-12 px-8 font-bold">
                                <Zap className="h-4 w-4 mr-2" />
                                Registar Amostra
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Premium KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className={cn(
                            "glass p-6 rounded-3xl border-slate-800/50 relative overflow-hidden group hover:border-purple-500/20 transition-all",
                            "bg-gradient-to-br", stat.bg, "to-transparent"
                        )}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn("p-3 rounded-2xl bg-slate-950/50 border border-slate-800 group-hover:scale-110 transition-transform", stat.color)}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <span className={cn("text-4xl font-black tracking-tighter", stat.color)}>
                                {stat.value}
                            </span>
                        </div>
                        <p className="text-xs uppercase font-bold tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">
                            {stat.label}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Activities Table/List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 glass border-none shadow-xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-slate-800/50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold">Incubações Recentes</CardTitle>
                            <CardDescription>Últimas sessões iniciadas no laboratório</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-purple-400">Ver Todas</Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {activities.length === 0 ? (
                            <div className="p-20 text-center">
                                <Database className="h-10 w-10 mx-auto mb-4 text-slate-800" />
                                <p className="text-slate-500 font-medium italic">Sem incubações ativas no momento.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800/30">
                                {activities.map((activity: any) => (
                                    <div key={activity.id} className="p-6 hover:bg-slate-800/20 transition-all group flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800 group-hover:border-purple-500/30 transition-colors">
                                                <Beaker className="h-4 w-4 text-purple-400/60" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-200 group-hover:text-white transition-colors">
                                                    Incubadora: {activity.micro_incubators?.name || "N/D"}
                                                </div>
                                                <div className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mt-0.5">
                                                    Início: {new Date(activity.created_at).toLocaleString('pt-PT')}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className="bg-purple-500/10 text-purple-400 border-none capitalize px-4 rounded-full font-bold text-[10px]">
                                            {activity.status.replace("_", " ")}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="glass border-none shadow-xl rounded-[2rem] p-6 bg-gradient-to-br from-blue-500/5 to-transparent">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Acesso Rápido
                        </h3>
                        <div className="grid gap-2">
                            {[
                                { label: "Leituras Pendentes", path: "/micro/reading", icon: ClipboardCheck },
                                { label: "Gestão de Meios", path: "/micro/media", icon: Beaker },
                                { label: "Configuração", path: "/micro/configuration/media-types", icon: Database }
                            ].map((item, idx) => (
                                <Link key={idx} href={item.path}>
                                    <Button variant="ghost" className="w-full justify-start h-12 rounded-xl group hover:bg-slate-800/50 px-4">
                                        <item.icon className="h-4 w-4 mr-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                        <span className="font-bold text-slate-400 group-hover:text-slate-200">{item.label}</span>
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
