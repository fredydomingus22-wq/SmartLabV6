"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Building2,
    MoreHorizontal,
    Power,
    CreditCard,
    ArrowUpRight,
    Factory,
    Calendar,
    ChevronRight
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateTenantStatusAction } from "@/app/actions/admin/tenants";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type Tenant = {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    created_at: string;
    plants_count?: number;
};

interface TenantCardProps {
    tenant: Tenant;
}

export function TenantCard({ tenant }: TenantCardProps) {
    const toggleStatus = async () => {
        const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
        const res = await updateTenantStatusAction(tenant.id, newStatus);
        if (res.success) {
            toast.success(res.message);
        } else {
            toast.error(res.message);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="glass group relative overflow-hidden border-white/5 hover:border-blue-500/20 transition-all duration-500 shadow-2xl bg-gradient-to-br from-white/[0.03] to-transparent">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                {/* Status Indicator Glow */}
                <div className={cn(
                    "absolute top-0 right-0 w-24 h-24 blur-[60px] rounded-full -mr-12 -mt-12 transition-all duration-500",
                    tenant.status === 'active' ? "bg-emerald-500/10 group-hover:bg-emerald-500/20" : "bg-red-500/10 group-hover:bg-red-500/20"
                )} />

                <CardHeader className="pb-4 relative z-10">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform duration-500">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                    {tenant.name}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{tenant.slug}</span>
                                    <Badge variant="outline" className={cn(
                                        "text-[9px] px-1.5 py-0 border-none capitalize font-bold",
                                        tenant.plan === 'pro' && "text-purple-400 bg-purple-500/10",
                                        tenant.plan === 'enterprise' && "text-blue-400 bg-blue-500/10",
                                        tenant.plan === 'trial' && "text-amber-400 bg-amber-500/10"
                                    )}>
                                        {tenant.plan}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-white/5 rounded-full">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass border-white/10 text-slate-200 min-w-[180px]">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-500">Operações</DropdownMenuLabel>
                                <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/5 py-2">
                                    <Link href={`/saas/tenants/${tenant.id}`} className="w-full flex items-center gap-2">
                                        <ArrowUpRight className="h-4 w-4 text-blue-400" /> Ver Detalhes
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer focus:bg-white/5 py-2">
                                    <CreditCard className="h-4 w-4 text-purple-400" /> Alterar Plano
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem
                                    onClick={toggleStatus}
                                    className={cn(
                                        "cursor-pointer focus:bg-white/5 py-2",
                                        tenant.status === 'active' ? "text-red-400" : "text-emerald-400"
                                    )}
                                >
                                    <Power className="h-4 w-4" />
                                    {tenant.status === 'active' ? 'Suspender Org' : 'Ativar Org'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="relative z-10 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
                                <Factory className="h-3 w-3" /> Unidades
                            </div>
                            <div className="text-xl font-bold text-slate-200">
                                {tenant.plants_count || 0}
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
                                <Calendar className="h-3 w-3" /> Desde
                            </div>
                            <div className="text-sm font-bold text-slate-200">
                                {new Date(tenant.created_at).toLocaleDateString('pt-PT')}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "h-1.5 w-1.5 rounded-full animate-pulse",
                                tenant.status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500"
                            )} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{tenant.status}</span>
                        </div>
                        <Link
                            href={`/saas/tenants/${tenant.id}`}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 group/link transition-colors"
                        >
                            ACEDER REGISTOS
                            <ChevronRight className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
