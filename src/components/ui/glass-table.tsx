import * as React from "react"
import { cn } from "@/lib/utils"
import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table"

interface GlassTableProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    containerClassName?: string;
}

export function GlassTable({ children, className, containerClassName, ...props }: GlassTableProps) {
    return (
        <div className={cn("glass rounded-3xl border-none shadow-2xl overflow-hidden", containerClassName)} {...props}>
            <Table className={cn("w-full border-collapse", className)}>
                {children}
            </Table>
        </div>
    )
}

export function GlassTableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <TableHeader className={cn("bg-slate-950/40 border-b border-white/5", className)} {...props} />
    )
}

export function GlassTableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <TableHead
            className={cn(
                "h-14 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5",
                className
            )}
            {...props}
        />
    )
}

export function GlassTableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return (
        <TableRow
            className={cn(
                "group border-b border-white/5 hover:bg-white/5 transition-all duration-300",
                className
            )}
            {...props}
        />
    )
}

export function GlassTableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <TableCell className={cn("p-6 align-middle", className)} {...props} />
    )
}
