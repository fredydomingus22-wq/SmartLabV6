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
} from "lucide-react";
import { LogoutButton } from "./logout-button";
import { Button } from "@/components/ui/button";
import { SafeUser } from "@/lib/auth";

interface AppSidebarProps {
    user: SafeUser;
}

import { menuItems } from "@/config/navigation";

export function AppSidebar({ user }: AppSidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedCollapsed = localStorage.getItem("sidebar-collapsed");
        if (savedCollapsed === "true") setIsCollapsed(true);

        const savedGroups = localStorage.getItem("sidebar-expanded-groups");
        if (savedGroups) {
            setExpandedGroups(JSON.parse(savedGroups));
        } else {
            // Auto-expand current active group
            const activeGroup = menuItems.find(item =>
                item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + "/"))
            );
            if (activeGroup) setExpandedGroups([activeGroup.label]);
        }
        setMounted(true);
    }, [pathname]);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem("sidebar-collapsed", String(isCollapsed));
            localStorage.setItem("sidebar-expanded-groups", JSON.stringify(expandedGroups));
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
            "relative flex h-full flex-col border-r bg-slate-950 transition-all duration-300 glass border-slate-800/50",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-slate-800/50 px-4">
                {!isCollapsed && (
                    <span className="text-lg font-bold bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent truncate ml-2">
                        SmartLab v6
                    </span>
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
                <nav className="space-y-1">
                    {menuItems.map((item, index) => {
                        // Role-based filtering: 
                        // If item has a specific role requirement, check it.
                        // Special legacy check for "Administração" which remains for Org Admins.
                        if (item.role && user.role !== item.role) return null;
                        if (item.label === "Administração" && !["admin", "system_owner"].includes(user.role)) return null;

                        const isExpanded = expandedGroups.includes(item.label);
                        const isActiveGroup = item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + "/"));

                        if (item.children) {
                            return (
                                <div key={index} className="space-y-1">
                                    <button
                                        onClick={() => toggleGroup(item.label)}
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                                            isActiveGroup ? "text-slate-100 bg-slate-900/40" : "text-slate-300 hover:text-slate-100 hover:bg-slate-900/50"
                                        )}
                                    >
                                        <item.icon className={cn("h-5 w-5 shrink-0", isActiveGroup ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200")} />
                                        {!isCollapsed && (
                                            <>
                                                <span className="flex-1 text-left">{item.label}</span>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-200" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-200" />
                                                )}
                                            </>
                                        )}
                                    </button>

                                    {!isCollapsed && isExpanded && (
                                        <div className="ml-4 border-l border-slate-800/50 pl-2 space-y-1 animate-in fade-in slide-in-from-left-1 duration-200">
                                            {item.children.map(child => (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    className={cn(
                                                        "block rounded-lg px-3 py-2 text-sm transition-all hover:bg-slate-900/50 font-normal",
                                                        pathname === child.href
                                                            ? "bg-slate-900/80 text-emerald-400 font-bold"
                                                            : "text-slate-300 hover:text-slate-100"
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
                                        ? "bg-slate-900/80 text-emerald-400 font-bold"
                                        : "text-slate-300 hover:text-slate-100 hover:bg-slate-900/50"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-emerald-400")} />
                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer */}
            <div className="mt-auto border-t border-slate-800/50 p-4">
                <LogoutButton />
            </div>
        </aside>
    );
}


