"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { approveLotAction } from "@/app/actions/raw-materials";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Lot {
    id: string;
    lot_code: string;
    quantity_received: number;
    quantity_remaining: number;
    unit: string;
    received_date: string;
    expiry_date?: string;
    status: string;
    storage_location?: string;
    raw_material?: { id: string; name: string; code: string }[] | { id: string; name: string; code: string };
    supplier?: { id: string; name: string; code: string }[] | { id: string; name: string; code: string };
}

interface LotsPageClientProps {
    lots: Lot[];
}

const unwrap = <T,>(val: T[] | T | undefined): T | undefined => {
    return Array.isArray(val) ? val[0] : val;
};

export function LotsPageClient({ lots }: LotsPageClientProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleApprove = (lotId: string, status: "approved" | "rejected") => {
        const formData = new FormData();
        formData.set("lot_id", lotId);
        formData.set("status", status);

        startTransition(async () => {
            await approveLotAction(formData);
            router.refresh();
        });
    };

    const columns = [
        {
            key: "lot_code",
            label: "Lot Code",
            render: (row: Lot) => (
                <Link
                    href={`/raw-materials/lots/${row.id}`}
                    className="font-mono font-semibold text-primary hover:underline"
                >
                    {row.lot_code}
                </Link>
            )
        },
        {
            key: "raw_material.name",
            label: "Material",
            render: (row: Lot) => {
                const material = unwrap(row.raw_material);
                return material?.name || "-";
            }
        },
        {
            key: "supplier.name",
            label: "Supplier",
            render: (row: Lot) => {
                const supplier = unwrap(row.supplier);
                return supplier?.name || "-";
            }
        },
        {
            key: "quantity",
            label: "Qty Remaining",
            render: (row: Lot) => (
                <span className="font-mono">
                    {row.quantity_remaining} / {row.quantity_received} {row.unit}
                </span>
            )
        },
        {
            key: "expiry_date",
            label: "Expiry",
            render: (row: Lot) => {
                if (!row.expiry_date) return "-";
                // Use consistent date format to avoid hydration mismatch
                const dateStr = row.expiry_date.split('T')[0]; // YYYY-MM-DD
                const date = new Date(row.expiry_date);
                const isExpiring = date <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                return (
                    <span className={isExpiring ? "text-orange-500 font-semibold" : ""}>
                        {dateStr}
                    </span>
                );
            }
        },
        {
            key: "status",
            label: "Status",
            render: (row: Lot) => {
                const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                    quarantine: "outline",
                    approved: "default",
                    rejected: "destructive",
                    exhausted: "secondary"
                };
                return <Badge variant={variants[row.status] || "outline"}>{row.status}</Badge>;
            }
        },
        {
            key: "actions",
            label: "Actions",
            render: (row: Lot) => {
                if (row.status !== "quarantine") return null;
                return (
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-500 hover:text-green-600"
                            onClick={() => handleApprove(row.id, "approved")}
                            disabled={isPending}
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                            onClick={() => handleApprove(row.id, "rejected")}
                            disabled={isPending}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                );
            }
        },
    ];

    return <DataGrid data={lots} columns={columns} />;
}
