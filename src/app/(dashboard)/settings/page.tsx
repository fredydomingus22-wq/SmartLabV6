import Link from "next/link";
import { History, Users, Building2, Wrench, ArrowRight, ShieldCheck, Database, LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

const settingsItems = [
    {
        href: "/settings/audit-logs",
        icon: History,
        title: "Logs de Auditoria",
        description: "Rastreabilidade total e histórico de mutações do sistema",
        variant: "blue" as const
    },
    {
        href: "/settings/users",
        icon: Users,
        title: "Gestão de Utilizadores",
        description: "Controle de acessos, perfis e permissões RBAC",
        variant: "purple" as const
    },
    {
        href: "/settings/plant",
        icon: Building2,
        title: "Configuração de Planta",
        description: "Definição de hierarquia organizacional e ativos",
        variant: "emerald" as const
    },
];

export default function SettingsPage() {
    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <PageHeader
                title="Configurações do Sistema"
                description="Painel de controlo administrativo e parâmetros globais do SmartLab"
                icon={<Wrench className="h-4 w-4" />}
                variant="slate"
            />

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {settingsItems.map((item) => (
                    <Link key={item.href} href={item.href} className="group outline-none">
                        <div className="relative p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 glass h-full flex flex-col justify-between transition-all duration-500 hover:border-white/20 hover:bg-slate-900/60 overflow-hidden">
                            <div className={cn(
                                "absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:w-48 group-hover:h-48",
                                item.variant === "blue" && "bg-blue-500/5 group-hover:bg-blue-500/10",
                                item.variant === "purple" && "bg-purple-500/5 group-hover:bg-purple-500/10",
                                item.variant === "emerald" && "bg-emerald-500/5 group-hover:bg-emerald-500/10"
                            )} />

                            <div className="relative z-10 space-y-6">
                                <div className={cn(
                                    "p-4 rounded-2xl border transition-all inline-flex",
                                    item.variant === "blue" && "bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-500/20",
                                    item.variant === "purple" && "bg-purple-500/10 border-purple-500/20 text-purple-400 group-hover:bg-purple-500/20",
                                    item.variant === "emerald" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20"
                                )}>
                                    <item.icon className="h-6 w-6" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight group-hover:translate-x-1 transition-transform">{item.title}</h3>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>

                            <div className="relative z-10 pt-8 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Industrial Standard</span>
                                </div>
                                <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:border-white/10 group-hover:bg-white/10 transition-all">
                                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white" />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Support section or extra info */}
            <div className="rounded-[2.5rem] border border-white/5 bg-slate-900/20 p-12 flex flex-col md:flex-row items-center gap-12 glass overflow-hidden relative">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-500/5 blur-[100px] -ml-32 -mb-32 rounded-full" />

                <div className="flex-1 space-y-6 relative z-10">
                    <div className="flex items-center gap-2 px-1">
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Segurança e Conformidade</h2>
                    </div>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Todas as alterações de configuração são registradas permanentemente para fins de auditoria e conformidade regulatória (CFR Part 11). Certifique-se de que possui as autorizações necessárias antes de modificar parâmetros críticos.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                            <Database className="h-4 w-4 text-blue-400" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Postgres DB</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                            <LayoutGrid className="h-4 w-4 text-purple-400" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">RBAC Enabled</span>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-64 relative group">
                    <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full opacity-50" />
                    <div className="p-8 rounded-[2rem] border border-white/5 bg-slate-950/50 glass relative z-10 text-center space-y-4">
                        <Wrench className="h-12 w-12 text-slate-700 mx-auto group-hover:rotate-12 transition-transform duration-500" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">System v6.2.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
