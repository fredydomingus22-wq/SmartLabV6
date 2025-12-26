"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Batch {
    id: string;
    code: string;
    status: "planned" | "open" | "in_progress" | "completed" | "closed" | "blocked" | "released" | "rejected";
    planned_quantity: number;
    start_date: string;
    product?: { name: string }[] | { name: string };
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
                <Link
                    href={`/production/${row.id}`}
                    className="text-primary hover:underline font-medium"
                >
                    {row.code}
                </Link>
            )
        },
        {
            key: "product.name",
            label: "Product",
            render: (row: Batch) => {
                const product = Array.isArray(row.product) ? row.product[0] : row.product;
                return product?.name || "Unknown";
            }
        },
        {
            key: "status",
            label: "Estado",
            render: (row: Batch) => {
                const colors: Record<string, string> = {
                    planned: "bg-blue-500/10 text-blue-700 border-none",
                    open: "bg-amber-500/10 text-amber-700 border-none",
                    in_progress: "bg-amber-500/10 text-amber-700 border-none",
                    completed: "bg-purple-500/10 text-purple-700 border-none",
                    closed: "bg-emerald-500/10 text-emerald-700 border-none",
                    blocked: "bg-rose-500/10 text-rose-700 border-none",
                    released: "bg-emerald-500/10 text-emerald-700 border-none",
                    rejected: "bg-rose-500/10 text-rose-700 border-none",
                };

                const labels: Record<string, string> = {
                    planned: "Planeado",
                    open: "Em Processo",
                    in_progress: "Em Processo",
                    completed: "Finalizado",
                    closed: "Liberado",
                    released: "Liberado",
                    blocked: "Bloqueado",
                    rejected: "Rejeitado",
                };

                return (
                    <Badge className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", colors[row.status] || "bg-muted text-muted-foreground")}>
                        {labels[row.status] || row.status}
                    </Badge>
                );
            }
        },
        { key: "planned_quantity", label: "Quantity" },
        {
            key: "start_date",
            label: "Start Date",
            render: (row: Batch) => row.start_date ? new Date(row.start_date).toLocaleDateString("pt-PT") : "-"
        },
    ];

    return (
        <DataGrid
            data={batches}
            columns={columns}
        />
    );
}

