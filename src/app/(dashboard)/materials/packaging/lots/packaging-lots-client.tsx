"use client";

import { useState } from "react";
import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { format } from "date-fns";
import { Eye, ShieldCheck, Box, Calendar } from "lucide-react";
import { LotApprovalCard } from "@/app/(dashboard)/materials/_components/lot-approval-card";

interface PackagingLot {
    id: string;
    lot_code: string;
    quantity: number;
    remaining_quantity: number;
    received_at: string | null;
    expiry_date: string | null;
    status: string;
    qc_notes?: string | null;
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
    const [selectedLot, setSelectedLot] = useState<PackagingLot | null>(null);

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
            key: "status",
            label: "Estado",
            render: (row: PackagingLot) => {
                const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                    active: "default",
                    depleted: "secondary",
                    expired: "destructive",
                    quarantine: "outline",
                    rejected: "destructive"
                };
                const labels: Record<string, string> = {
                    active: "Libertado",
                    depleted: "Esgotado",
                    expired: "Expirado",
                    quarantine: "Quarentena",
                    rejected: "Rejeitado"
                };
                return <Badge variant={variants[row.status] || "secondary"} className={row.status === "active" ? "bg-emerald-500 hover:bg-emerald-600 border-none" : ""}>{labels[row.status] || row.status}</Badge>;
            }
        },
        {
            key: "actions",
            label: "Ações",
            render: (row: PackagingLot) => (
                <Button variant="ghost" size="icon" onClick={() => setSelectedLot(row)}>
                    <Eye className="h-4 w-4 text-slate-400" />
                </Button>
            )
        }
    ];

    return (
        <>
            <DataGrid data={lots} columns={columns} className="border-none shadow-none" rowClassName="hover:bg-blue-500/5 transition-colors" />

            <Sheet open={!!selectedLot} onOpenChange={(open) => !open && setSelectedLot(null)}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l border-slate-800 bg-slate-950 p-0 overflow-y-auto">
                    {selectedLot && (
                        <div className="space-y-6">
                            <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2 text-xl font-bold text-white">
                                        <Box className="h-5 w-5 text-emerald-500" />
                                        Detalhes do Lote
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="mt-4 space-y-1">
                                    <p className="text-2xl font-black text-white">{selectedLot.lot_code}</p>
                                    <p className="text-sm text-slate-400">{selectedLot.packaging_material?.name}</p>
                                </div>
                            </div>

                            <div className="px-6 space-y-6">
                                {/* Basic Info Card */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Receção</p>
                                        <p className="text-sm font-bold text-white flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-blue-500" />
                                            {selectedLot.received_at ? format(new Date(selectedLot.received_at), "dd/MM/yyyy") : "-"}
                                        </p>
                                    </div>
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Stock Atual</p>
                                        <p className="text-sm font-bold text-white">
                                            {selectedLot.remaining_quantity} / {selectedLot.quantity}
                                        </p>
                                    </div>
                                </div>

                                {/* Approval Card */}
                                <LotApprovalCard
                                    lotId={selectedLot.id}
                                    type="packaging"
                                    currentStatus={selectedLot.status}
                                    qcNotes={selectedLot.qc_notes}
                                />
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
