import { createAdminClient } from "@/lib/supabase/admin";
import { ensureSystemOwner } from "@/app/actions/admin/utils";
import { PageHeader } from "@/components/smart/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    User,
    Mail,
    Shield,
    Building2,
    Factory,
    Clock,
    ChevronLeft,
    ShieldCheck,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface UserDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
    const { id } = await params;
    await ensureSystemOwner();
    const supabase = createAdminClient();

    const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
            *,
            organizations (name, slug),
            plants (name)
        `)
        .eq('id', id)
        .single();

    if (error || !profile) {
        return notFound();
    }

    // Get auth data for email
    const { data: authUser } = await supabase.auth.admin.getUserById(id);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="hover:bg-slate-900 rounded-full">
                    <Link href="/saas/users">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-slate-100">{profile.full_name}</h1>
                        <Badge className={`capitalize ${profile.role === 'system_owner' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                            {profile.role.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-slate-950/40 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-400" />
                                Informação do Perfil
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1.5">
                                    <Mail className="h-3 w-3" /> Email de Acesso
                                </span>
                                <p className="text-slate-200">{authUser?.user?.email || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1.5">
                                    <Shield className="h-3 w-3" /> Nível de Acesso
                                </span>
                                <p className="text-slate-200 capitalize">{profile.role}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1.5">
                                    <Building2 className="h-3 w-3" /> Organização
                                </span>
                                <p className="text-blue-400 font-semibold">{profile.organizations?.name}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1.5">
                                    <Factory className="h-3 w-3" /> Unidade (Planta)
                                </span>
                                <p className="text-indigo-400 font-semibold">{profile.plants?.name || 'Acesso Global na Org'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-950/40 border-slate-800 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-500 flex items-center gap-2">
                                <Clock className="h-5 w-5" /> Atividade Recente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="py-10 text-center">
                            <p className="text-sm text-slate-600 italic">Funcionalidade de monitorização de sessões em desenvolvimento.</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-900/60 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Segurança</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                                <div>
                                    <h4 className="text-xs font-bold text-emerald-400">Verificado</h4>
                                    <p className="text-[10px] text-emerald-500/70">O utilizador possui email confirmado e perfil ativo.</p>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full border-slate-700 text-slate-400 hover:text-slate-100 hover:bg-slate-800 flex items-center gap-2">
                                <Mail className="h-4 w-4" /> Resetar Password
                            </Button>

                            <Button variant="outline" className="w-full border-red-500/20 text-red-500/70 hover:text-red-400 hover:bg-red-500/5 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> Suspender Conta
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
