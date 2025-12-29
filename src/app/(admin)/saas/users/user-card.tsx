"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    User,
    MoreHorizontal,
    Trash2,
    Mail,
    ShieldCheck,
    Building2,
    Calendar,
    KeyRound
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteGlobalUserAction } from "@/app/actions/admin/users";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type GlobalUser = {
    id: string;
    full_name: string;
    role: string;
    organization_id: string;
    plant_id: string | null;
    created_at: string;
    organizations?: { name: string; slug: string };
    plants?: { name: string };
};

interface UserCardProps {
    user: GlobalUser;
}

export function UserCard({ user }: UserCardProps) {
    const handleDelete = async () => {
        if (!confirm(`Tem a certeza que deseja remover o utilizador ${user.full_name}? esta ação é irreversível.`)) return;

        const res = await deleteGlobalUserAction(user.id);
        if (res.success) {
            toast.success(res.message);
        } else {
            toast.error(res.message);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'system_owner': return "text-red-400 bg-red-500/10 border-red-500/20";
            case 'admin': return "text-blue-400 bg-blue-500/10 border-blue-500/20";
            case 'qa_manager': return "text-purple-400 bg-purple-500/10 border-purple-500/20";
            case 'lab_tech': return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
            default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
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
                {/* Decorative Background Glow */}
                <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-blue-500/5 blur-[40px] rounded-full pointer-events-none" />

                <CardHeader className="pb-4 relative z-10">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative group/avatar">
                                <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                                <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-blue-400 shadow-xl overflow-hidden">
                                    <User className="h-6 w-6" />
                                    {/* Sub-badge for role icon */}
                                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-lg bg-blue-600 border-2 border-slate-950 flex items-center justify-center">
                                        <ShieldCheck className="h-3 w-3 text-white" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                    {user.full_name}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={cn(
                                        "text-[9px] px-1.5 py-0 border capitalize font-bold tracking-tighter",
                                        getRoleBadgeColor(user.role)
                                    )}>
                                        {user.role.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass border-white/10 text-slate-200 min-w-[180px]">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-500">Gestão de Identidade</DropdownMenuLabel>
                                <DropdownMenuItem className="cursor-pointer focus:bg-white/5 py-2">
                                    <KeyRound className="h-4 w-4 text-amber-400 mr-2" /> Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    disabled={user.role === 'system_owner'}
                                    className="cursor-pointer focus:bg-red-500/10 text-red-400 py-2"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" /> Remover Conta
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="relative z-10 space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                            <Building2 className="h-4 w-4 text-blue-500/50" />
                            <span className="truncate">
                                {user.organizations?.name || "Global / SmartLab"}
                                {user.plants?.name && <span className="text-slate-600 mx-1">/</span>}
                                <span className="text-slate-500">{user.plants?.name}</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-slate-400">
                            <Mail className="h-4 w-4 text-blue-500/50" />
                            <span className="truncate italic opacity-70">Conta Auth Ativa</span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                <Calendar className="h-3 w-3" /> Criado em {new Date(user.created_at).toLocaleDateString('pt-PT')}
                            </div>
                            <div className="flex items-center gap-1.5 p-1 px-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Verified</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
