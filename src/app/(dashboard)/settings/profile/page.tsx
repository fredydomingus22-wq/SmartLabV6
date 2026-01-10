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

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const user = await getSafeUser();

    return (
        <div className="container py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="glass p-8 rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-blue-500/10 via-slate-900/50 to-transparent relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                            <User className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                O Seu Perfil
                            </h1>
                            <p className="text-slate-400 font-medium">Gerencie suas informações pessoais e de segurança.</p>
                        </div>
                    </div>
                </div>
            </div>
            <Card className="glass border-slate-800/50 overflow-hidden">
                <CardContent className="relative px-8 pb-8">
                    <div className="flex flex-col md:flex-row items-end gap-6 -mt-12">
                        <Avatar className="h-28 w-28 border-4 border-slate-950 shadow-2xl">
                            <AvatarImage src="" alt={user.full_name || "Utilizador"} />
                            <AvatarFallback className="bg-slate-900 text-slate-200 text-2xl font-bold uppercase tracking-tighter">
                                {(user.full_name || "Utilizador").split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1 pb-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">{user.full_name || "Utilizador"}</h1>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase text-[10px] font-bold tracking-widest px-3 py-1">
                                    Conta Ativa
                                </Badge>
                            </div>
                            <p className="text-slate-400 font-medium flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {user.email}
                            </p>
                        </div>
                        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:scale-105">
                            Editar Perfil
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="md:col-span-2 space-y-8">
                    <Card className="glass border-slate-800/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <BadgeCheck className="h-5 w-5 text-emerald-400" />
                                Informações Profissionais
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <Shield className="h-3 w-3" /> Função no Sistema
                                </span>
                                <p className="text-slate-200 font-bold uppercase text-sm tracking-tight">{user.role}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <Factory className="h-3 w-3" /> Unidade Industrial
                                </span>
                                <p className="text-slate-200 font-bold text-sm truncate">{user.plant_id || "Planta Central"}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <Building2 className="h-3 w-3" /> Organização
                                </span>
                                <p className="text-slate-200 font-bold text-sm truncate">{user.organization_id}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" /> Membro Desde
                                </span>
                                <p className="text-slate-200 font-bold text-sm">Dezembro 2023</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass border-slate-800/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Lock className="h-5 w-5 text-orange-400" />
                                Segurança & Acesso
                            </CardTitle>
                            <CardDescription>Gerencie suas credenciais e permissões de acesso.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/30">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-200">Palavra-passe</p>
                                    <p className="text-xs text-slate-400">Alterada pela última vez há 4 meses</p>
                                </div>
                                <Button variant="outline" className="border-slate-700 text-xs h-8">Alterar</Button>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/30">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-200">Autenticação de Dois Fatores (2FA)</p>
                                    <p className="text-xs text-slate-400">Proteja a sua conta com uma camada extra.</p>
                                </div>
                                <Badge className="bg-slate-800 text-slate-500 border-none text-[10px]">Desativado</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Mini Stats/Actions */}
                <div className="space-y-8">
                    <Card className="glass border-slate-800/50 bg-gradient-to-b from-slate-900/50 to-transparent">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Última Atividade</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-xs">
                            <div className="flex items-start gap-3 border-l-2 border-emerald-500 pl-3">
                                <div className="space-y-1">
                                    <p className="text-slate-200 font-bold">Acesso ao Sistema</p>
                                    <p className="text-slate-500">Hoje às 08:45 de Luanda, AO</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 border-l-2 border-slate-700 pl-3">
                                <div className="space-y-1">
                                    <p className="text-slate-200 font-bold">Validação de Lote</p>
                                    <p className="text-slate-500">Ontem às 17:20 no Lote L2402-12</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass border-red-500/10 bg-red-500/5">
                        <CardContent className="p-6 text-center space-y-4">
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-red-400">Eliminar Conta</h3>
                                <p className="text-[11px] text-slate-500">Esta ação é irreversível e apagará todos os seus dados.</p>
                            </div>
                            <Button variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-500/10 text-xs w-full">Solicitar Eliminação</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}

