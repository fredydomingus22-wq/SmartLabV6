import { cn } from "@/lib/utils";

interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "card" | "list" | "kpi" | "table";
    lines?: number;
}

export function SkeletonLoader({
    className,
    variant = "default",
    lines = 1,
    ...props
}: SkeletonLoaderProps) {
    if (variant === "card") {
        return (
            <div className={cn("rounded-xl border border-white/5 bg-slate-900/40 p-6 space-y-4 animate-pulse", className)} {...props}>
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-slate-800" />
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-slate-800 rounded" />
                        <div className="h-3 w-32 bg-slate-800 rounded" />
                    </div>
                </div>
                <div className="h-20 w-full bg-slate-800/50 rounded-lg" />
            </div>
        );
    }

    if (variant === "list") {
        return (
            <div className={cn("space-y-4 animate-pulse", className)} {...props}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-900/40">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-slate-800" />
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-slate-800 rounded" />
                                <div className="h-3 w-48 bg-slate-800 rounded" />
                            </div>
                        </div>
                        <div className="h-8 w-24 bg-slate-800 rounded-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === "kpi") {
        return (
            <div className={cn("rounded-[2rem] border border-white/5 bg-slate-900/40 p-6 h-32 animate-pulse", className)} {...props} />
        );
    }

    return (
        <div className={cn("animate-pulse rounded-md bg-slate-800/50", className)} {...props} />
    );
}
