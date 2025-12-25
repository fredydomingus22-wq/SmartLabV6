"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Building2,
    ShieldCheck,
    Settings,
    ChevronDown,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen,
    Globe,
    Activity,
    CreditCard
} from "lucide-react";
import { LogoutButton } from "./logout-button";
import { Button } from "@/components/ui/button";
import { SafeUser } from "@/lib/auth";

interface AdminSidebarProps {
    user: SafeUser;
}

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

export function AdminSidebar({ user }: AdminSidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedCollapsed = localStorage.getItem("admin-sidebar-collapsed");
        if (savedCollapsed === "true") setIsCollapsed(true);

        const savedGroups = localStorage.getItem("admin-sidebar-expanded-groups");
        if (savedGroups) {
            setExpandedGroups(JSON.parse(savedGroups));
        } else {
            const activeGroup = adminMenuItems.find(item =>
                item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + "/"))
            );
            if (activeGroup) setExpandedGroups([activeGroup.label]);
        }
        setMounted(true);
    }, [pathname]);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem("admin-sidebar-collapsed", String(isCollapsed));
            localStorage.setItem("admin-sidebar-expanded-groups", JSON.stringify(expandedGroups));
        }
    }, [isCollapsed, expandedGroups, mounted]);

    const toggleGroup = (label: string) => {
        if (isCollapsed) {
            setIsCollapsed(false);
            setExpandedGroups([label]);
            return;
        }
        setExpandedGroups(prev =>
            prev.includes(label)
                ? prev.filter(g => g !== label)
                : [...prev, label]
        );
    };

    if (!mounted) return <div className="w-64 bg-slate-950 border-r border-slate-800/50 h-screen" />;

    return (
        <aside className={cn(
            "relative flex h-screen flex-col border-r bg-slate-950 transition-all duration-300 glass border-blue-800/30",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-blue-900/20 px-4 bg-blue-900/5">
                {!isCollapsed && (
                    <div className="flex items-center gap-2 ml-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-slate-100 bg-clip-text text-transparent truncate">
                            SmartLab HQ
                        </span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="text-slate-400 hover:text-blue-400 mx-auto transition-colors"
                >
                    {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </Button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-none hover:scrollbar-thin scrollbar-thumb-blue-900/50 scrollbar-track-transparent">
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
                                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                                            isActiveGroup ? "text-blue-100 bg-blue-900/20" : "text-slate-300 hover:text-blue-200 hover:bg-blue-950/30"
                                        )}
                                    >
                                        <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActiveGroup ? "text-blue-400" : "text-slate-400 group-hover:text-blue-300")} />
                                        {!isCollapsed && (
                                            <>
                                                <span className="flex-1 text-left">{item.label}</span>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-blue-300" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-300" />
                                                )}
                                            </>
                                        )}
                                    </button>

                                    {!isCollapsed && isExpanded && (
                                        <div className="ml-4 border-l border-blue-900/30 pl-2 space-y-1 animate-in fade-in slide-in-from-left-1 duration-200">
                                            {item.children.map(child => (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
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
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-blue-900/40 text-blue-400 font-bold"
                                        : "text-slate-300 hover:text-blue-200 hover:bg-blue-950/30"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-blue-400" : "text-slate-400")} />
                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Admin Badge */}
            {!isCollapsed && (
                <div className="mx-4 mb-4 p-3 rounded-lg bg-blue-900/20 border border-blue-800/30">
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="h-4 w-4 text-blue-400" />
                        <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">System Owner</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                        Acesso global ao sistema. Todas as ações são auditadas.
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-auto border-t border-blue-900/20 p-4">
                <LogoutButton />
            </div>
        </aside>
    );
}
