"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    PanelLeftClose,
    PanelLeftOpen,
    ChevronDown,
    ChevronRight,
    Sparkles,
} from "lucide-react";
import { LogoutButton } from "./logout-button";
import { Button } from "@/components/ui/button";
import { SafeUser } from "@/lib/auth";

interface AppSidebarProps {
    user: SafeUser;
}

import { menuItems, MenuItem } from "@/config/navigation";
import { hasAccess, Module } from "@/lib/permissions";

export function AppSidebar({ user }: AppSidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]); // This tracks expanded ITEMS (like LIMS), not Modules
    const [mounted, setMounted] = useState(false);

    // Grouping Logic
    const groupedItems = menuItems.reduce((acc, item) => {
        const group = item.group || "Other";
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);

    const groupOrder = [
        "Core Operations",
        "LIMS Module",
        "Production (MES)",
        "Quality (QMS)",
        "Food Safety (FSMS)",
        "Logistics",
        "Settings"
    ];

    useEffect(() => {
        const savedCollapsed = localStorage.getItem("sidebar-collapsed");
        if (savedCollapsed === "true") setIsCollapsed(true);

        const savedGroups = localStorage.getItem("sidebar-expanded-groups");
        if (savedGroups) {
            setExpandedGroups(JSON.parse(savedGroups));
        } else {
            // Auto-expand current active group
            const activeGroupItem = menuItems.find(item =>
                item.children?.some((c: { href: string; label: string }) => pathname === c.href || pathname.startsWith(c.href + "/"))
            );
            if (activeGroupItem) setExpandedGroups([activeGroupItem.label]);
        }
        setMounted(true);
    }, [pathname]);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem("sidebar-collapsed", String(isCollapsed));
            localStorage.setItem("sidebar-expanded-groups", JSON.stringify(expandedGroups));
        }
    }, [isCollapsed, expandedGroups, mounted]);

    const toggleItem = (label: string) => {
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
            "relative flex h-full flex-col border-r bg-slate-950 transition-all duration-300 glass border-slate-800/50",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-slate-800/50 px-4 shrink-0">
                {!isCollapsed && (
                    <div className="flex items-center gap-2 ml-2 transition-opacity duration-300">
                        <Sparkles className="h-4 w-4 text-emerald-400" />
                        <span className="text-lg font-black bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent truncate tracking-tighter uppercase italic">
                            SmartLab v6
                        </span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="text-slate-400 hover:text-slate-100 mx-auto"
                >
                    {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </Button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-none hover:scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <nav className="space-y-6">
                    {groupOrder.map((group) => {
                        const items = groupedItems[group];
                        if (!items || items.length === 0) return null;

                        // Filter items by permission first
                        const visibleItems = items.filter(item => hasAccess(user.role, item.module));
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={group} className="space-y-2">
                                {!isCollapsed && (
                                    <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        {group}
                                    </div>
                                )}
                                {isCollapsed && <div className="h-px bg-slate-800/50 mx-2 my-2" />}

                                <div className="space-y-1">
                                    {visibleItems.map((item, index) => {
                                        const isExpanded = expandedGroups.includes(item.label);
                                        const isActiveGroup = item.children?.some((c: { href: string; label: string }) => pathname === c.href || pathname.startsWith(c.href + "/"));
                                        const isActive = pathname === item.href;

                                        // Render Parent Item (with children)
                                        if (item.children) {
                                            return (
                                                <div key={item.label} className="space-y-1">
                                                    <button
                                                        onClick={() => toggleItem(item.label)}
                                                        className={cn(
                                                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                                                            isActiveGroup ? "text-slate-100 bg-slate-900/40" : "text-slate-300 hover:text-slate-100 hover:bg-slate-900/50"
                                                        )}
                                                        title={isCollapsed ? item.label : undefined}
                                                    >
                                                        <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActiveGroup ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200")} />
                                                        {!isCollapsed && (
                                                            <>
                                                                <span className="flex-1 text-left line-clamp-1">{item.label}</span>
                                                                {isExpanded ? (
                                                                    <ChevronDown className="h-3 w-3 text-slate-500" />
                                                                ) : (
                                                                    <ChevronRight className="h-3 w-3 text-slate-500" />
                                                                )}
                                                            </>
                                                        )}
                                                    </button>

                                                    {!isCollapsed && isExpanded && (
                                                        <div className="ml-4 border-l border-slate-800/50 pl-2 space-y-1 animate-in fade-in slide-in-from-left-1 duration-200">
                                                            {item.children.map((child: { href: string; label: string; module?: Module }) => {
                                                                if (child.module && !hasAccess(user.role, child.module)) return null;
                                                                return (
                                                                    <Link
                                                                        key={child.href}
                                                                        href={child.href}
                                                                        prefetch={true}
                                                                        className={cn(
                                                                            "block rounded-lg px-3 py-2 text-sm transition-all hover:bg-slate-900/50 font-normal truncate",
                                                                            pathname === child.href
                                                                                ? "bg-slate-900/80 text-emerald-400 font-bold"
                                                                                : "text-slate-400 hover:text-slate-100"
                                                                        )}
                                                                    >
                                                                        {child.label}
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        // Render Single Item
                                        return (
                                            <Link
                                                key={item.label}
                                                href={item.href || "#"}
                                                prefetch={true}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                                                    isActive
                                                        ? "bg-slate-900/80 text-emerald-400 font-bold"
                                                        : "text-slate-300 hover:text-slate-100 hover:bg-slate-900/50"
                                                )}
                                                title={isCollapsed ? item.label : undefined}
                                            >
                                                <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive && "text-emerald-400")} />
                                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Footer */}
            <div className="mt-auto border-t border-slate-800/50 p-4 sticky bottom-0 bg-slate-950/95 backdrop-blur">
                {!isCollapsed ? <LogoutButton /> : (
                    <div className="flex justify-center"><LogoutButton iconOnly /></div>
                )}
            </div>
        </aside>
    );
}


