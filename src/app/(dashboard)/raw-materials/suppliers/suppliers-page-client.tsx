"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";

interface Supplier {
    id: string;
    name: string;
    code: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    status: string;
}

interface SuppliersPageClientProps {
    suppliers: Supplier[];
}

export function SuppliersPageClient({ suppliers }: SuppliersPageClientProps) {
    const columns = [
        { key: "code", label: "Code", render: (row: Supplier) => <span className="font-mono">{row.code}</span> },
        { key: "name", label: "Name" },
        { key: "contact_name", label: "Contact" },
        { key: "contact_email", label: "Email" },
        { key: "contact_phone", label: "Phone" },
        {
            key: "status",
            label: "Status",
            render: (row: Supplier) => {
                const variants: Record<string, "default" | "secondary" | "destructive"> = {
                    active: "default",
                    inactive: "secondary",
                    blocked: "destructive"
                };
                return <Badge variant={variants[row.status] || "outline"}>{row.status}</Badge>;
            }
        },
    ];

    return <DataGrid data={suppliers} columns={columns} />;
}
