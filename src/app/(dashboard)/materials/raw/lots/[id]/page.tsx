import { getLotDetails } from "@/lib/queries/raw-materials";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Layers,
    Package,
    ArrowLeft,
    Calendar,
    AlertTriangle,
    FileText,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Info,
    Truck,
    MapPin,
    ShieldCheck,
    Clock,
    FileSearch,
    Download,
    TrendingDown,
    SearchCode
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ConsumeLotDialog } from "../../_components/consume-lot-dialog";
// Note: approveLotAction is available but we'll implement a clean UI for it here if needed, 
// or just show the status if the user is not authorized to change it.
import { approveLotAction } from "@/app/actions/raw-materials";
import { LotApprovalCard } from "../../../_components/lot-approval-card";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    in_use: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    quarantine: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    expired: "bg-slate-500/10 text-slate-400 border-slate-800",
    exhausted: "bg-slate-500/5 text-slate-500 border-slate-800 opacity-50",
};

export default async function LotDetailPage({ params }: PageProps) {
    const { id } = await params;

    // try {
    const { lot, checks } = await getLotDetails(id);

    if (!lot) notFound();

    const material = lot.raw_material;
    const supplier = lot.supplier;

    return (
        <div className="container py-8 space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`/materials/raw/${material?.id}`}>
                        <Button variant="ghost" size="icon" className="text-slate-400 rounded-full hover:bg-slate-900 border border-slate-800/50">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-[10px] uppercase tracking-widest ${statusColors[lot.status]}`}>
                                Lote {lot.status}
                            </Badge>
                            <span className="text-[10px] font-mono text-slate-600">ID: {lot.id.slice(0, 8)}</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            {lot.lot_code}
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            Matéria-Prima: <Link href={`/materials/raw/${material?.id}`} className="text-blue-400 hover:underline">{material?.name} ({material?.code})</Link>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {lot.status === 'approved' && lot.quantity_remaining > 0 && (
                        <ConsumeLotDialog
                            lotId={lot.id}
                            lotCode={lot.lot_code}
                            maxQuantity={lot.quantity_remaining}
                            unit={lot.unit}
                        />
                    )}
                    <Button variant="outline" className="border-emerald-800 bg-emerald-900/10 text-emerald-400 hover:bg-emerald-900/20" asChild>
                        <Link href={`/traceability/forward?q=${encodeURIComponent(lot.lot_code)}`}>
                            <SearchCode className="h-4 w-4 mr-2" />
                            Rastrear Lote
                        </Link>
                    </Button>
                    {lot.coa_file_url && (
                        <Button variant="outline" className="border-slate-800 bg-slate-900/50 text-slate-300 hover:text-white" asChild>
                            <a href={lot.coa_file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                COA / Certificado
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left & Middle Column: Lot Info & Traceability */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <TrendingDown className="h-4 w-4 text-blue-500" />
                                    Stock & Dimensões
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs text-slate-500">Saldo Atual</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-white">{lot.quantity_remaining}</span>
                                        <span className="text-sm font-bold text-slate-600 uppercase">{lot.unit}</span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${(lot.quantity_remaining / lot.quantity_received) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-600 tracking-tighter">
                                    <span>Original: {lot.quantity_received} {lot.unit}</span>
                                    <span>Consumido: {(lot.quantity_received - lot.quantity_remaining).toFixed(2)} {lot.unit}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    Datas e Validade
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-slate-900 text-slate-400">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Receção</p>
                                        <p className="text-sm font-bold text-white">
                                            {lot.received_date ? format(new Date(lot.received_date), "dd MMMM yyyy", { locale: pt }) : "Não registada"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${lot.status === 'expired' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-900 text-slate-400'}`}>
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Validade</p>
                                        <p className={`text-sm font-bold ${lot.status === 'expired' ? 'text-rose-500' : 'text-white'}`}>
                                            {lot.expiry_date ? format(new Date(lot.expiry_date), "dd MMMM yyyy", { locale: pt }) : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Suppliers & Origin */}
                    <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                        <CardHeader className="bg-slate-900/20 border-b border-slate-800/50">
                            <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Truck className="h-4 w-4 text-slate-500" />
                                Proveniência e Logística
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-800/50">
                                <div className="p-6 space-y-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Fornecedor</span>
                                        <p className="text-sm font-black text-white">{supplier?.name || "Fornecedor desconhecido"}</p>
                                        <p className="text-xs text-slate-500 mb-2">{supplier?.code || "-"}</p>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Contacto</span>
                                        <p className="text-xs text-slate-400 italic">{supplier?.contact_name || "NÃO DISPONÍVEL"}</p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Acondicionamento</span>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-blue-500" />
                                            <p className="text-sm font-bold text-slate-200">{lot.storage_location || "Armazém Principal"}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Observações</span>
                                        <p className="text-xs text-slate-400 italic leading-relaxed">{lot.notes || "Sem observações para este lote."}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quality Checks Table */}
                    <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50">
                            <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileSearch className="h-4 w-4 text-emerald-500" />
                                Verificações de Qualidade (QC)
                            </CardTitle>
                            <Badge variant="outline" className="text-[9px] border-slate-800 text-slate-500 uppercase">
                                {checks.length} Parâmetros
                            </Badge>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800/50 bg-slate-900/10">
                                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Parâmetro</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Referência</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Realizado</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/30">
                                    {checks.map((c: any) => (
                                        <tr key={c.id}>
                                            <td className="p-4">
                                                <p className="text-sm font-bold text-slate-200">{c.check_name}</p>
                                                <p className="text-[10px] text-slate-500 italic">{c.parameter?.name}</p>
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge variant="outline" className="border-slate-800 bg-slate-900/50 text-slate-500 font-mono text-[10px]">
                                                    {c.expected_value} {c.parameter?.unit}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="text-sm font-black text-white">
                                                    {c.actual_value} {c.parameter?.unit}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {c.is_pass ? (
                                                    <div className="flex items-center justify-center gap-1 text-emerald-500">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="text-[10px] font-black uppercase">Conforme</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1 text-rose-500">
                                                        <XCircle className="h-4 w-4" />
                                                        <span className="text-[10px] font-black uppercase">Não Conf.</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {checks.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center">
                                                <p className="text-slate-600 italic text-sm">Nenhum check qualitativo registado para este lote.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Right Column: COA & Actions */}
                <div className="space-y-6">
                    <LotApprovalCard
                        lotId={lot.id}
                        type="raw"
                        currentStatus={lot.status}
                        qcNotes={(lot as any).qc_notes}
                    />

                    <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="h-4 w-4 text-amber-500" />
                                Boletim de Análise / COA
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {lot.certificate_number ? (
                                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-amber-500/80 uppercase">Nº do Certificado</p>
                                        <p className="text-sm font-black text-white">{lot.certificate_number}</p>
                                    </div>
                                    <ShieldCheck className="h-6 w-6 text-amber-500/40" />
                                </div>
                            ) : (
                                <div className="p-4 text-center border border-dashed border-slate-800 rounded-xl opacity-50">
                                    <p className="text-xs text-slate-500 italic">Sem número de certificado</p>
                                </div>
                            )}

                            {lot.coa_file_url ? (
                                <div className="space-y-2">
                                    <div className="aspect-[3/4] rounded-xl bg-slate-900 overflow-hidden relative group border border-slate-800">
                                        <iframe
                                            src={`${lot.coa_file_url}#toolbar=0`}
                                            className="w-full h-full border-none opacity-40 group-hover:opacity-70 transition-opacity"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Button variant="secondary" className="bg-slate-950/80 border-slate-700 text-white" asChild>
                                                <a href={lot.coa_file_url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Abrir Visualização
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                                    <FileText className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                                    <p className="text-xs text-slate-600 font-medium">Nenhum arquivo de COA anexado.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/40 border-slate-800 shadow-xl border-t-4 border-t-amber-500/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-tighter">
                                Informação Adicional
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500 uppercase">Organização ID</span>
                                    <span className="text-slate-400 font-mono italic truncate ml-4">{lot.organization_id}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500 uppercase">Unidade Operativa</span>
                                    <span className="text-slate-400 font-mono italic truncate ml-4">{lot.plant_id}</span>
                                </div>
                            </div>
                            <div className="pt-4 mt-4 border-t border-slate-800/50">
                                <div className="flex items-center gap-2 text-rose-500/50">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span className="text-[10px] font-black uppercase italic">Modificação Restrita ao CQ</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
    // } catch (error) {
    //     console.error("Error loading lot details:", error);
    //     notFound();
    // }
}
