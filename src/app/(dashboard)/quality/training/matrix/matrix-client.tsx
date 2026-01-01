"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatrixProps {
    data: {
        users: any[];
        modules: any[];
    };
}

export default function TrainingMatrixClient({ data }: MatrixProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredUsers = data.users.filter(u =>
        u.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.job_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusCell = (statusObj: any) => {
        if (!statusObj) return <span className="text-slate-700 font-bold">—</span>;

        switch (statusObj.status) {
            case 'completed':
                return (
                    <div className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <span className="text-[10px] font-black uppercase tracking-tight">Qualificado</span>
                    </div>
                );
            case 'overdue':
                return (
                    <div className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400">
                        <span className="text-[10px] font-black uppercase tracking-tight">Vencido</span>
                    </div>
                );
            case 'in_progress':
                return (
                    <div className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <span className="text-[10px] font-black uppercase tracking-tight">Cursando</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-slate-500">
                        <span className="text-[10px] font-black uppercase tracking-tight">Atribuído</span>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-blue-400 font-bold mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] uppercase tracking-[0.2em]">Audit Ready Matrix</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                        Matriz de Qualificação
                    </h1>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    <Input
                        placeholder="Buscar colaborador ou cargo..."
                        className="pl-10 h-11 bg-white/[0.03] border-white/5 focus:border-blue-500/50 rounded-xl transition-all font-medium text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <GlassCard className="overflow-hidden border border-white/5 bg-white/[0.02]">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableHead className="w-[200px] sticky left-0 bg-slate-950/80 backdrop-blur-md z-20 border-r border-white/5 py-5">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Colaborador</span>
                                </TableHead>
                                <TableHead className="w-[180px] border-r border-white/5 px-6">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cargo / Função</span>
                                </TableHead>
                                {data.modules.map(m => (
                                    <TableHead key={m.id} className="min-w-[160px] text-center whitespace-nowrap px-4 bg-white/[0.01]">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-blue-400/80 truncate max-w-[140px] mx-auto" title={m.title}>
                                            {m.title}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map(user => (
                                <TableRow key={user.user_id} className="hover:bg-white/[0.03] transition-colors group">
                                    <TableCell className="font-bold text-sm tracking-tight sticky left-0 bg-slate-950/80 backdrop-blur-md z-10 border-r border-white/5 py-4 group-hover:text-blue-400 transition-colors">
                                        {user.user_name}
                                    </TableCell>
                                    <TableCell className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-6 border-r border-white/5">
                                        {user.job_title}
                                    </TableCell>
                                    {data.modules.map(m => (
                                        <TableCell key={m.id} className="text-center p-3 border-r border-white/[0.02] last:border-r-0">
                                            {getStatusCell(user.modules[m.id])}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="py-20 text-center">
                        <Search className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Nenhum resultado para "{searchTerm}"</h3>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
