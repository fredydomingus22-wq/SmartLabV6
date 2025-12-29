import { getRoleMatrixAction } from "@/app/actions/admin/diagnostics";
import { RolesClient } from "./roles-client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Home, ShieldCheck, Activity } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default async function SaasRolesPage() {
    const res = await getRoleMatrixAction();

    if (!res.success || !res.data) {
        return notFound();
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-slate-900 rounded-full">
                        <Link href="/saas">
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Link href="/saas" className="hover:text-slate-300 transition-colors flex items-center gap-1">
                            <Home className="h-3 w-3" /> SaaS
                        </Link>
                        <span>/</span>
                        <span className="text-slate-300 font-medium tracking-tight">Controlo de Acessos (RBAC)</span>
                    </div>
                </div>
            </div>

            {/* Futuristic Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 text-[10px] font-mono tracking-tighter uppercase font-bold">
                            Authorization Engine
                        </Badge>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-indigo-500" />
                        Permissões & RBAC
                    </h1>
                    <p className="text-slate-400 text-sm italic opacity-80 leading-relaxed max-w-2xl">
                        Configuração granular de privilégios e matriz de acessos para todos os níveis do ecossistema SmartLab.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" asChild className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl">
                        <Link href="/saas">
                            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar à Consola
                        </Link>
                    </Button>
                </div>
            </div>

            <RolesClient initialOverrides={res.data} />
        </div>
    );
}
