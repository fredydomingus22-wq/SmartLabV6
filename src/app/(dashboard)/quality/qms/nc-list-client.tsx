"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";

interface NC {
    id: string;
    nc_number: string;
    title: string;
    nc_type: string;
    severity: string;
    status: string;
    detected_date: string;
    due_date?: string;
}

interface NCListClientProps {
    nonconformities: NC[];
}

export function NCListClient({ nonconformities }: NCListClientProps) {
    const severityColors: Record<string, string> = {
        minor: "bg-slate-800 text-slate-400",
        major: "bg-orange-900/30 text-orange-400 border border-orange-500/20",
        critical: "bg-red-900/30 text-red-400 border border-red-500/20",
    };

    const severityLabels: Record<string, string> = {
        minor: "Menor",
        major: "Maior",
        critical: "Crítica",
    };

    const statusLabels: Record<string, string> = {
        open: "Aberta",
        under_investigation: "Em Investigação",
        containment: "Contenção",
        corrective_action: "Ação Corretiva",
        verification: "Verificação",
        closed: "Fechada",
    };

    const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        open: "destructive",
        under_investigation: "secondary",
        containment: "secondary",
        corrective_action: "outline",
        verification: "outline",
        closed: "default",
    };

    const columns = [
        {
            key: "nc_number",
            label: "NC #",
            render: (row: NC) => (
                <Link
                    href={`/quality/qms/${row.id}`}
                    className="font-mono font-semibold text-primary hover:underline hover:text-primary/80 transition-colors"
                >
                    {row.nc_number}
                </Link>
            ),
        },
        {
            key: "title",
            label: "Título",
            render: (row: NC) => (
                <span className="line-clamp-1 max-w-[200px] text-slate-300">{row.title}</span>
            ),
        },
        {
            key: "nc_type",
            label: "Tipo",
            render: (row: NC) => (
                <Badge variant="outline" className="capitalize text-slate-400 border-slate-800 glass">
                    {row.nc_type === 'internal' ? 'Interna' : row.nc_type === 'supplier' ? 'Fornecedor' : row.nc_type === 'customer' ? 'Cliente' : row.nc_type}
                </Badge>
            ),
        },
        {
            key: "severity",
            label: "Gravidade",
            render: (row: NC) => (
                <Badge className={`${severityColors[row.severity]} capitalize`}>
                    {severityLabels[row.severity] || row.severity}
                </Badge>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (row: NC) => (
                <Badge variant={statusColors[row.status] || "outline"} className="glass">
                    {statusLabels[row.status] || row.status.replace("_", " ")}
                </Badge>
            ),
        },
        {
            key: "detected_date",
            label: "Detetada",
            render: (row: NC) => (
                <span className="text-slate-400">{row.detected_date?.split("T")[0] || "-"}</span>
            ),
        },
        {
            key: "due_date",
            label: "Limite",
            render: (row: NC) => {
                if (!row.due_date) return "-";
                const isOverdue = new Date(row.due_date) < new Date() && row.status !== "closed";
                return (
                    <span className={isOverdue ? "text-red-500 font-semibold" : "text-slate-400"}>
                        {row.due_date.split("T")[0]}
                    </span>
                );
            },
        },
        {
            key: "actions",
            label: "",
            render: (row: NC) => (
                <Link href={`/quality/qms/${row.id}`}>
                    <Button variant="ghost" size="sm" className="hover:bg-slate-800">
                        <Eye className="h-4 w-4" />
                    </Button>
                </Link>
            ),
        },
    ];

    return <DataGrid data={nonconformities} columns={columns} className="glass" />;
}

