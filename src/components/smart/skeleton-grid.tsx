"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonGridProps {
    count?: number;
    rows?: number;
    cols?: number;
    variant?: "card" | "list" | "table";
}

export function SkeletonGrid({
    count = 6,
    variant = "card",
    rows = 5,
    cols = 4
}: SkeletonGridProps) {
    if (variant === "table") {
        return (
            <div className="space-y-3 w-full">
                <div className="flex space-x-4">
                    {Array.from({ length: cols }).map((_, i) => (
                        <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                </div>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex space-x-4 py-2 border-t border-slate-800/50">
                        {Array.from({ length: cols }).map((_, j) => (
                            <Skeleton key={j} className="h-6 flex-1 bg-slate-800/20" />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    if (variant === "list") {
        return (
            <div className="space-y-4">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 rounded-xl glass">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="h-[200px] rounded-2xl p-6 glass space-y-4 border border-slate-800/50">
                    <div className="flex justify-between items-start">
                        <Skeleton className="h-6 w-24 rounded-lg" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2 opacity-50" />
                    </div>
                    <div className="pt-4 flex justify-between items-end">
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-4 w-28" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}
