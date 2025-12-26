import { getGlobalAuditLogs } from "@/app/actions/admin/stats";
import { PageHeader } from "@/components/smart/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    History,
    User,
    Activity,
    Terminal,
    Box,
    Clock,
    Database,
    ChevronLeft,
    Home,
    RefreshCw
} from "lucide-react";
import Link from "next/link";

export default async function AuditPage() {
    const res = await getGlobalAuditLogs();
    const logs = res.data || [];

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
                        <span className="text-slate-300 font-medium">Audit Trail</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:text-slate-100 hover:bg-slate-800 gap-2">
                        <RefreshCw className="h-3.5 w-3.5" /> Atualizar
                    </Button>
                </div>
            </div>

            <PageHeader
                title="Rastreabilidade do Sistema"
                description="Histórico imutável de todas as ações administrativas realizadas na consola global."
            />

            <div className="space-y-4">
                {logs.length === 0 ? (
                    <Card className="bg-slate-900/40 border-slate-800 border-dashed py-20 text-center">
                        <p className="text-slate-500">Nenhum log de auditoria encontrado.</p>
                    </Card>
                ) : (
                    logs.map((log: any) => (
                        <Card key={log.id} className="bg-slate-950/40 border-slate-800/60 hover:border-slate-700 transition-colors overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">
                                    <div className="flex items-center gap-3 md:w-1/4">
                                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                                            <Activity className="h-4 w-4 text-blue-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Ação</span>
                                            <span className="text-sm font-semibold text-slate-200">{log.action.replace(/_/g, ' ')}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 md:w-1/4">
                                        <User className="h-4 w-4 text-slate-500" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Actor</span>
                                            <span className="text-xs font-mono text-slate-400 truncate max-w-[150px]">{log.actor_id}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 md:w-1/4">
                                        <Box className="h-4 w-4 text-slate-500" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Entidade</span>
                                            <span className="text-xs text-slate-300 capitalize">{log.entity_type} ({log.entity_id.split('-')[0]})</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 md:ml-auto">
                                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                                        <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString('pt-PT')}</span>
                                    </div>
                                </div>

                                {log.new_data && (
                                    <div className="bg-slate-950 px-4 py-3 border-t border-slate-800/40">
                                        <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                                            <Terminal className="h-3 w-3" /> Payload de Dados
                                        </div>
                                        <pre className="text-[10px] text-blue-400/80 font-mono overflow-x-auto p-2 bg-slate-900/30 rounded border border-slate-800/50">
                                            {JSON.stringify(log.new_data, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
