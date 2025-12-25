"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface SaaSEmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
    actionLabel?: string;
    onAction?: () => void;
    children?: React.ReactNode;
}

export function SaaSEmptyState({
    title,
    description,
    icon: Icon,
    actionLabel,
    onAction,
    children
}: SaaSEmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-12 lg:p-24 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.01] backdrop-blur-sm text-center"
        >
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                <div className="relative p-6 rounded-3xl bg-slate-900 border border-white/5 shadow-2xl">
                    <Icon className="h-12 w-12 text-blue-500" />
                </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-8">
                {description}
            </p>

            {onAction && actionLabel && (
                <Button
                    onClick={onAction}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                >
                    {actionLabel}
                </Button>
            )}

            {children}

            <div className="mt-8 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-slate-800" />
                <div className="h-1 w-8 rounded-full bg-slate-800" />
                <div className="h-1 w-1 rounded-full bg-slate-800" />
            </div>
        </motion.div>
    );
}
