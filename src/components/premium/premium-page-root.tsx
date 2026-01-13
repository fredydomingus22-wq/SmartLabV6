"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumPageRootProps {
    children: React.ReactNode;
    className?: string;
    animate?: boolean;
}

export function PremiumPageRoot({
    children,
    className,
    animate = true
}: PremiumPageRootProps) {
    return (
        <div className={cn(
            "container max-w-[1600px] mx-auto py-8 space-y-10 pb-20 px-4 sm:px-6 lg:px-8",
            className
        )}>
            {animate ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="space-y-10"
                >
                    {children}
                </motion.div>
            ) : (
                <div className="space-y-10">
                    {children}
                </div>
            )}
        </div>
    );
}
