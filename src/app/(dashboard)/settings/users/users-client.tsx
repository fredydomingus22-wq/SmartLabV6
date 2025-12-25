"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
    id: string;
    full_name: string;
    employee_id: string;
    role: string;
    created_at: string;
}

interface UsersClientProps {
    users: UserProfile[];
}

export function UsersClient({ users }: UsersClientProps) {
    const roleColors: Record<string, string> = {
        admin: "bg-red-500",
        supervisor: "bg-orange-500",
        analyst: "bg-blue-500",
        operator: "bg-green-500"
    };

    const columns = [
        { key: "full_name", label: "Nome" },
        { key: "employee_id", label: "ID Funcionário" },
        {
            key: "role",
            label: "Função",
            render: (row: any) => (
                <Badge className={`${roleColors[row.role] || "bg-gray-500"} text-white border-none`}>
                    {row.role}
                </Badge>
            )
        },
        {
            key: "created_at",
            label: "Criado em",
            render: (row: any) => new Date(row.created_at).toLocaleDateString()
        },
    ];

    return <DataGrid data={users || []} columns={columns} />;
}
