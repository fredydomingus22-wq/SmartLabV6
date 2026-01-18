import { getMonitoringPoints, getPCCLogs, getEquipments, getActiveBatchesForPCC } from "@/lib/queries/haccp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PCCCheckDialog } from "./pcc-check-dialog";
import { AlertTriangle, CheckCircle2, Clock, Warehouse } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function PCCDashboardPage() {
    // 1. Fetch Monitoring Points (Hazards marked as PCC or OPRP)
    const monitoringPoints = await getMonitoringPoints();

    const ccps = monitoringPoints?.filter(p => p.is_pcc) || [];
    const oprps = monitoringPoints?.filter(p => p.is_oprp) || [];

    // 2. Fetch recent Logs for status (last 50 logs)
    const recentLogs = await getPCCLogs({ limit: 50 });

    // Group logs by hazard_id to get latest status per monitoring point
    const latestStatusMap = new Map<string, any>();
    recentLogs?.forEach(log => {
        if (!latestStatusMap.has(log.hazard_id)) {
            latestStatusMap.set(log.hazard_id, log);
        }
    });

    // 3. Fetch Equipments and Active Batches for the dialog
    const equipments = await getEquipments();
    const activeBatches = await getActiveBatchesForPCC();

    return (
        <div className="space-y-10">
            <PageHeader
                variant="destructive"
                icon={<AlertTriangle className="h-4 w-4" />}
                overline="Food Safety • Critical Limits"
                title="Monitorização de Processos (PCC & OPRP)"
                description="Estado em tempo real dos Pontos de Controlo Críticos e Operacionais."
                backHref="/haccp"
            />

            {/* CCP Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Badge variant="destructive">PCC</Badge> Pontos de Controlo Críticos
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {ccps.map(ccp => (
                        <CCPItemCard
                            key={ccp.id}
                            ccp={ccp}
                            latestLog={latestStatusMap.get(ccp.id)}
                            equipments={equipments || []}
                            activeBatches={activeBatches || []}
                        />
                    ))}

                    {ccps.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                            Nenhum Ponto de Controlo Crítico definido.
                        </div>
                    )}
                </div>
            </div>

            {/* OPRP Section */}
            <div className="space-y-4 pt-8 border-t border-slate-800">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Badge variant="outline" className="border-amber-500 text-amber-500">OPRP</Badge> PRPs Operacionais
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {oprps.map(ccp => (
                        <CCPItemCard
                            key={ccp.id}
                            ccp={ccp}
                            latestLog={latestStatusMap.get(ccp.id)}
                            equipments={equipments || []}
                            activeBatches={activeBatches || []}
                        />
                    ))}
                    {oprps.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                            Nenhum PRP Operacional definido.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CCPItemCard({ ccp, latestLog, equipments, activeBatches }: { ccp: any, latestLog: any, equipments: any[], activeBatches: any[] }) {
    let statusColor = "bg-slate-500";
    let StatusIcon = Clock;

    if (latestLog) {
        if (latestLog.is_compliant) {
            statusColor = "bg-green-500";
            StatusIcon = CheckCircle2;
        } else {
            statusColor = "bg-red-500";
            StatusIcon = AlertTriangle;
        }
    }

    return (
        <Card className="bg-card border-slate-800 relative overflow-hidden transition-all hover:shadow-lg">
            <div className={`absolute top-0 left-0 w-full h-1 ${statusColor}`} />
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{ccp.process_step}</CardTitle>
                    <StatusIcon className={`h-6 w-6 ${statusColor === 'bg-green-500' ? 'text-green-500' : statusColor === 'bg-red-500' ? 'text-red-500' : 'text-slate-400'}`} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{ccp.hazard_description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Controlo:</span>
                    <span className="font-medium">{ccp.control_measure || "Monitorização Contínua"}</span>
                </div>

                {latestLog && (
                    <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Última Verificação:</span>
                            <span className="font-mono text-xs">{new Date(latestLog.checked_at).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Valor:</span>
                            <span className={`font-bold ${latestLog.is_compliant ? 'text-green-600' : 'text-red-600'}`}>
                                {latestLog.actual_value}
                            </span>
                        </div>
                        {!latestLog.is_compliant && latestLog.action_taken && (
                            <div className="bg-red-500/10 border border-red-500/30 p-2 rounded text-xs text-red-700">
                                <strong>Ação:</strong> {latestLog.action_taken}
                            </div>
                        )}
                    </div>
                )}

                <PCCCheckDialog hazard={ccp} equipments={equipments} activeBatches={activeBatches} />
            </CardContent>
        </Card>
    );
}
