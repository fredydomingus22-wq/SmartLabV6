import { SkeletonGrid } from "@/components/smart/skeleton-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function MicroLoading() {
    return (
        <div className="container py-8 space-y-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48 opacity-50" />
                    </div>
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Skeleton className="h-28 rounded-xl glass border border-slate-800/50" />
                <Skeleton className="h-28 rounded-xl glass border border-slate-800/50" />
                <Skeleton className="h-28 rounded-xl glass border border-slate-800/50" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <Skeleton className="h-64 rounded-xl glass border border-slate-800/50" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-64 rounded-xl glass border border-slate-800/50" />
                </div>
            </div>
        </div>
    );
}
