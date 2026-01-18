"use client";

import { useState } from "react";
import { updateRolePermissionAction } from "@/app/actions/admin/diagnostics";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldCheck, Lock, Eye, Edit3, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ROLES = [
    'admin', 'qa_manager', 'lab_analyst', 'micro_analyst', 'analyst', 'operator',
    'auditor', 'quality', 'haccp', 'warehouse', 'rmpm_lab', 'lab_tech'
];

const MODULES = [
    'dashboard', 'lab', 'micro', 'production', 'cip', 'qms', 'haccp', 'materials', 'reports', 'settings', 'tasks'
];

interface RolesClientProps {
    initialOverrides: any[];
}

export function RolesClient({ initialOverrides }: RolesClientProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [overrides, setOverrides] = useState(initialOverrides);

    async function handleUpdate(role: string, module: string, accessLevel: string) {
        setLoading(`${role}-${module}`);
        try {
            const res = await updateRolePermissionAction(role, module, accessLevel);
            if (res.success) {
                toast.success(res.message);
                // Update local state if needed (though revalidatePath handles it mostly)
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(null);
        }
    }

    const getAccessIcon = (level: string) => {
        switch (level) {
            case 'full': return <ShieldCheck className="h-3 w-3 text-emerald-400" />;
            case 'read': return <Eye className="h-3 w-3 text-blue-400" />;
            case 'own': return <Edit3 className="h-3 w-3 text-amber-400" />;
            case 'none': return <Lock className="h-3 w-3 text-slate-500" />;
            default: return null;
        }
    };

    const getOverride = (role: string, module: string) => {
        return overrides.find(o => o.role === role && o.module === module)?.access_level || 'none';
    };

    return (
        <div className="space-y-6">
            <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                <CardHeader className="border-b border-slate-800 bg-slate-900/20 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="h-5 w-5 text-purple-400" />
                                Matriz de Permissões Global
                            </CardTitle>
                            <CardDescription>
                                Defina os níveis de acesso para cada função do sistema. Estas definições aplicam-se a todos os tenants.
                            </CardDescription>
                        </div>
                        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                            RBAC Dinâmico
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800 hover:bg-transparent">
                                <TableHead className="w-[180px] text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/40">Módulo \ Função</TableHead>
                                {ROLES.map(role => (
                                    <TableHead key={role} className="min-w-[140px] text-center text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-900/40">
                                        {role}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MODULES.map(module => (
                                <TableRow key={module} className="border-slate-800 hover:bg-white/[0.01] transition-colors">
                                    <TableCell className="font-bold text-slate-300 capitalize text-xs bg-slate-950/20 border-r border-slate-800/50">
                                        {module}
                                    </TableCell>
                                    {ROLES.map(role => {
                                        const currentLevel = getOverride(role, module);
                                        const isLoading = loading === `${role}-${module}`;

                                        return (
                                            <TableCell key={`${role}-${module}`} className="p-2">
                                                <Select
                                                    defaultValue={currentLevel}
                                                    onValueChange={(val) => handleUpdate(role, module, val)}
                                                    disabled={isLoading}
                                                >
                                                    <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-[10px] focus:ring-purple-500/30">
                                                        <div className="flex items-center gap-2">
                                                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : getAccessIcon(currentLevel)}
                                                            <SelectValue />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-900 border-slate-800">
                                                        <SelectItem value="full" className="text-xs text-emerald-400">Full Access</SelectItem>
                                                        <SelectItem value="read" className="text-xs text-blue-400">Read Only</SelectItem>
                                                        <SelectItem value="own" className="text-xs text-amber-400">Own Records</SelectItem>
                                                        <SelectItem value="none" className="text-xs text-slate-500">No Access</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardContent className="p-4 flex gap-3">
                        <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
                        <div>
                            <h4 className="text-xs font-bold text-amber-200 uppercase tracking-tight">Nota de Segurança</h4>
                            <p className="text-[10px] text-amber-500/70 mt-1">
                                O role <code className="bg-amber-900/20 px-1 rounded">system_owner</code> não pode ser modificado através deste painel por motivos de integridade estrutural.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
