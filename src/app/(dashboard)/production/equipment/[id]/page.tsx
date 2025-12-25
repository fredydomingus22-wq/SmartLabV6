import { getEquipmentWithMetrology } from "@/lib/queries/metrology";
import { getSafeUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Settings,
    ShieldCheck,
    Activity,
    FileCheck,
    Wrench,
    AlertTriangle,
    Clock,
    Plus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogActivityDialog } from "../_components/log-activity-dialog";
import { RegisterCertificateDialog } from "../_components/register-certificate-dialog";
import { MaintenancePlanDialog } from "../_components/maintenance-plan-dialog";

export default async function EquipmentDetailsPage({ params }: { params: { id: string } }) {
    const user = await getSafeUser();
    const { equipment, error } = await getEquipmentWithMetrology(params.id);

    if (!equipment) return <div className="p-10 text-slate-400">Equipamento não encontrado ou sem permissão.</div>;

    const isOverdue = (date?: string | null) => !!(date && new Date(date) < new Date());

    return (
        <div className="p-6 space-y-6">
            {/* Header section with KPIs */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                <div className="flex gap-4 items-start">
                    <div className={cn(
                        "p-4 rounded-2xl",
                        equipment.status === 'active' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    )}>
                        <Settings className="h-8 w-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-100">{equipment.name}</h1>
                            <Badge variant="outline" className="border-slate-800 text-slate-400 uppercase tracking-wider">
                                {equipment.code}
                            </Badge>
                        </div>
                        <p className="text-slate-500 mt-1">
                            {equipment.manufacturer} {equipment.model} • S/N: {equipment.serial_number || 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    <KPICard
                        label="Próxima Manutenção"
                        value={equipment.next_maintenance_date ? format(new Date(equipment.next_maintenance_date), "dd/MM/yyyy") : "N/D"}
                        icon={<Wrench className="h-4 w-4" />}
                        urgent={isOverdue(equipment.next_maintenance_date)}
                    />
                    <KPICard
                        label="Próxima Calibração"
                        value={equipment.next_calibration_date ? format(new Date(equipment.next_calibration_date), "dd/MM/yyyy") : "N/D"}
                        icon={<Calendar className="h-4 w-4" />}
                        urgent={isOverdue(equipment.next_calibration_date)}
                    />
                    <KPICard
                        label="Criticalidade"
                        value={equipment.criticality}
                        icon={<ShieldCheck className="h-4 w-4" />}
                        variant={equipment.criticality === 'high' ? 'destructive' : 'default'}
                    />
                    <div className="flex flex-col gap-2">
                        <LogActivityDialog equipmentId={equipment.id} />
                        <RegisterCertificateDialog equipmentId={equipment.id} />
                    </div>
                </div>
            </div>

            <Tabs defaultValue="history" className="w-full">
                <TabsList className="bg-slate-900/50 border-slate-800">
                    <TabsTrigger value="history">Histórico Metrológico</TabsTrigger>
                    <TabsTrigger value="plans">Planos de Manutenção</TabsTrigger>
                    <TabsTrigger value="certificates">Certificados</TabsTrigger>
                    <TabsTrigger value="specs">Especificações Técnicas</TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="mt-4">
                    <Card className="glass border-slate-800/50">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 py-4">
                            <CardTitle className="text-lg">Registos de Atividade</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-800/50">
                                {equipment.maintenance_logs?.length > 0 ? (
                                    equipment.maintenance_logs.map((log: any) => (
                                        <div key={log.id} className="p-5 flex items-start justify-between hover:bg-slate-900/40 transition-colors">
                                            <div className="flex gap-4">
                                                <div className={cn(
                                                    "p-2 rounded-lg mt-1",
                                                    log.activity_type === 'calibration' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                                                )}>
                                                    {log.activity_type === 'calibration' ? <ShieldCheck className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-slate-100 uppercase text-xs tracking-wider">
                                                            {log.activity_type === 'maintenance' ? 'Manutenção' :
                                                                log.activity_type === 'calibration' ? 'Calibração' : 'Verificação'}
                                                        </p>
                                                        <Badge className={cn(
                                                            "text-[10px] h-4 px-1.5",
                                                            log.result === 'pass' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                        )}>
                                                            {log.result === 'pass' ? 'APROVADO' : ' REPROVADO'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-300 mt-1">{log.description}</p>
                                                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Executado por {log.performed_by_profile?.full_name || "Desconhecido"} em {format(new Date(log.performed_at), "dd/MM/yyyy HH:mm")}
                                                    </p>
                                                </div>
                                            </div>
                                            {log.notes && (
                                                <div className="max-w-xs p-2 rounded-lg bg-slate-950/50 text-[11px] text-slate-400 italic border border-slate-800">
                                                    {log.notes}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center">
                                        <Activity className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                                        <p className="text-slate-500 italic">Sem registos de atividade metrológica.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="plans">
                    <Card className="glass border-slate-800/50">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 py-4">
                            <CardTitle className="text-lg">Planos de Manutenção Preventiva</CardTitle>
                            <MaintenancePlanDialog equipmentId={equipment.id} />
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Implementation of Plans List */}
                            {equipment.maintenance_plans?.map((plan: any) => (
                                <div key={plan.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 mb-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-slate-100">{plan.title}</h4>
                                        <p className="text-sm text-slate-500">{plan.description}</p>
                                        <div className="flex gap-4 mt-2">
                                            <Badge variant="secondary" className="bg-slate-800 text-slate-400">
                                                Frequência: {plan.frequency_value} {plan.frequency_unit}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase text-slate-500 font-bold">Próxima Data</p>
                                        <p className="text-sm font-medium text-emerald-400">
                                            {plan.last_performed_at ? "Calculando..." : "Pendente"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="certificates">
                    <Card className="glass border-slate-800/50">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 py-4">
                            <CardTitle className="text-lg">Certificados de Calibração</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-800/50">
                                {equipment.calibration_certificates?.length > 0 ? (
                                    equipment.calibration_certificates.map((cert: any) => (
                                        <div key={cert.id} className="p-5 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                            <div className="flex gap-4">
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    cert.status === 'valid' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                                )}>
                                                    <FileCheck className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-100">{cert.certificate_number}</p>
                                                    <p className="text-sm text-slate-400">{cert.issuer}</p>
                                                    <div className="flex gap-4 mt-1 text-xs text-slate-500">
                                                        <span>Emitido em: {format(new Date(cert.issued_at), "dd/MM/yyyy")}</span>
                                                        <span className={cert.status === 'valid' ? "text-emerald-500" : "text-rose-500"}>
                                                            Válido até: {format(new Date(cert.valid_until), "dd/MM/yyyy")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className={cn(
                                                    cert.status === 'valid' ? "border-emerald-500/30 text-emerald-400" : "border-rose-500/30 text-rose-400"
                                                )}>
                                                    {cert.status === 'valid' ? 'VÁLIDO' : cert.status.toUpperCase()}
                                                </Badge>
                                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" asChild>
                                                    <a href={cert.file_url} target="_blank" rel="noopener noreferrer">Ver PDF</a>
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center">
                                        <FileCheck className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                                        <p className="text-slate-500 italic">Nenhum certificado registado.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function KPICard({ label, value, icon, urgent, variant = 'default' }: { label: string, value: string, icon: any, urgent?: boolean, variant?: 'default' | 'destructive' }) {
    return (
        <div className={cn(
            "p-4 rounded-2xl glass border-slate-800/50 flex flex-col gap-1 transition-all",
            urgent ? "border-rose-500/50 bg-rose-500/5" : "hover:border-emerald-500/30"
        )}>
            <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
                {icon}
            </div>
            <div className={cn(
                "text-lg font-bold",
                urgent ? "text-rose-400" : variant === 'destructive' ? "text-amber-400" : "text-slate-100"
            )}>
                {value}
            </div>
        </div>
    );
}
