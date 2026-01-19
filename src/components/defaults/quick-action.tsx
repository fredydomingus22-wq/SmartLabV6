import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuickActionProps {
    href: string;
    label: string;
    icon: any;
    badge?: string;
    badgeColor?: "rose" | "amber" | "emerald";
    className?: string;
}

export function QuickAction({ href, label, icon: Icon, badge, badgeColor = "emerald", className }: QuickActionProps) {
    const badgeColors = {
        rose: "bg-rose-500/20 text-rose-400 border-rose-500/30",
        amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-900/50 transition-all group shadow-inner",
                className
            )}
        >
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-indigo-500/20">
                <Icon className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors italic flex-1">
                {label}
            </span>
            {badge && (
                <Badge variant="outline" className={cn("text-[9px] font-black tracking-widest", badgeColors[badgeColor])}>
                    {badge}
                </Badge>
            )}
            <ArrowRight className="h-3.5 w-3.5 text-slate-700 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 -translate-x-2" />
        </Link>
    );
}
