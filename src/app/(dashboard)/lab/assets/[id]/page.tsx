import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Printer,
    Edit,
    Activity,
    Calendar,
    FileText,
    Wrench,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Factory // Added Factory icon import
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PrintAssetLabelButton } from "@/app/(dashboard)/lab/assets/_components/print-asset-label-button";
import { AssetDocumentUpload } from "@/app/(dashboard)/lab/assets/_components/asset-document-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { getLabAssetById, getAssetHistory } from "@/app/actions/lab_modules/asset-details";

// Helper components
function StatusBadge({ status }: { status: string }) {
    const styles = {
        active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        decommissioned: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    // Default to a neutral style if status is unknown
    const defaultStyle = "bg-slate-500/10 text-slate-400 border-slate-500/20";
    const className = styles[status as keyof typeof styles] || defaultStyle;

    const labels = {
        active: "Ativo",
        maintenance: "Em Manutenção",
        decommissioned: "Desativado",
    };

    return (
        <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${className} flex items-center gap-1.5`}>
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-current'}`} />
            {labels[status as keyof typeof labels] || status}
        </div>
    );
}

function CriticalityBadge({ level }: { level: string }) {
    const styles = {
        high: "text-red-400 bg-red-500/10 border-red-500/20",
        medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        low: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    };

    const className = styles[level as keyof typeof styles] || "text-slate-400 bg-slate-500/10 border-slate-500/20";

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${className}`}>
            {level === 'high' ? 'Crítico' : level === 'medium' ? 'Médio' : 'Baixo'}
        </span>
    );
}

// Params type for Next.js 16 (Promise)
type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function LabAssetDetailPage(props: PageProps) {
    const params = await props.params;
    const { id } = params;

    const asset = await getLabAssetById(id);
    if (!asset) {
        notFound();
    }

    const { calibrations, maintenance } = await getAssetHistory(id);

    return (
        <div className="space-y-6">
            {/* Breadcrumb / Back Navigation */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <Link href="/lab/assets" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Voltar para Instrumentos
                </Link>
                <span className="text-slate-600">/</span>
                <span className="text-slate-200">Detalhes do Instrumento</span>
            </div>

            {/* Header Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1fr_auto] items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white tracking-tight">{asset.name}</h1>
                        <StatusBadge status={asset.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5" />
                            {asset.code}
                        </span>
                        {asset.plants && (
                            <span className="flex items-center gap-1.5">
                                <Factory className="h-3.5 w-3.5" />
                                {asset.plants.name}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5">
                            <span className="text-slate-500">S/N:</span>
                            {asset.serial_number || "N/A"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <PrintAssetLabelButton asset={{ code: asset.code, name: asset.name, next_calibration_date: asset.next_calibration_date }} />
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-500/50">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                    </Button>
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="details" className="w-full">
                <TabsList className="bg-black/20 border border-white/5 p-1">
                    <TabsTrigger value="details" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                        Detalhes
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                        Histórico
                    </TabsTrigger>
                    <TabsTrigger value="docs" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                        Documentos
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    {/* DETAILS TAB */}
                    <TabsContent value="details" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* General Info Card */}
                            <Card className="glass border-white/5 bg-black/20">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-blue-500/10">
                                            <FileText className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <CardTitle className="text-lg text-slate-200">Informações Gerais</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-500 mb-1">Fabricante</p>
                                            <p className="text-slate-200 font-medium">{asset.manufacturer || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 mb-1">Modelo</p>
                                            <p className="text-slate-200 font-medium">{asset.model || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 mb-1">Categoria</p>
                                            <p className="text-slate-200 font-medium capitalize">{asset.asset_category?.replace("_", " ") || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 mb-1">Criticidade</p>
                                            <CriticalityBadge level={asset.criticality} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Calibration Status Card */}
                            <Card className="glass border-white/5 bg-black/20">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-amber-500/10">
                                            <Activity className="h-5 w-5 text-amber-400" />
                                        </div>
                                        <CardTitle className="text-lg text-slate-200">Status de Calibração</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm text-slate-300">Última Calibração</span>
                                        </div>
                                        <span className="text-sm font-medium text-white">
                                            {asset.last_calibration_date
                                                ? new Date(asset.last_calibration_date).toLocaleDateString('pt-BR')
                                                : "N/A"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-4 w-4 text-emerald-400" />
                                            <span className="text-sm text-slate-300">Próxima Calibração</span>
                                        </div>
                                        <span className="text-sm font-medium text-emerald-400">
                                            {asset.next_calibration_date
                                                ? new Date(asset.next_calibration_date).toLocaleDateString('pt-BR')
                                                : "Não agendada"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm px-1">
                                        <span className="text-slate-500">Frequência</span>
                                        <span className="text-slate-300">{asset.calibration_frequency_months || 0} meses</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* HISTORY TAB */}
                    <TabsContent value="history" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="glass border-white/5 bg-black/20">
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-200">Histórico de Eventos</CardTitle>
                                <CardDescription className="text-slate-500">Calibrações e manutenções passadas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">

                                    {/* Timeline Items */}
                                    {calibrations.length === 0 && maintenance.length === 0 && (
                                        <div className="text-center py-10 text-slate-500">
                                            Nenhum histórico registrado para este instrumento.
                                        </div>
                                    )}

                                    {/* Render Calibrations */}
                                    {calibrations.map((cert) => (
                                        <div key={cert.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#1a1b1e] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            </div>

                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm backdrop-blur-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Calibração</span>
                                                    <time className="text-xs text-slate-500">{new Date(cert.issued_at).toLocaleDateString('pt-BR')}</time>
                                                </div>
                                                <div className="text-slate-200 font-medium mb-1">Certificado: {cert.certificate_number}</div>
                                                <div className="text-sm text-slate-400">Realizado por: {cert.issued_by}</div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Render Maintenance */}
                                    {maintenance.map((log) => (
                                        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#1a1b1e] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                <Wrench className="w-5 h-5 text-amber-400" />
                                            </div>

                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm backdrop-blur-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Manutenção ({log.maintenance_type})</span>
                                                    <time className="text-xs text-slate-500">{new Date(log.performed_at).toLocaleDateString('pt-BR')}</time>
                                                </div>
                                                <div className="text-slate-200 font-medium mb-1">{log.description}</div>
                                                <div className="text-sm text-slate-400">Resultado: {log.result}</div>
                                                {log.notes && <div className="text-xs text-slate-500 mt-2 italic border-l-2 border-slate-700 pl-2">{log.notes}</div>}
                                            </div>
                                        </div>
                                    ))}

                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* DOCS TAB */}
                    <TabsContent value="docs" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="glass border-white/5 bg-black/20">
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-200">Documentos</CardTitle>
                                <CardDescription className="text-slate-500">Manuais e certificados associados.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AssetDocumentUpload assetId={id} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
