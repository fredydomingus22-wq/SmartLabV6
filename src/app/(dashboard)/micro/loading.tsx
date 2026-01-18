import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/defaults/page-shell";
import { PageHeader } from "@/components/layout/page-header";

export default function MicroLoading() {
    return (
        <PageShell>
            <div className="space-y-6">
                <div className="flex items-center justify-between pb-6">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-[120px] rounded-xl border border-border" />
                    <Skeleton className="h-[120px] rounded-xl border border-border" />
                    <Skeleton className="h-[120px] rounded-xl border border-border" />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="col-span-2 space-y-4">
                        <Skeleton className="h-[400px] rounded-xl border border-border" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-[400px] rounded-xl border border-border" />
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
