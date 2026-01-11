"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface PremiumListItemProps {
    title: string;
    subtitle?: string;
    status?: string;
    variant?: "default" | "success" | "warning" | "danger" | "info";
    icon?: React.ReactNode;
    time?: string;
    href?: string;
    onClick?: () => void;
    className?: string;
}

export function PremiumListItem({
    title,
    subtitle,
    status,
    variant = "default",
    icon,
    time,
    href,
    onClick,
    className
}: PremiumListItemProps) {
    const variants = {
        default: "text-slate-400 bg-slate-500/10 border-slate-500/20",
        success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        warning: "text-orange-400 bg-orange-500/10 border-orange-500/20",
        danger: "text-red-400 bg-red-500/10 border-red-500/20",
        info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    };

    const Content = () => (
        <div className={cn(
            "flex items-center justify-between p-4 px-5 hover:bg-white/5 transition-all group border-b border-white/5 last:border-0",
            className
        )}>
            <div className="flex items-center gap-4">
                {icon && (
                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 border backdrop-blur-md",
                        variants[variant]
                    )}>
                        {icon}
                    </div>
                )}
                <div className="flex flex-col">
                    <span className="font-bold text-slate-200 group-hover:text-primary transition-colors text-sm">
                        {title}
                    </span>
                    {subtitle && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70 mt-0.5">
                            {subtitle}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {status && (
                    <Badge variant="outline" className={cn(
                        "h-6 px-2.5 font-bold text-[10px] uppercase tracking-wider backdrop-blur-md border",
                        status === 'approved' || variant === 'success' ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20" :
                            status === 'pending' || variant === 'warning' ? "bg-orange-500/5 text-orange-400 border-orange-500/20" :
                                status === 'rejected' || variant === 'danger' ? "bg-red-500/5 text-red-400 border-red-500/20" :
                                    "bg-slate-500/5 text-slate-400 border-slate-500/20"
                    )}>
                        {status}
                    </Badge>
                )}

                {time && (
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground opacity-50">Horário</span>
                        <span className="text-xs font-mono font-medium text-slate-300">{time}</span>
                    </div>
                )}

                {(href || onClick) && (
                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        <ChevronRight className="h-4 w-4 text-primary" />
                    </div>
                )}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block w-full">
                <Content />
            </Link>
        );
    }

    return (
        <div onClick={onClick} className={cn("block w-full cursor-default", onClick && "cursor-pointer")}>
            <Content />
        </div>
    );
}
