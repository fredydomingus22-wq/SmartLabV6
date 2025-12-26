import { PageHeader } from "@/components/smart/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Shield, Key, Database, Globe, ChevronLeft, Home } from "lucide-react";
import Link from "next/link";

export default function AdminSettingsPage() {
    return (
        <div className="space-y-8">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-slate-900 rounded-full">
                        <Link href="/saas">
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Link href="/saas" className="hover:text-slate-300 transition-colors flex items-center gap-1">
                            <Home className="h-3 w-3" /> SaaS
                        </Link>
                        <span>/</span>
                        <span className="text-slate-300 font-medium">Configurações</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild className="border-slate-700 text-slate-400 hover:text-slate-100 hover:bg-slate-800">
                        <Link href="/saas/audit">Ver Audit Trail</Link>
                    </Button>
                </div>
            </div>

            <PageHeader
                title="Configuração Global"
                description="Parâmetros técnicos e credenciais da infraestrutura SmartLab."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5 text-blue-400" />
                            Infraestrutura Supabase
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-800">
                            <span className="text-sm text-slate-400">Environment</span>
                            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/5">Production</Badge>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-slate-500 uppercase font-bold">Project URL</span>
                            <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 truncate">
                                {process.env.NEXT_PUBLIC_SUPABASE_URL}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-slate-500 uppercase font-bold">Service Role Key</span>
                            <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-slate-500 italic">
                                **************************************** (Secret)
                            </div>
                            <p className="text-[10px] text-amber-500/70">A chave de serviço é usada internamente para bypass de RLS nas ações administrativas.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-amber-400" />
                            Políticas de Segurança
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-800">
                            <span className="text-sm text-slate-400">Isolamento Multi-Tenant</span>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">ATIVO (RLS)</Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-800">
                            <span className="text-sm text-slate-400">Auditoria SaaS (Global)</span>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">ATIVO</Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-800">
                            <span className="text-sm text-slate-400">Encriptação em Repouso</span>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">AES-256</Badge>
                        </div>
                        <div className="pt-2">
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Este painel opera em conformidade com as normas ISO 27701 e ISO 12207, garantindo a rastreabilidade de todas as alterações a nível de sistema.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-purple-400" />
                            Configurações de Identidade
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Subdomínios Automáticos</span>
                                <span className="text-slate-200">Desativado</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Single Sign-On (SSO)</span>
                                <span className="text-slate-200">Configuração Pendente</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
