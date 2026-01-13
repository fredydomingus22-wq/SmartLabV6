import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "./users-client";
import { Users, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
    const supabase = await createClient();

    // Fetch user profiles
    const { data: users } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <PageHeader
                title="Gestão de Utilizadores"
                description="Controle de acessos, perfis e permissões RBAC da plataforma"
                icon={<Users className="h-4 w-4" />}
                backHref="/settings"
                variant="purple"
            />

            <div className="space-y-8">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-purple-400" />
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Membros da Equipa</h2>
                        <Badge className="bg-slate-800 text-slate-400 border-none font-black text-[10px] uppercase tracking-widest ml-2 px-3 py-1">
                            {users?.length || 0} TOTAL SESSIONS
                        </Badge>
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 glass overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
                    <div className="relative z-10">
                        <UsersClient users={users || []} />
                    </div>
                </div>
            </div>
        </div>
    );
}
