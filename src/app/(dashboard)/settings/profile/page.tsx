import { getSafeUser } from "@/lib/auth.server";
import {
    User,
    Mail,
    Shield,
    Factory,
    Building2,
    Calendar,
    BadgeCheck,
    Lock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const user = await getSafeUser();

    return (
        <div className="space-y-6 px-6 pb-20">
            <PageHeader
                title="O Seu Perfil"
                description="Gerencie suas informações pessoais e de segurança."
                icon={<User className="h-6 w-6 text-primary" />}
                variant="blue"
            />

            <Card className="border-slate-800/50 overflow-hidden">
                <CardContent className="px-6 pb-6 pt-6">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                        <Avatar className="h-24 w-24 border-2 border-slate-800 shadow-xl">
                            <AvatarImage src="" alt={user.full_name || "Utilizador"} />
                            <AvatarFallback className="bg-slate-900 text-slate-200 text-xl font-bold uppercase">
                                {(user.full_name || "Utilizador").split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1 pb-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row items-center gap-3">
                                <h2 className="text-2xl font-bold text-slate-100 tracking-tight">{user.full_name || "Utilizador"}</h2>
                                <Badge variant="secondary" className="uppercase text-[10px] font-bold tracking-widest px-3 py-1">
                                    Conta Ativa
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                                <Mail className="h-4 w-4" />
                                {user.email}
                            </p>
                        </div>
                        <Button variant="default" className="rounded-lg px-8">
                            Editar Perfil
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-slate-800/50">
                        <CardHeader className="p-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <BadgeCheck className="h-5 w-5 text-success" />
                                Informações Profissionais
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Shield className="h-3 w-3" /> Função no Sistema
                                </span>
                                <p className="text-slate-200 font-bold uppercase text-sm tracking-tight">{user.role}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Factory className="h-3 w-3" /> Unidade Industrial
                                </span>
                                <p className="text-slate-200 font-bold text-sm truncate">{user.plant_id || "Planta Central"}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Building2 className="h-3 w-3" /> Organização
                                </span>
                                <p className="text-slate-200 font-bold text-sm truncate">{user.organization_id}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" /> Membro Desde
                                </span>
                                <p className="text-slate-200 font-bold text-sm">Dezembro 2023</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800/50">
                        <CardHeader className="p-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Lock className="h-5 w-5 text-warning" />
                                Segurança & Acesso
                            </CardTitle>
                            <CardDescription className="text-sm">Gerencie suas credenciais e permissões de acesso.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-900/30">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-200">Palavra-passe</p>
                                    <p className="text-xs text-muted-foreground">Alterada pela última vez há 4 meses</p>
                                </div>
                                <Button variant="outline" size="sm" className="text-xs">Alterar</Button>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-900/30">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-200">Autenticação de Dois Fatores (2FA)</p>
                                    <p className="text-xs text-muted-foreground">Proteja a sua conta com uma camada extra.</p>
                                </div>
                                <Badge variant="outline" className="text-[10px]">Desativado</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Mini Stats/Actions */}
                <div className="space-y-6">
                    <Card className="border-slate-800/50 bg-slate-900/30">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Última Atividade</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-4 text-xs">
                            <div className="flex items-start gap-3 border-l-2 border-success pl-3">
                                <div className="space-y-1">
                                    <p className="text-slate-200 font-bold">Acesso ao Sistema</p>
                                    <p className="text-muted-foreground">Hoje às 08:45 de Luanda, AO</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 border-l-2 border-slate-700 pl-3">
                                <div className="space-y-1">
                                    <p className="text-slate-200 font-bold">Validação de Lote</p>
                                    <p className="text-muted-foreground">Ontem às 17:20 no Lote L2402-12</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-destructive/10 bg-destructive/5">
                        <CardContent className="p-6 text-center space-y-4">
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-destructive">Eliminar Conta</h3>
                                <p className="text-[11px] text-muted-foreground">Esta ação é irreversível e apagará todos os seus dados.</p>
                            </div>
                            <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10 text-xs w-full">Solicitar Eliminação</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
