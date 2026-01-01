"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ExternalLink } from "lucide-react";
import Link from "next/link";
import { CAPAStatusUpdate } from "../[id]/capa-status-update";

interface CAPA {
    id: string;
    action_number: string;
    action_type: string;
    description: string;
    status: string;
    priority: string;
    planned_date?: string;
    completed_date?: string;
    nonconformity_id?: string | null;
    nonconformity?: { nc_number: string; title: string } | null;
    responsible_user?: { full_name: string } | null;
}

interface CAPAListClientProps {
    capas: CAPA[];
}

export function CAPAListClient({ capas }: CAPAListClientProps) {
    const statusLabels: Record<string, string> = {
        planned: "Planeada",
        in_progress: "Em Progresso",
        completed: "Concluída",
        verified: "Verificada",
        closed: "Fechada",
    };

    const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        planned: "outline",
        in_progress: "secondary",
        completed: "default",
        verified: "default",
        closed: "default",
    };

    const columns = [
        {
            key: "action_number",
            label: "Ação #",
            render: (row: CAPA) => (
                <span className="font-mono font-bold text-primary">{row.action_number}</span>
            ),
        },
        {
            key: "description",
            label: "Descrição",
            render: (row: CAPA) => (
                <span className="line-clamp-1 max-w-[300px] text-slate-300">{row.description}</span>
            ),
        },
        {
            key: "action_type",
            label: "Tipo",
            render: (row: CAPA) => (
                <Badge variant="outline" className="capitalize text-slate-400 border-slate-800 glass">
                    {row.action_type === 'corrective' ? 'Corretiva' : 'Preventiva'}
                </Badge>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (row: CAPA) => (
                <Badge variant={statusColors[row.status] || "outline"} className="glass">
                    {statusLabels[row.status] || row.status}
                </Badge>
            ),
        },
        {
            key: "responsible",
            label: "Responsável",
            render: (row: CAPA) => {
                const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;
                const resp = unwrap(row.responsible_user);
                return <span className="text-slate-400">{resp?.full_name || "Não atribuído"}</span>;
            },
        },
        {
            key: "planned_date",
            label: "Data Limite",
            render: (row: CAPA) => {
                if (!row.planned_date) return "-";
                const isOverdue = new Date(row.planned_date) < new Date() &&
                    !["completed", "verified", "closed"].includes(row.status);
                return (
                    <span className={isOverdue ? "text-red-500 font-semibold" : "text-slate-400"}>
                        {row.planned_date.split("T")[0]}
                    </span>
                );
            },
        },
        {
            key: "actions",
            label: "",
            render: (row: CAPA) => (
                <div className="flex gap-2">
                    <Link href={`/quality/qms/capa/${row.id}`}>
                        <Button variant="ghost" size="sm" title="Ver Detalhes" className="hover:bg-slate-800 text-emerald-400">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <CAPAStatusUpdate capaId={row.id} currentStatus={row.status} />
                    {row.nonconformity_id && (
                        <Link href={`/quality/qms/${row.nonconformity_id}`}>
                            <Button variant="ghost" size="sm" title="Ver NC associada" className="hover:bg-slate-800">
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                </div>
            ),
        },
    ];

    return <DataGrid data={capas} columns={columns} className="glass" />;
}

