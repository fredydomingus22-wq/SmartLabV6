"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";

interface Movement {
    id: string;
    created_at: string;
    movement_type: string;
    quantity: number;
    batch_number?: string;
    notes?: string;
    reagent?: { name: string; unit?: string }[] | { name: string; unit?: string };
}

interface MovementsPageClientProps {
    movements: Movement[];
}

export function MovementsPageClient({ movements }: MovementsPageClientProps) {
    const columns = [
        {
            key: "created_at",
            label: "Date",
            render: (row: Movement) => {
                const date = new Date(row.created_at);
                return date.toLocaleDateString() + " " + date.toLocaleTimeString();
            }
        },
        {
            key: "reagent.name",
            label: "Reagent",
            render: (row: Movement) => {
                const reagent = Array.isArray(row.reagent) ? row.reagent[0] : row.reagent;
                return reagent?.name || "Unknown";
            }
        },
        {
            key: "type",
            label: "Type",
            render: (row: Movement) => (
                <Badge variant={row.movement_type === 'in' ? "default" : "secondary"}>
                    {row.movement_type.toUpperCase()}
                </Badge>
            )
        },
        {
            key: "quantity",
            label: "Qty",
            render: (row: Movement) => {
                const reagent = Array.isArray(row.reagent) ? row.reagent[0] : row.reagent;
                return (
                    <span className={row.movement_type === 'out' ? "text-red-500 font-mono" : "text-green-500 font-mono"}>
                        {row.movement_type === 'out' ? '-' : '+'}{row.quantity} {reagent?.unit}
                    </span>
                );
            }
        },
        { key: "batch_number", label: "Batch" },
        { key: "notes", label: "Notes" },
    ];

    return <DataGrid data={movements} columns={columns} />;
}
