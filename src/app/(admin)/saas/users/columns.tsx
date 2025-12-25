"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Shield, User, ArrowUpRight } from "lucide-react";
import Link from "next/link";
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

export type GlobalUser = {
    id: string;
    full_name: string;
    role: string;
    organization_id: string;
    organizations: { name: string; slug: string };
    plants?: { name: string };
    created_at: string;
};

export const columns: ColumnDef<GlobalUser>[] = [
    {
        accessorKey: "full_name",
        header: "Nome Completo",
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <span className="font-medium text-slate-200">{row.getValue("full_name")}</span>
                </div>
            );
        }
    },
    {
        accessorKey: "organizations.name",
        header: "Organização",
        cell: ({ row }) => {
            return (
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-blue-400">{row.original.organizations?.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{row.original.organizations?.slug}</span>
                </div>
            );
        }
    },
    {
        accessorKey: "role",
        header: "Função",
        cell: ({ row }) => {
            const role = row.getValue("role") as string;
            return (
                <Badge variant="secondary" className={cn(
                    "capitalize border-slate-700 bg-slate-800/50",
                    role === 'system_owner' && "text-blue-400 border-blue-500/30 bg-blue-500/10",
                    role === 'admin' && "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                )}>
                    {role.replace('_', ' ')}
                </Badge>
            );
        }
    },
    {
        accessorKey: "created_at",
        header: "Membro desde",
        cell: ({ row }) => {
            return new Date(row.getValue("created_at")).toLocaleDateString('pt-PT');
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const user = row.original;

            const handleDelete = async () => {
                if (confirm(`Remover utilizador ${user.full_name}? Esta ação é irreversível.`)) {
                    const res = await deleteGlobalUserAction(user.id);
                    if (res.success) toast.success(res.message);
                    else toast.error(res.message);
                }
            };

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-800">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                        <DropdownMenuLabel>Gestão de Utilizador</DropdownMenuLabel>
                        <DropdownMenuItem asChild className="cursor-pointer hover:bg-slate-800 flex items-center gap-2">
                            <Link href={`/saas/users/${user.id}`} className="w-full flex items-center gap-2">
                                <ArrowUpRight className="h-4 w-4" /> Ver Perfil Detalhado
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer hover:bg-slate-800 flex items-center gap-2">
                            Alterar Empresa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem
                            onClick={handleDelete}
                            className="text-red-400 hover:bg-red-500/10 cursor-pointer flex items-center gap-2"
                        >
                            <Trash2 className="h-4 w-4" /> Eliminar Utilizador
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
    }
];

// Utility for cn
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
