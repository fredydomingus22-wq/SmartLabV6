"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";

interface Program {
    id: string;
    name: string;
    target_equipment_type: string;
    created_at: string;
}

interface CIPProgramsPageClientProps {
    programs: Program[];
}

export function CIPProgramsPageClient({ programs }: CIPProgramsPageClientProps) {
    const columns = [
        { key: "name", label: "Program Name" },
        {
            key: "target_equipment_type",
            label: "Type",
            render: (row: Program) => <Badge variant="outline">{row.target_equipment_type.toUpperCase()}</Badge>
        },
        {
            key: "created_at",
            label: "Created",
            render: (row: Program) => new Date(row.created_at).toLocaleDateString()
        },
    ];

    return <DataGrid data={programs} columns={columns} />;
}
