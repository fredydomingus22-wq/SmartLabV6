import { cn } from "@/lib/utils";
import React from "react";

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    fullWidth?: boolean;
}

/**
 * Standard Page Wrapper for SmartLab Enterprise.
 * - Full width container with no padding.
 * - PageHeader should be first child (full width).
 * - Content sections should use their own padding.
 */
export function PageShell({ children, className, fullWidth = false, ...props }: PageShellProps) {
    return (
        <div
            className={cn(
                "min-h-screen w-full bg-muted/40",
                "flex flex-col",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
