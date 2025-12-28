"use client";

import { useState } from "react";
import {
    Plus,
    FlaskConical,
    Factory,
    Package,
    TrendingUp,
    FileText,
    Settings,
    X,
    Microscope
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { SafeUser } from "@/lib/auth";

interface FABProps {
    user: SafeUser;
}

interface FABAction {
    label: string;
    icon: any;
    href: string;
    description?: string;
    allowedRoles?: string[];
}

const actions: FABAction[] = [
    {
        label: "Nova Amostra FQ",
        icon: FlaskConical,
        href: "/lab?create=true&labType=FQ",
        description: "Registar nova amostra físico-química",
        allowedRoles: ["lab_analyst", "admin", "analyst"]
    },
    {
        label: "Nova Amostra Micro",
        icon: Microscope,
        href: "/micro/samples?create=true",
        description: "Registar nova amostra microbiológica",
        allowedRoles: ["micro_analyst", "admin", "analyst"]
    },
    {
        label: "Iniciar Lote",
        icon: Factory,
        href: "/production",
        description: "Abrir novo lote de produção",
        allowedRoles: ["admin", "operator"]
    },
    {
        label: "Receber Material",
        icon: Package,
        href: "/raw-materials/lots",
        description: "Entrada de matéria-prima",
        allowedRoles: ["admin", "warehouse", "operator"]
    },
    {
        label: "Análise SPC",
        icon: TrendingUp,
        href: "/quality/spc",
        description: "Ver tendências de processo",
        allowedRoles: ["admin", "qa_manager", "lab_analyst", "quality"]
    },
];

export function FAB({ user }: FABProps) {
    const [isOpen, setIsOpen] = useState(false);

    const filteredActions = actions.filter(action =>
        !action.allowedRoles || action.allowedRoles.includes(user.role)
    );

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50">
            <DropdownMenu onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        size="icon"
                        className={cn(
                            "h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-2xl transition-all duration-300 glass-primary hover:scale-110 active:scale-95 border-emerald-500/50",
                            isOpen ? "rotate-45" : "rotate-0"
                        )}
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    side="top"
                    sideOffset={16}
                    className="w-64 sm:w-72 bg-slate-950/90 border-slate-800 backdrop-blur-xl glass animate-in slide-in-from-bottom-4 duration-300"
                >
                    <DropdownMenuLabel className="flex items-center gap-2 text-slate-100">
                        <LayoutGrid className="h-4 w-4 text-emerald-400" />
                        Ações Rápidas
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-800/50" />
                    {filteredActions.map((action, index) => (
                        <DropdownMenuItem
                            key={index}
                            asChild
                            className="p-3 text-slate-300 focus:bg-slate-900 focus:text-slate-100 cursor-pointer group"
                        >
                            <Link href={action.href} className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-md bg-slate-900 p-2 group-focus:bg-emerald-500/10 group-focus:text-emerald-400 transition-colors border border-slate-800">
                                    <action.icon className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-semibold">{action.label}</span>
                                    {action.description && (
                                        <span className="text-[11px] text-slate-400 leading-tight font-medium">
                                            {action.description}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="bg-slate-800/50" />
                    <DropdownMenuItem
                        asChild
                        className="p-3 text-slate-300 focus:bg-slate-900 focus:text-slate-100 cursor-pointer italic text-xs justify-center font-medium"
                    >
                        <span className="w-full text-center">Atalho: Pressione ⌘+K para pesquisa global</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

function LayoutGrid(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
            <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
    );
}
