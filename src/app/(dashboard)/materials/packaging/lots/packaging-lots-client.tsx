"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PackagingLot {
    id: string;
    lot_code: string;
    quantity: number;
    remaining_quantity: number;
    received_at: string | null;
    expiry_date: string | null;
    status: string;
    packaging_material: {
        id: string;
        name: string;
        code: string | null;
    } | null;
}

interface PackagingLotsClientProps {
    lots: PackagingLot[];
}

export function PackagingLotsClient({ lots }: PackagingLotsClientProps) {
    const columns = [
        {
            key: "packaging_material",
            label: "Material",
            render: (row: PackagingLot) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.packaging_material?.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{row.packaging_material?.code}</span>
                </div>
            )
        },
        { key: "lot_code", label: "Lote", render: (row: PackagingLot) => <span className="font-mono">{row.lot_code}</span> },
        {
            key: "quantity",
            label: "Qtd. Inicial",
            render: (row: PackagingLot) => row.quantity.toString()
        },
        {
            key: "remaining_quantity",
            label: "Qtd. Atual",
            render: (row: PackagingLot) => (
                <span className={row.remaining_quantity <= 0 ? "text-destructive font-bold" : ""}>
                    {row.remaining_quantity}
                </span>
            )
        },
        {
            key: "received_at",
            label: "Receção",
            render: (row: PackagingLot) => row.received_at ? format(new Date(row.received_at), "dd/MM/yyyy") : "-"
        },
        {
            key: "expiry_date",
            label: "Validade",
            render: (row: PackagingLot) => row.expiry_date ? format(new Date(row.expiry_date), "dd/MM/yyyy") : "-"
        },
        {
            key: "status",
            label: "Estado",
            render: (row: PackagingLot) => {
                const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                    active: "default",
                    depleted: "secondary",
                    expired: "destructive",
                    quarantine: "outline"
                };
                const labels: Record<string, string> = {
                    active: "Ativo",
                    depleted: "Esgotado",
                    expired: "Expirado",
                    quarantine: "Quarentena"
                };
                return <Badge variant={variants[row.status] || "secondary"}>{labels[row.status] || row.status}</Badge>;
            }
        },
    ];

    return <DataGrid data={lots} columns={columns} />;
}
