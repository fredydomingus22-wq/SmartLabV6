"use client";

import { format } from "date-fns";
import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";

interface AuditLogsGridProps {
    logs: any[];
}

export function AuditLogsGrid({ logs }: AuditLogsGridProps) {
    const columns = [
        {
            key: "created_at",
            label: "Timestamp",
            render: (row: any) => row.created_at ? format(new Date(row.created_at), "dd/MM/yyyy HH:mm:ss") : "-"
        },
        { key: "table_name", label: "Table" },
        {
            key: "action",
            label: "Action",
            render: (row: any) => {
                const colors: Record<string, string> = {
                    INSERT: "bg-green-500",
                    UPDATE: "bg-blue-500",
                    DELETE: "bg-red-500"
                };
                return <Badge className={colors[row.action] || "bg-gray-500"}>{row.action}</Badge>;
            }
        },
        { key: "record_id", label: "Record ID" },
        { key: "user_id", label: "User ID" },
    ];

    return <DataGrid data={logs} columns={columns} />;
}
