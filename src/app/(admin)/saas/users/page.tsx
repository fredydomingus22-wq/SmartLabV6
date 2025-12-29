import { getAllGlobalUsers } from "@/app/actions/admin/users";
import { getAllTenantsAction } from "@/app/actions/admin/tenants";
import { Button } from "@/components/ui/button";
import { UserPlus, Shield, Search, Filter } from "lucide-react";
import { CreateGlobalUserDialog } from "./create-user-dialog";
import { UserCard, GlobalUser } from "./user-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default async function AdminUsersPage() {
    const usersRes = await getAllGlobalUsers();
    const tenantsRes = await getAllTenantsAction();

    const users = usersRes.success ? (usersRes.data ?? []) : [];
    const tenants = tenantsRes.success ? (tenantsRes.data ?? []) : [];

    return (
        <div className="space-y-10 pb-10">
            {/* Futuristic Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 text-[10px] font-mono tracking-tighter uppercase font-bold">
                            IAM Console
                        </Badge>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <Shield className="h-8 w-8 text-blue-500" />
                        Utilizadores
                    </h1>
                    <p className="text-slate-400 text-sm italic opacity-80 leading-relaxed max-w-2xl">
                        Controlo centralizado de privilégios, identidades e contas de utilizador em todo o ecossistema SmartLab.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        <Input
                            placeholder="Procurar utilizador..."
                            className="pl-9 w-full sm:w-64 bg-white/5 border-white/10 focus:border-blue-500/30 transition-all rounded-xl backdrop-blur-md"
                        />
                    </div>
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-11 px-5">
                        <Filter className="mr-2 h-4 w-4 text-slate-400" /> Agrupar
                    </Button>
                    <CreateGlobalUserDialog tenants={tenants}>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] rounded-xl border-none font-bold h-11 px-6">
                            <UserPlus className="mr-2 h-4 w-4" /> Registar Acesso
                        </Button>
                    </CreateGlobalUserDialog>
                </div>
            </div>

            {/* Identity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {users.map((user: any) => (
                    <UserCard key={user.id} user={user} />
                ))}
            </div>

            {/* Inventory Stats Bar */}
            <div className="flex items-center gap-6 pt-6 border-t border-white/5 opacity-40">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                    <span>Total de Contas: {users.length}</span>
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                    <span>Admin Level: {users.filter((u: any) => u.role === 'admin' || u.role === 'system_owner').length}</span>
                </div>
            </div>
        </div>
    );
}
