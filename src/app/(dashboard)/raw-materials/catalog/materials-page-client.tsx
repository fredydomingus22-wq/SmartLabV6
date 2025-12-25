"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";

interface Material {
    id: string;
    name: string;
    code: string;
    description?: string;
    category?: string;
    unit: string;
    allergens?: string[];
    storage_conditions?: string;
    status: string;
}

interface MaterialsPageClientProps {
    materials: Material[];
}

export function MaterialsPageClient({ materials }: MaterialsPageClientProps) {
    const columns = [
        { key: "code", label: "Code", render: (row: Material) => <span className="font-mono">{row.code}</span> },
        { key: "name", label: "Name" },
        { key: "category", label: "Category", render: (row: Material) => row.category || "-" },
        { key: "unit", label: "Unit" },
        {
            key: "allergens",
            label: "Allergens",
            render: (row: Material) => {
                if (!row.allergens?.length) return "-";
                return (
                    <div className="flex gap-1 flex-wrap">
                        {row.allergens.map(a => (
                            <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                        ))}
                    </div>
                );
            }
        },
        {
            key: "status",
            label: "Status",
            render: (row: Material) => (
                <Badge variant={row.status === "active" ? "default" : "secondary"}>{row.status}</Badge>
            )
        },
    ];

    return <DataGrid data={materials} columns={columns} />;
}
