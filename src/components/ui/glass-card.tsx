import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
    return (
        <div
            className={cn(
                "bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
