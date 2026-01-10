"use client";

import { useState, Fragment } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronDown, ChevronRight, Eye, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { bulkTechnicalReviewAction, bulkFinalReleaseAction } from "@/app/actions/lab_modules/approvals";
import { IndustrialConfirmDialog } from "@/components/shared/industrial-confirm-dialog";

interface ApprovalsListProps {
    samples: any[];
    type: 'technical' | 'quality' | 'release';
    title: string;
    description: string;
}

export function ApprovalsList({ samples, type, title, description }: ApprovalsListProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [actionType, setActionType] = useState<'approved' | 'rejected' | 'released'>('approved');
    const router = useRouter();

    const toggleSelectAll = () => {
        if (selectedIds.length === samples.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(samples.map(s => s.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkAction = (decision: 'approved' | 'rejected' | 'released') => {
        setActionType(decision);
        setConfirmOpen(true);
    };

    const onConfirm = async (reason: string, password?: string) => {
        try {
            let result;
            if (type === 'technical') {
                result = await bulkTechnicalReviewAction({
                    sampleIds: selectedIds,
                    decision: actionType as 'approved' | 'rejected',
                    reason,
                    password
                });
            } else if (type === 'quality') {
                result = await bulkFinalReleaseAction({
                    sampleIds: selectedIds,
                    decision: actionType as 'released' | 'rejected',
                    notes: reason,
                    password
                });
            }

            if (result?.success) {
                toast.success(`${selectedIds.length} amostras processadas com sucesso.`);
                setSelectedIds([]);
                router.refresh();
            } else {
                toast.error("Ocorreu um erro ao processar as amostras.");
            }
        } catch (error) {
            toast.error("Erro crítico na operação.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass rounded-[2rem] border-white/5 bg-slate-900/40">
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-white">{title}</h2>
                    <p className="text-sm text-slate-400 font-medium">{description}</p>
                </div>
                {selectedIds.length > 0 && type !== 'release' && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                        <Button
                            onClick={() => handleBulkAction(type === 'technical' ? 'approved' : 'released')}
                            className={cn(
                                "rounded-xl font-black px-6 shadow-lg",
                                type === 'technical' ? "bg-purple-600 hover:bg-purple-700" : "bg-emerald-600 hover:bg-emerald-700"
                            )}
                        >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            {type === 'technical' ? "Rever e Assinar" : "Aprovar e Libertar"} ({selectedIds.length})
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => handleBulkAction('rejected')}
                            className="rounded-xl font-black px-6"
                        >
                            Rejeitar
                        </Button>
                    </div>
                )}
            </div>

            <div className="glass rounded-[2rem] border-white/5 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-950/50">
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedIds.length === samples.length && samples.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                    className="border-slate-700 data-[state=checked]:bg-blue-600"
                                />
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amostra / Batch</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resultados</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {samples.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-slate-500 italic">
                                    Nenhuma amostra pendente nesta fase.
                                </TableCell>
                            </TableRow>
                        ) : (
                            samples.map(sample => (
                                <Fragment key={sample.id}>
                                    <TableRow className="border-white/5 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setExpandedId(expandedId === sample.id ? null : sample.id)}>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.includes(sample.id)}
                                                onCheckedChange={() => toggleSelect(sample.id)}
                                                className="border-slate-700 data-[state=checked]:bg-blue-600"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-200">{sample.code}</span>
                                                <span className="text-[10px] font-mono text-slate-500 uppercase">{sample.batch?.code || "No Batch"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-slate-400">
                                            {format(new Date(sample.created_at), "dd MMM, HH:mm", { locale: pt })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-black uppercase tracking-tighter">
                                                {sample.type?.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex -space-x-2">
                                                {sample.lab_analysis?.map((a: any) => (
                                                    <div
                                                        key={a.id}
                                                        className={cn(
                                                            "h-3 w-3 rounded-full border-2 border-slate-900 ring-1 ring-white/10",
                                                            a.is_conforming === true ? "bg-emerald-500" : a.is_conforming === false ? "bg-rose-500" : "bg-slate-700"
                                                        )}
                                                        title={`${a.parameter?.name}: ${a.value_numeric ?? a.value_text}`}
                                                    />
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {expandedId === sample.id ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                                        </TableCell>
                                    </TableRow>
                                    {expandedId === sample.id && (
                                        <TableRow className="bg-slate-950/40 border-none">
                                            <TableCell colSpan={6} className="p-0">
                                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    {sample.lab_analysis?.map((a: any) => (
                                                        <div key={a.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{a.parameter?.name}</span>
                                                                {a.is_conforming === true ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : a.is_conforming === false ? <XCircle className="h-3 w-3 text-rose-400" /> : null}
                                                            </div>
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-lg font-black text-white">{a.value_numeric ?? a.value_text ?? "—"}</span>
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{a.parameter?.unit}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="flex items-center justify-end lg:col-span-3 pt-2">
                                                        <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300" asChild>
                                                            <a href={`/lab/samples/${sample.id}`}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Ver Detalhes Completos
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <IndustrialConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={onConfirm}
                title={actionType === 'rejected' ? "Rejeitar Seleção" : `${title} em Lote`}
                description={`Está prestes a processar ${selectedIds.length} amostras de uma só vez. Esta ação será registada no audit trail com a sua assinatura eletrónica.`}
                confirmLabel={actionType === 'rejected' ? "Rejeitar e Assinar" : "Validar e Assinar"}
                variant={actionType === 'rejected' ? "destructive" : "success"}
                requireReason={true}
                requireSignature={true}
            />
        </div>
    );
}
