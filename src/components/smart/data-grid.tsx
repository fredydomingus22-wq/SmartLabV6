"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Column<T> {
    key: keyof T | string;
    label: string;
    render?: (row: T) => React.ReactNode;
}

interface DataGridProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (row: T) => void;
    isLoading?: boolean;
    className?: string;
    rowClassName?: string;
}

export function DataGrid<T extends { id: string | number }>({
    data,
    columns,
    onRowClick,
    isLoading,
    className,
    rowClassName,
}: DataGridProps<T>) {
    if (isLoading) {
        return (
            <div className={`w-full h-48 flex items-center justify-center text-muted-foreground glass rounded-lg ${className}`}>
                A carregar...
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className={`w-full h-32 flex items-center justify-center text-muted-foreground glass rounded-lg border-dashed ${className}`}>
                Nenhum dado disponível
            </div>
        );
    }

    return (
        <div className={`rounded-lg border bg-card text-card-foreground shadow-sm glass overflow-hidden ${className}`}>
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        {columns.map((col, idx) => (
                            <TableHead key={idx} className="font-semibold text-foreground/80">
                                {col.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => (
                        <TableRow
                            key={row.id}
                            onClick={() => onRowClick?.(row)}
                            className={rowClassName || (onRowClick ? "cursor-pointer hover:bg-muted/30 transition-colors" : "")}
                        >
                            {columns.map((col, colIdx) => (
                                <TableCell key={colIdx} className="py-3">
                                    {col.render
                                        ? col.render(row)
                                        : (row as any)[col.key]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Pagination Footer Mockup - Implementation in future sprint */}
            <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t bg-muted/20">
                <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs text-muted-foreground">Página 1 de 1</div>
                <Button variant="outline" size="sm" disabled>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>

    );
}
