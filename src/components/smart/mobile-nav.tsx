"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu, ChevronDown, ChevronRight } from "lucide-react";
import { menuItems, MenuItem } from "@/config/navigation";
import { hasAccess } from "@/lib/permissions";
import { SafeUser } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

interface MobileNavProps {
    user: SafeUser;
}

export function MobileNav({ user }: MobileNavProps) {
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
                <Button variant="ghost" size="icon" className="md:hidden text-slate-400 hover:text-white">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 bg-slate-950 border-r border-slate-800 text-slate-300 glass shadow-2xl shadow-emerald-900/10">
                <SheetHeader className="p-4 border-b border-slate-800 bg-slate-900/20">
                    <SheetTitle className="text-left text-xl font-extrabold flex items-center gap-3">
                        <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-75" />
                        </div>
                        <span className="bg-gradient-to-r from-slate-100 via-slate-300 to-slate-500 bg-clip-text text-transparent tracking-tight">
                            SmartLab v6
                        </span>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100vh-5rem)]">
                    <div className="flex-1 overflow-y-auto py-6 px-4 scrollbar-none">
                        <nav className="space-y-2">
                            {menuItems.map((item: MenuItem, index: number) => {
                                if (!hasAccess(user.role, item.module)) return null;

                                const isExpanded = expandedGroups.includes(item.label);
                                const isActiveGroup = item.children?.some((c: { href: string; label: string }) => pathname === c.href || pathname.startsWith(c.href + "/"));

                                if (item.children) {
                                    return (
                                        <div key={index} className="space-y-1">
                                            <button
                                                onClick={() => toggleGroup(item.label)}
                                                className={cn(
                                                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative",
                                                    isActiveGroup
                                                        ? "text-emerald-50 bg-emerald-900/20 border border-emerald-800/20"
                                                        : "text-slate-400 hover:text-emerald-100 hover:bg-slate-900/60"
                                                )}
                                            >
                                                <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActiveGroup ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-300")} />
                                                <span className="flex-1 text-left tracking-wide">{item.label}</span>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-emerald-300" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-300" />
                                                )}
                                            </button>

                                            {isExpanded && (
                                                <div className="ml-5 border-l-2 border-emerald-900/20 pl-4 py-1 space-y-1 mt-1 animate-in slide-in-from-left-2 duration-300">
                                                    {item.children.map((child: { href: string; label: string }) => (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            onClick={() => setOpen(false)}
                                                            className={cn(
                                                                "block rounded-lg px-3 py-2.5 text-[13px] transition-all duration-200 font-medium",
                                                                pathname === child.href
                                                                    ? "bg-emerald-900/40 text-emerald-300 shadow-inner"
                                                                    : "text-slate-500 hover:text-emerald-200 hover:bg-emerald-900/10"
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
                                        href={item.href || "#"}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group",
                                            isActive
                                                ? "bg-emerald-900/40 text-emerald-100 border border-emerald-800/30 shadow-lg shadow-emerald-900/20"
                                                : "text-slate-400 hover:text-emerald-100 hover:bg-slate-900/60"
                                        )}
                                    >
                                        <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-300")} />
                                        <span className="truncate tracking-wide">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="border-t border-slate-900 p-5 mt-auto">
                        <LogoutButton />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
