"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MoreHorizontal,
    Power,
    ShieldAlert,
    CreditCard,
    ArrowUpRight
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

export type Tenant = {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    created_at: string;
    plants_count?: number;
};

export const columns: ColumnDef<Tenant>[] = [
    {
        accessorKey: "name",
        header: "Nome da Organização",
        cell: ({ row }) => {
            return (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-100">{row.getValue("name")}</span>
                    <span className="text-xs text-slate-400 capitalize">{row.original.slug}</span>
                </div>
            );
        }
    },
    {
        accessorKey: "plan",
        header: "Plano",
        cell: ({ row }) => {
            const plan = row.getValue("plan") as string;
            return (
                <Badge variant="outline" className={cn(
                    "capitalize",
                    plan === 'pro' && "border-purple-500 text-purple-400 bg-purple-500/10",
                    plan === 'enterprise' && "border-blue-500 text-blue-400 bg-blue-500/10",
                    plan === 'trial' && "border-amber-500 text-amber-400 bg-amber-500/10"
                )}>
                    {plan}
                </Badge>
            );
        }
    },
    {
        accessorKey: "plants_count",
        header: "Unidades",
        cell: ({ row }) => {
            const count = row.original.plants_count || 0;
            return (
                <div className="flex items-center gap-2">
                    <div className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700">
                        {count} {count === 1 ? 'Unidade' : 'Unidades'}
                    </div>
                </div>
            );
        }
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "h-2 w-2 rounded-full",
                        status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500"
                    )} />
                    <span className="capitalize text-sm">{status}</span>
                </div>
            );
        }
    },
    {
        accessorKey: "created_at",
        header: "Criado em",
        cell: ({ row }) => {
            return new Date(row.getValue("created_at")).toLocaleDateString('pt-PT');
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const tenant = row.original;

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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-800">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-200">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem asChild className="cursor-pointer hover:bg-slate-800 flex items-center gap-2">
                            <Link href={`/saas/tenants/${tenant.id}`} className="w-full flex items-center gap-2">
                                <ArrowUpRight className="h-4 w-4" /> Ver Detalhes
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer hover:bg-slate-800 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" /> Gerir Plano
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem
                            onClick={toggleStatus}
                            className={cn(
                                "cursor-pointer flex items-center gap-2",
                                tenant.status === 'active' ? "text-red-400 hover:bg-red-500/10" : "text-emerald-400 hover:bg-emerald-500/10"
                            )}
                        >
                            <Power className="h-4 w-4" />
                            {tenant.status === 'active' ? 'Suspender Organização' : 'Ativar Organização'}
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
