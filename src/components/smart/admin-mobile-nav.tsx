"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
    Menu, ChevronDown, ChevronRight, LayoutDashboard, Users, Building2,
    ShieldCheck, Settings, Globe, Activity
} from "lucide-react";
import { LogoutButton } from "./logout-button";

const adminMenuItems = [
    { href: "/saas", icon: LayoutDashboard, label: "Painel Global" },
    {
        label: "Gestão SaaS",
        icon: Globe,
        children: [
            { href: "/saas/tenants", label: "Organizações (Tenants)" },
            { href: "/saas/plans", label: "Planos & Assinaturas" },
        ]
    },
    {
        label: "Utilizadores",
        icon: Users,
        children: [
            { href: "/saas/users", label: "Utilizadores Globais" },
            { href: "/saas/roles", label: "Funções & Permissões" },
        ]
    },
    {
        label: "Monitorização",
        icon: Activity,
        children: [
            { href: "/saas/logs", label: "Audit Logs (SaaS)" },
            { href: "/saas/health", label: "Estado do Sistema" },
        ]
    },
    { href: "/saas/settings", icon: Settings, label: "Configuração Global" },
];

export function AdminMobileNav() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev =>
            prev.includes(label)
                ? prev.filter(g => g !== label)
                : [...prev, label]
        );
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-blue-400 hover:text-white hover:bg-blue-900/30">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Admin Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 bg-slate-950 border-r border-blue-800/30 text-slate-300">
                <SheetHeader className="p-4 border-b border-blue-900/30 bg-blue-900/5">
                    <SheetTitle className="text-left text-lg font-bold flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="bg-gradient-to-r from-blue-400 to-slate-100 bg-clip-text text-transparent">
                            SmartLab HQ
                        </span>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100vh-5rem)]">
                    <div className="flex-1 overflow-y-auto py-4 px-3">
                        <nav className="space-y-1">
                            {adminMenuItems.map((item, index) => {
                                const isExpanded = expandedGroups.includes(item.label);
                                const isActiveGroup = item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + "/"));

                                if (item.children) {
                                    return (
                                        <div key={index} className="space-y-1">
                                            <button
                                                onClick={() => toggleGroup(item.label)}
                                                className={cn(
                                                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                                                    isActiveGroup ? "text-blue-100 bg-blue-900/20" : "text-slate-300 hover:text-blue-200 hover:bg-blue-950/30"
                                                )}
                                            >
                                                <item.icon className={cn("h-5 w-5 shrink-0", isActiveGroup ? "text-blue-400" : "text-slate-400 group-hover:text-blue-300")} />
                                                <span className="flex-1 text-left">{item.label}</span>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-blue-300" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-300" />
                                                )}
                                            </button>

                                            {isExpanded && (
                                                <div className="ml-4 border-l border-blue-900/30 pl-2 space-y-1 animate-in fade-in slide-in-from-left-1 duration-200">
                                                    {item.children.map(child => (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            onClick={() => setOpen(false)}
                                                            className={cn(
                                                                "block rounded-lg px-3 py-2 text-sm transition-all hover:bg-blue-900/20 font-normal",
                                                                pathname === child.href
                                                                    ? "bg-blue-900/40 text-blue-400 font-bold"
                                                                    : "text-slate-300 hover:text-blue-200"
                                                            )}
                                                        >
                                                            {child.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                                            isActive
                                                ? "bg-blue-900/40 text-blue-400 font-bold"
                                                : "text-slate-300 hover:text-blue-200 hover:bg-blue-950/30"
                                        )}
                                    >
                                        <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-blue-400" : "text-slate-400")} />
                                        <span className="truncate">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Admin Badge */}
                    <div className="mx-3 mb-3 p-3 rounded-lg bg-blue-900/20 border border-blue-800/30">
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="h-4 w-4 text-blue-400" />
                            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">System Owner</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                            Acesso global ao sistema.
                        </p>
                    </div>

                    <div className="border-t border-blue-900/30 p-4">
                        <LogoutButton />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
