"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BookOpen, Layers, FileText } from "lucide-react";

const tabs = [
    { href: "/quality/training/manager/modules", label: "Training Modules", icon: BookOpen },
    { href: "/quality/training/manager/plans", label: "Curriculum Plans", icon: Layers },
    // { href: "/quality/training/manager/quizzes", label: "Quizzes", icon: FileText },
];

export function ManagerTabs() {
    const pathname = usePathname();

    return (
        <div className="flex p-1 gap-1 bg-white/[0.03] border border-white/5 rounded-xl w-fit mb-8 backdrop-blur-md">
            {tabs.map((tab) => {
                const isActive = pathname.startsWith(tab.href);
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "flex items-center gap-2.5 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all rounded-lg relative overflow-hidden group",
                            isActive
                                ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]"
                        )}
                    >
                        <tab.icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-600 group-hover:text-slate-400")} />
                        {tab.label}
                        {isActive && (
                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/20" />
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
