import { getGlobalAuditLogs } from "@/app/actions/admin/stats";
import { PageHeader } from "@/components/layout/page-header";
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
            {/* Futuristic Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/20 px-3 py-1 text-[10px] font-mono tracking-tighter uppercase font-bold">
                            Immutable Log
                        </Badge>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <History className="h-8 w-8 text-blue-500" />
                        Audit Trail
                    </h1>
                    <p className="text-slate-400 text-sm italic opacity-80 leading-relaxed max-w-2xl">
                        Rastreabilidade total do sistema. Histórico imutável de todas as ações administrativas realizadas na consola global.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-11 px-5">
                        <RefreshCw className="mr-2 h-4 w-4 text-slate-400" /> Atualizar
                    </Button>
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-11 px-5" asChild>
                        <Link href="/saas">
                            <ChevronLeft className="mr-2 h-4 w-4 text-slate-400" /> Voltar à Consola
                        </Link>
                    </Button>
                </div>
            </div>

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
