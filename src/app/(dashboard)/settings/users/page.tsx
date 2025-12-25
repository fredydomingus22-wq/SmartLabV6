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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestão de Utilizadores</h1>
                    <p className="text-muted-foreground">Gerencie os membros da equipa e as suas funções.</p>
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
