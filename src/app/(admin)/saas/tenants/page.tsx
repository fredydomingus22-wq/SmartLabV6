import { PageHeader } from "@/components/smart/page-header";
import { getAllTenantsAction } from "@/app/actions/admin/tenants";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Search, Filter } from "lucide-react";
import { CreateTenantDialog } from "./create-tenant-dialog";
import { TenantCard, Tenant } from "./tenant-card";
import { Input } from "@/components/ui/input";

export default async function TenantsPage() {
    const res = await getAllTenantsAction();
    const tenants = res.success ? (res.data ?? []) : [];

    return (
        <div className="space-y-10 pb-10">
            {/* Header with High-Tech Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-blue-500" />
                        Organizações
                    </h1>
                    <p className="text-slate-400 text-sm italic opacity-80">
                        Gestão centralizada de instâncias e parcerias corporativas.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        <Input
                            placeholder="Procurar empresa..."
                            className="pl-9 w-64 bg-white/5 border-white/10 focus:border-blue-500/30 transition-all rounded-xl backdrop-blur-md"
                        />
                    </div>
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl">
                        <Filter className="mr-2 h-4 w-4 text-slate-400" /> Filtros
                    </Button>
                    <CreateTenantDialog>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] rounded-xl border-none">
                            <Plus className="mr-2 h-4 w-4" /> Nova Organização
                        </Button>
                    </CreateTenantDialog>
                </div>
            </div>

            {/* Organizations Grid */}
            {tenants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tenants.map((tenant: any) => (
                        <TenantCard key={tenant.id} tenant={tenant} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
                    <Building2 className="h-16 w-16 text-slate-800 mb-4" />
                    <h3 className="text-lg font-bold text-slate-300">Nenhuma organização registada</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-6">Comece por criar a primeira instância do sistema.</p>
                    <CreateTenantDialog>
                        <Button className="bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20">
                            Registar Agora
                        </Button>
                    </CreateTenantDialog>
                </div>
            )}

            {/* Footer Stats (Mini) */}
            <div className="flex items-center gap-6 pt-6 border-t border-white/5 opacity-50">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    <span>Total de Organizações: {tenants.length}</span>
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    <span>Instâncias Ativas: {tenants.filter((t: any) => t.status === 'active').length}</span>
                </div>
            </div>
        </div>
    );
}
