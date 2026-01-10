import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "./users-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
    const supabase = await createClient();

    // Fetch user profiles
    const { data: users } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="container py-8 space-y-8">
            <div className="glass p-8 rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-blue-500/10 via-slate-900/50 to-transparent relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                            <Users className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                Gestão de Utilizadores
                            </h1>
                            <p className="text-slate-400 font-medium">Gerencie os membros da equipa e as suas funções.</p>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="glass">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Membros da Equipa ({users?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <UsersClient users={users || []} />
                </CardContent>
            </Card>
        </div>
    );
}
