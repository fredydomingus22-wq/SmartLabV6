"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
    Menu, ChevronDown, ChevronRight, LayoutDashboard, Users, Building2,
    ShieldCheck, Settings, Globe, Activity, Cpu
} from "lucide-react";
import { LogoutButton } from "./logout-button";

const adminMenuItems = [
    { href: "/saas", icon: LayoutDashboard, label: "Consola SaaS" },
    {
        label: "Organizações",
        icon: Building2,
        children: [
            { href: "/saas/tenants", label: "Gestão de Instâncias" },
            { href: "/saas/plans", label: "Planos & Tiers" },
        ]
    },
    {
        label: "Controlo de Acessos",
        icon: Users,
        children: [
            { href: "/saas/users", label: "Utilizadores" },
            { href: "/saas/roles", label: "Permissões & RBAC" },
        ]
    },
    {
        label: "Saúde do Sistema",
        icon: Activity,
        children: [
            { href: "/saas/health", label: "Telemetria & Status" },
            { href: "/saas/audit", label: "Audit Logs (SaaS)" },
        ]
    },
    { href: "/saas/settings", icon: Cpu, label: "Orquestração" },
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
            <SheetContent side="left" className="w-[300px] p-0 bg-slate-950 border-r border-blue-900/30 text-slate-300 glass shadow-2xl shadow-blue-900/10">
                <SheetHeader className="p-4 border-b border-blue-900/30 bg-blue-950/20">
                    <SheetTitle className="text-left text-xl font-extrabold flex items-center gap-3">
                        <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-blue-400 animate-ping opacity-75" />
                        </div>
                        <span className="bg-gradient-to-r from-blue-100 via-blue-400 to-slate-400 bg-clip-text text-transparent tracking-tight">
                            SmartLab HQ
                        </span>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100vh-5rem)]">
                    <div className="flex-1 overflow-y-auto py-6 px-4 scrollbar-none">
                        <nav className="space-y-2">
                            {adminMenuItems.map((item, index) => {
                                const isExpanded = expandedGroups.includes(item.label);
                                const isActiveGroup = item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + "/"));

                                if (item.children) {
                                    return (
                                        <div key={index} className="space-y-1">
                                            <button
                                                onClick={() => toggleGroup(item.label)}
                                                className={cn(
                                                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative",
                                                    isActiveGroup
                                                        ? "text-blue-50 bg-blue-900/20 border border-blue-800/20"
                                                        : "text-slate-400 hover:text-blue-100 hover:bg-slate-900/60"
                                                )}
                                            >
                                                <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActiveGroup ? "text-blue-400" : "text-slate-500 group-hover:text-blue-300")} />
                                                <span className="flex-1 text-left tracking-wide">{item.label}</span>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-blue-300" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-300" />
                                                )}
                                            </button>

                                            {isExpanded && (
                                                <div className="ml-5 border-l-2 border-blue-900/20 pl-4 py-1 space-y-1 mt-1 animate-in slide-in-from-left-2 duration-300">
                                                    {item.children.map(child => (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            onClick={() => setOpen(false)}
                                                            className={cn(
                                                                "block rounded-lg px-3 py-2.5 text-[13px] transition-all duration-200 font-medium",
                                                                pathname === child.href
                                                                    ? "bg-blue-900/40 text-blue-300 shadow-inner"
                                                                    : "text-slate-500 hover:text-blue-200 hover:bg-blue-900/10"
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
                                            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group",
                                            isActive
                                                ? "bg-blue-900/40 text-blue-100 border border-blue-800/30 shadow-lg shadow-blue-900/20"
                                                : "text-slate-400 hover:text-blue-100 hover:bg-slate-900/60"
                                        )}
                                    >
                                        <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-blue-300")} />
                                        <span className="truncate tracking-wide">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Admin Badge */}
                    <div className="mx-4 mb-6 p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-950 border border-blue-900/20 group hover:border-blue-700/40 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <ShieldCheck className="h-4 w-4 text-blue-400" />
                            </div>
                            <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">System Owner</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                            Permissões de administrador global ativas. Acesso total a configurações e organizações.
                        </p>
                    </div>

                    <div className="border-t border-slate-900 p-5 mt-auto">
                        <LogoutButton />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
