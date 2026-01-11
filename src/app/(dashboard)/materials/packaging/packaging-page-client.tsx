"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";

interface PackagingMaterial {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    min_stock_level: number | null;
}

interface PackagingPageClientProps {
    materials: PackagingMaterial[];
}

export function PackagingPageClient({ materials }: PackagingPageClientProps) {
    const columns = [
        { key: "code", label: "Código", render: (row: PackagingMaterial) => <span className="font-mono">{row.code || "-"}</span> },
        { key: "name", label: "Nome" },
        { key: "description", label: "Descrição", render: (row: PackagingMaterial) => row.description || "-" },
        {
            key: "min_stock_level",
            label: "Stock Mínimo",
            render: (row: PackagingMaterial) => row.min_stock_level ? row.min_stock_level.toString() : "-"
        },
    ];

    return <DataGrid data={materials} columns={columns} className="border-none shadow-none" rowClassName="hover:bg-emerald-500/5 transition-colors" />;
}
