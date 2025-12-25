"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/smart/data-table";
import { Badge } from "@/components/ui/badge";
import { ReceiveStockDialog } from "./receive-dialog";
import { useQueryState, parseAsString } from "nuqs";
import { ColumnDef, ColumnFiltersState, OnChangeFn } from "@tanstack/react-table";

interface ReagentWithStock {
    id: string;
    name: string;
    cas_number?: string;
    storage_location?: string;
    min_stock_level?: number;
    unit?: string;
    current_stock: number;
}

interface StockPageClientProps {
    data: ReagentWithStock[];
}

export function StockPageClient({ data }: StockPageClientProps) {
    const [nameFilter, setNameFilter] = useQueryState('name', parseAsString.withDefault('').withOptions({ shallow: false }));

    const columnFilters = useMemo<ColumnFiltersState>(() => {
        return nameFilter ? [{ id: 'name', value: nameFilter }] : [];
    }, [nameFilter]);

    const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updaterOrValue) => {
        const newFilters = typeof updaterOrValue === 'function'
            ? updaterOrValue(columnFilters)
            : updaterOrValue;

        const filter = newFilters.find(f => f.id === 'name');
        setNameFilter(filter ? String(filter.value) : null);
    };

    const columns: ColumnDef<ReagentWithStock>[] = [
        { accessorKey: "name", header: "Reagent" },
        { accessorKey: "cas_number", header: "CAS No." },
        { accessorKey: "storage_location", header: "Location" },
        {
            accessorKey: "current_stock",
            header: "Stock",
            cell: ({ row }) => {
                const isLow = row.original.current_stock <= (row.original.min_stock_level || 0);
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{row.original.current_stock} {row.original.unit}</span>
                        {isLow && <Badge variant="destructive">Low</Badge>}
                    </div>
                )
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <ReceiveStockDialog reagentId={row.original.id} reagentName={row.original.name} />
            )
        }
    ];

    return (
        <DataTable
            data={data}
            columns={columns}
            searchPlaceholder="Filter reagents..."
            filterColumn="name"
            columnFilters={columnFilters}
            onColumnFiltersChange={onColumnFiltersChange}
        />
    );
}
