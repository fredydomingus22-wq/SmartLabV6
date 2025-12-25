import { PageHeader } from "@/components/smart/page-header";
import { DataTable } from "@/components/smart/data-table";
import { columns } from "./columns";
import { getAllTenantsAction } from "@/app/actions/admin/tenants";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { CreateTenantDialog } from "./create-tenant-dialog";

export default async function TenantsPage() {
    const res = await getAllTenantsAction();
    const tenants = res.success ? (res.data ?? []) : [];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Organizações (Tenants)"
                    description="Gerir todas as instâncias do sistema e os seus respetivos planos."
                />
                <CreateTenantDialog>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                        <Plus className="mr-2 h-4 w-4" /> Nova Organização
                    </Button>
                </CreateTenantDialog>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-4 overflow-hidden shadow-2xl">
                <DataTable
                    columns={columns}
                    data={tenants}
                    filterColumn="name"
                    searchPlaceholder="Procurar empresa..."
                />
            </div>
        </div>
    );
}
