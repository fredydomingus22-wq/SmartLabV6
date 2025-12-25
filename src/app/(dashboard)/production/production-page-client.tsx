"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Batch {
    id: string;
    code: string;
    status: string;
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
            label: "Status",
            render: (row: Batch) => (
                <Badge variant={row.status === "open" ? "default" : row.status === "closed" ? "secondary" : "destructive"}>
                    {row.status}
                </Badge>
            )
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

