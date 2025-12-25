import { SkeletonGrid } from "@/components/smart/skeleton-grid";
import { PageHeader } from "@/components/smart/page-header";

export default function SaaSLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-64 bg-slate-800/50 rounded-lg animate-pulse" />
                    <div className="h-4 w-96 bg-slate-800/30 rounded-lg animate-pulse" />
                </div>
                <div className="h-10 w-48 bg-slate-800/50 rounded-full animate-pulse" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 rounded-xl bg-slate-900/50 border border-slate-800/50 animate-pulse" />
                ))}
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[400px] rounded-2xl bg-slate-900/50 border border-slate-800/50 animate-pulse" />
                <div className="h-[400px] rounded-2xl bg-slate-900/50 border border-slate-800/50 animate-pulse" />
            </div>
        </div>
    );
}
