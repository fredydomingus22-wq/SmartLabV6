import { PageHeader } from "@/components/smart/page-header";
import { DataTable } from "@/components/smart/data-table";
import { columns } from "./columns";
import { getAllGlobalUsers } from "@/app/actions/admin/users";
import { getAllTenantsAction } from "@/app/actions/admin/tenants";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { CreateGlobalUserDialog } from "./create-user-dialog";

export default async function AdminUsersPage() {
    const usersRes = await getAllGlobalUsers();
    const tenantsRes = await getAllTenantsAction();

    const users = usersRes.success ? (usersRes.data ?? []) : [];
    const tenants = tenantsRes.success ? (tenantsRes.data ?? []) : [];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Utilizadores Globais"
                    description="Gestão centralizada de todos os utilizadores e administradores de sistema."
                />
                <CreateGlobalUserDialog tenants={tenants}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                        <UserPlus className="mr-2 h-4 w-4" /> Novo Utilizador
                    </Button>
                </CreateGlobalUserDialog>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-4 overflow-hidden shadow-2xl">
                <DataTable
                    columns={columns}
                    data={users}
                    filterColumn="full_name"
                    searchPlaceholder="Procurar utilizador..."
                />
            </div>
        </div>
    );
}
