"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, Beer, Activity, Clock } from "lucide-react";

interface Batch {
    id: string;
    code: string;
    status: "planned" | "open" | "in_progress" | "completed" | "closed" | "blocked" | "released" | "rejected";
    planned_quantity: number;
    start_date: string;
    product?: { name: string }[] | { name: string };
    samples?: { ai_risk_status: string }[];
}

interface ProductionPageClientProps {
    batches: Batch[];
}

export function ProductionPageClient({ batches }: ProductionPageClientProps) {
    const columns = [
        {
            key: "code",
            label: "Batch Code",
            render: (row: Batch) => (
                <div className="flex flex-col gap-1">
                    <Link
                        href={`/production/${row.id}`}
                        className="text-blue-400 hover:text-blue-300 font-black tracking-tight uppercase text-xs transition-colors"
                    >
                        {row.code}
                    </Link>
                    <span className="text-[9px] font-medium text-slate-500 italic uppercase tracking-tighter">MES Unit #1</span>
                </div>
            )
        },
        {
            key: "product.name",
            label: "Product",
            render: (row: Batch) => {
                const product = Array.isArray(row.product) ? row.product[0] : row.product;
                return (
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500/50" />
                        <span className="font-bold text-slate-200">{product?.name || "Unknown"}</span>
                    </div>
                );
            }
        },
        {
            key: "qc_status",
            label: "A.I. Validation",
            render: (row: Batch) => {
                const samples = row.samples || [];
                if (samples.length === 0) return <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest px-2">No Signals</span>;

                const hasBlocked = samples.some(s => s.ai_risk_status === 'blocked');
                const hasWarning = samples.some(s => s.ai_risk_status === 'warning');
                const allApproved = samples.every(s => s.ai_risk_status === 'approved');

                if (hasBlocked) return (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-[0_0_15px_-5px_rgba(244,63,94,0.3)]">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">CRITICAL RISK</span>
                    </div>
                );
                if (hasWarning) return (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">ATTENTION</span>
                    </div>
                );
                if (allApproved) return (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-emerald-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">SECURE</span>
                    </div>
                );

                return (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse">
                        <Info className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">ANALYZING</span>
                    </div>
                );
            }
        },
        {
            key: "status",
            label: "Lifecycle",
            render: (row: Batch) => {
                const styles: Record<string, string> = {
                    planned: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    open: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    completed: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                    closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
                    blocked: "bg-rose-500/10 text-rose-500 border-rose-500/20",
                    released: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]",
                    rejected: "bg-rose-500/10 text-rose-500 border-rose-500/20",
                };
                const labels: Record<string, string> = {
                    planned: "Planned",
                    open: "Active",
                    in_progress: "In Progress",
                    completed: "Finalized",
                    closed: "Released",
                    released: "Released",
                    blocked: "Blocked",
                    rejected: "Rejected",
                };

                return (
                    <Badge variant="outline" className={cn("px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border", styles[row.status] || "bg-slate-500/10 text-slate-400")}>
                        {labels[row.status] || row.status}
                    </Badge>
                );
            }
        },
        {
            key: "planned_quantity",
            label: "Volume",
            render: (row: Batch) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-300">{row.planned_quantity}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">HL</span>
                </div>
            )
        },
        {
            key: "start_date",
            label: "Scheduled",
            render: (row: Batch) => (
                <div className="flex items-center gap-2 text-slate-400">
                    <span className="font-mono text-[10px] font-medium leading-none">
                        {row.start_date ? new Date(row.start_date).toLocaleDateString("pt-PT") : "--/--/--"}
                    </span>
                </div>
            )
        },
    ];

    return (
        <div className="animate-in fade-in duration-700">
            <DataGrid
                data={batches}
                columns={columns}
                className="border-none bg-transparent"
                rowClassName="group hover:bg-white/[0.03] transition-colors border-white/5 border-b"
            />
        </div>
    );
}
