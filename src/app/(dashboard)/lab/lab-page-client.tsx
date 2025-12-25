"use client";

import { format } from "date-fns";
import Link from "next/link";
import { DataTable } from "@/components/smart/data-table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { ResultDialogWrapper } from "./result-dialog-wrapper";
import { ColumnDef } from "@tanstack/react-table";
// Import the dialog-based approval component
import { ApproveSampleDialog } from "./approve-sample-dialog";
import { useQueryState, parseAsString } from "nuqs";
import { useMemo } from "react";
import { ColumnFiltersState, OnChangeFn } from "@tanstack/react-table";

// Supabase returns nested relations as arrays for to-one relationships
interface Sample {
    id: string;
    code: string;
    status: string;
    collected_at: string;
    batch?: { code: string; product?: { id?: string; name: string }[] | { id?: string; name: string } }[] | { code: string; product?: { id?: string; name: string }[] | { id?: string; name: string } };
    intermediate?: {
        production_batches: {
            code: string;
            product?: { id?: string; name: string }[] | { id?: string; name: string }
        }[] | {
            code: string;
            product?: { id?: string; name: string }[] | { id?: string; name: string }
        };
    }[] | {
        production_batches: {
            code: string;
            product?: { id?: string; name: string }[] | { id?: string; name: string }
        }[] | {
            code: string;
            product?: { id?: string; name: string }[] | { id?: string; name: string }
        };
    };
    type?: { name: string }[] | { name: string };
}

interface LabPageClientProps {
    samples: Sample[];
    showApproval?: boolean;
}

function ApprovalButtons({ sample }: { sample: Sample }) {
    return (
        <div className="flex gap-1">
            <ApproveSampleDialog
                sample={{ id: sample.id, code: sample.code }}
                action="approve"
            />
            <ApproveSampleDialog
                sample={{ id: sample.id, code: sample.code }}
                action="reject"
            />
        </div>
    );
}

export function LabPageClient({ samples, showApproval = false }: LabPageClientProps) {
    const [code, setCode] = useQueryState('code', parseAsString.withDefault('').withOptions({ shallow: false }));

    const columnFilters = useMemo<ColumnFiltersState>(() => {
        return code ? [{ id: 'code', value: code }] : [];
    }, [code]);

    const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updaterOrValue) => {
        const newFilters = typeof updaterOrValue === 'function'
            ? updaterOrValue(columnFilters)
            : updaterOrValue;

        const codeFilter = newFilters.find(f => f.id === 'code');
        setCode(codeFilter ? String(codeFilter.value) : null);
    };

    const columns: ColumnDef<Sample>[] = [
        {
            accessorKey: "code",
            header: "ID Amostra",
            cell: ({ row }) => (
                <Link href={`/lab/samples/${row.original.id}`} className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                    {row.original.code}
                    <ExternalLink className="h-3 w-3" />
                </Link>
            )
        },
        {
            id: "batch_code",
            header: "Lote",
            cell: ({ row }) => {
                const batch = Array.isArray(row.original.batch) ? row.original.batch[0] : row.original.batch;
                return batch?.code || "-";
            }
        },
        {
            id: "product_name",
            header: "Produto",
            cell: ({ row }) => {
                const batch = Array.isArray(row.original.batch) ? row.original.batch[0] : row.original.batch;
                const product = batch?.product;
                const prod = Array.isArray(product) ? product[0] : product;
                return prod?.name || "-";
            }
        },
        {
            id: "type_name",
            header: "Tipo",
            cell: ({ row }) => {
                const type = Array.isArray(row.original.type) ? row.original.type[0] : row.original.type;
                return type?.name || "-";
            }
        },
        {
            accessorKey: "collected_at",
            header: "Colhida em",
            cell: ({ row }) => row.original.collected_at ? format(new Date(row.original.collected_at), "dd/MM/yyyy HH:mm:ss") : "-"
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }) => <Badge variant="secondary" className="uppercase text-[10px]">{row.original.status}</Badge>
        },
        {
            id: "actions",
            header: "Ações",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <ResultDialogWrapper sample={row.original} />
                    {showApproval && <ApprovalButtons sample={row.original} />}
                </div>
            )
        },
    ];

    return (
        <DataTable
            data={samples}
            columns={columns}
            searchPlaceholder="Procurar por código..."
            filterColumn="code"
            columnFilters={columnFilters}
            onColumnFiltersChange={onColumnFiltersChange}
        />
    );
}
