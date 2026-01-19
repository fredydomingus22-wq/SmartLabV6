// Forced rebuild for Turbopack stabilization
import { SkeletonGrid } from "@/components/smart/skeleton-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function LabLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96 opacity-50" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-24 rounded-xl glass border border-slate-800/50" />
                <Skeleton className="h-24 rounded-xl glass border border-slate-800/50" />
                <Skeleton className="h-24 rounded-xl glass border border-slate-800/50" />
                <Skeleton className="h-24 rounded-xl glass border border-slate-800/50" />
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <Skeleton className="h-10 flex-1 glass border border-slate-800/50" />
                    <Skeleton className="h-10 w-[180px] glass border border-slate-800/50" />
                    <Skeleton className="h-10 w-[240px] glass border border-slate-800/50" />
                </div>

                <SkeletonGrid count={8} variant="card" />
            </div>
        </div>
    );
}
