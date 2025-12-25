"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu, ChevronDown, ChevronRight } from "lucide-react";
import { menuItems } from "@/config/navigation";
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
            <SheetContent side="left" className="w-[300px] p-0 bg-slate-950 border-r border-slate-800 text-slate-300">
                <SheetHeader className="p-4 border-b border-slate-800">
                    <SheetTitle className="text-left text-lg font-bold bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                        SmartLab v6
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100vh-5rem)]">
                    <div className="flex-1 overflow-y-auto py-4 px-3">
                        <nav className="space-y-1">
                            {menuItems.map((item, index) => {
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
                                                <span className="flex-1 text-left">{item.label}</span>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-200" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-200" />
                                                )}
                                            </button>

                                            {isExpanded && (
                                                <div className="ml-4 border-l border-slate-800/50 pl-2 space-y-1 animate-in fade-in slide-in-from-left-1 duration-200">
                                                    {item.children.map(child => (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            onClick={() => setOpen(false)}
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
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                            isActive
                                                ? "bg-slate-900/80 text-emerald-400 font-bold"
                                                : "text-slate-300 hover:text-slate-100 hover:bg-slate-900/50"
                                        )}
                                    >
                                        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-emerald-400")} />
                                        <span className="truncate">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="border-t border-slate-800 p-4">
                        <LogoutButton />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
