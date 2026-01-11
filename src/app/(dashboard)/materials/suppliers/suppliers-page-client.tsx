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
        { key: "code", label: "Código", render: (row: Supplier) => <span className="font-mono">{row.code}</span> },
        { key: "name", label: "Nome" },
        { key: "contact_name", label: "Contacto" },
        { key: "contact_email", label: "Email" },
        { key: "contact_phone", label: "Telefone" },
        {
            key: "status",
            label: "Estado",
            render: (row: Supplier) => {
                const variants: Record<string, "default" | "secondary" | "destructive"> = {
                    active: "default",
                    inactive: "secondary",
                    blocked: "destructive"
                };
                const labels: Record<string, string> = {
                    active: "Ativo",
                    inactive: "Inativo",
                    blocked: "Bloqueado"
                };
                return <Badge variant={variants[row.status] || "outline"}>{labels[row.status] || row.status}</Badge>;
            }
        },
    ];

    return <DataGrid data={suppliers} columns={columns} className="border-none shadow-none" rowClassName="hover:bg-amber-500/5 transition-colors" />;
}
