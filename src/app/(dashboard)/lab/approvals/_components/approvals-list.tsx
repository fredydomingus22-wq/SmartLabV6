"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ShieldCheck, Database, History, Search as SearchIcon, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { bulkTechnicalReviewAction, bulkFinalReleaseAction } from "@/app/actions/lab_modules/approvals";
import { IndustrialConfirmDialog } from "@/components/shared/industrial-confirm-dialog";
import { IndustrialGrid } from "@/components/defaults/industrial-grid";
import { RecentActivityCard } from "@/components/defaults/recent-activity-card";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Analysis {
    id: string;
    is_conforming: boolean | null;
    value_numeric: number | null;
    value_text: string | null;
    parameter?: {
        name: string;
        unit: string;
    };
}

interface Sample {
    id: string;
    code: string;
    type?: {
        name: string;
        code: string;
    };
    batch?: {
        code: string;
        product?: {
            name: string;
        };
    };
    lab_analysis?: Analysis[];
    created_at: string;
    updated_at: string;
    released_at?: string;
}

interface ApprovalsListProps {
    samples: Sample[];
    type: 'technical' | 'quality' | 'release';
    title: string;
    description: string;
    userRole: string;
}

const EmptyState = ({ title, description, icon: Icon }: { title: string, description: string, icon: React.ComponentType<{ className?: string }> }) => (
    <div className="flex flex-col items-center justify-center py-24 bg-slate-950/20 rounded-[3rem] border-2 border-dashed border-white/5 opacity-60 animate-in fade-in duration-700">
        <div className="h-20 w-20 flex items-center justify-center rounded-3xl bg-slate-900/50 border border-white/5 mb-6 shadow-inner">
            <Icon className="h-10 w-10 text-slate-700" />
        </div>
        <h4 className="text-xl font-bold text-slate-300 italic mb-2">{title}</h4>
        <p className="text-sm text-slate-500 font-medium max-w-[320px] text-center leading-relaxed">
            {description}
        </p>
    </div>
);

export function ApprovalsList({ samples, type, title, description, userRole }: ApprovalsListProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [actionType, setActionType] = useState<'approved' | 'rejected' | 'released'>('approved');
    const [targetIds, setTargetIds] = useState<string[]>([]); // New state for targeting specific samples
    const [quickFilterText, setQuickFilterText] = useState("");
    const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
    const [gridApi, setGridApi] = useState<any>(null);
    const router = useRouter();

    const handleBulkAction = (decision: 'approved' | 'rejected' | 'released') => {
        setActionType(decision);
        setTargetIds(selectedIds);
        setConfirmOpen(true);
    };

    const handleSingleAction = (sampleId: string, decision: 'approved' | 'rejected' | 'released') => {
        setActionType(decision);
        setTargetIds([sampleId]);
        setConfirmOpen(true);
    };

    const toggleRowExpansion = (id: string) => {
        setExpandedRowIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        // Important: reset row heights to reflect change
        if (gridApi) {
            gridApi.resetRowHeights();
        }
    };

    const onConfirm = async (reason: string, password?: string) => {
        try {
            let result;
            if (type === 'technical') {
                result = await bulkTechnicalReviewAction({
                    sampleIds: targetIds,
                    decision: actionType as 'approved' | 'rejected',
                    reason,
                    password
                });
            } else if (type === 'quality') {
                result = await bulkFinalReleaseAction({
                    sampleIds: targetIds,
                    decision: actionType as 'released' | 'rejected',
                    notes: reason,
                    password
                });
            }

            if (result?.success) {
                toast.success(`${targetIds.length} amostras processadas com sucesso.`);
                setSelectedIds(prev => prev.filter(id => !targetIds.includes(id)));
                setTargetIds([]);
                router.refresh();
            } else {
                toast.error("Ocorreu um erro ao processar as amostras.");
            }
        } catch (error) {
            toast.error("Erro crítico na operação.");
        }
    };

    // Generate Grid Data with Accordion Pattern (Insert Detail Rows)
    const gridData = useMemo(() => {
        const rows: any[] = [];
        samples.forEach(sample => {
            rows.push(sample);
            if (expandedRowIds.has(sample.id)) {
                rows.push({ ...sample, _isDetail: true, id: `${sample.id}_detail` });
            }
        });
        return rows;
    }, [samples, expandedRowIds]);

    const columnDefs = useMemo<ColDef[]>(() => [
        {
            headerName: "",
            field: "expand",
            width: 55,
            pinned: 'left',
            cellRenderer: (params: ICellRendererParams) => {
                if (params.data._isDetail) return null;
                return (
                    <div className="flex items-center justify-center h-full">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-xl transition-all duration-300 hover:bg-white/5",
                                expandedRowIds.has(params.data.id) ? "rotate-90 text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "text-slate-500 hover:text-white"
                            )}
                            onClick={() => toggleRowExpansion(params.data.id)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                );
            }
        },
        {
            headerName: "Identificação",
            field: "code",
            checkboxSelection: (params: any) => !params.data._isDetail,
            headerCheckboxSelection: true,
            width: 170,
            cellRenderer: (params: ICellRendererParams) => {
                if (params.data._isDetail) return null;
                return (
                    <div className="flex items-center gap-3 h-full">
                        <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-900/60 text-slate-400 border border-white/5 shadow-inner">
                            <Database className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col justify-center leading-none">
                            <span className="text-sm font-black text-white tracking-tighter">{params.value}</span>
                            <span className="text-[9px] font-black uppercase text-slate-500 mt-0.5 tracking-widest">{params.data.type?.code}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            headerName: "Lote de Produção",
            field: "batch.code",
            width: 150,
            filter: 'agTextColumnFilter',
            cellRenderer: (params: ICellRendererParams) => {
                if (params.data._isDetail) return null;
                return (
                    <div className="flex flex-col justify-center h-full leading-tight">
                        <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest leading-none mb-0.5">{params.value || "AVULSO"}</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase truncate max-w-[120px]">{params.data.batch?.product?.name || "Sem Produto"}</span>
                    </div>
                );
            }
        },
        {
            headerName: "Data",
            field: "created_at",
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
                if (params.data._isDetail) return null;
                return (
                    <div className="flex flex-col justify-center h-full text-[11px] font-bold text-slate-400 uppercase tracking-tighter leading-none">
                        <span className="mb-0.5">{format(new Date(params.value), "dd MMM, yyyy", { locale: pt })}</span>
                        <span className="text-[9px] text-slate-600 italic font-black uppercase tracking-widest font-mono">
                            {format(new Date(params.value), "HH:mm:ss", { locale: pt })}
                        </span>
                    </div>
                );
            }
        },
        {
            headerName: "Tipo",
            field: "type.name",
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
                if (params.data._isDetail) return null;
                return (
                    <div className="flex items-center h-full">
                        <Badge variant="outline" className="bg-slate-900/40 text-slate-300 border-white/10 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap px-2 pb-0.5">
                            {params.value}
                        </Badge>
                    </div>
                );
            }
        },
        {
            headerName: "Resultados",
            field: "lab_analysis",
            flex: 2,
            minWidth: 200,
            cellRenderer: (params: ICellRendererParams) => {
                if (params.data._isDetail) return null;
                const analyses = params.data.lab_analysis || [];
                const sortedAnalyses = [...analyses].sort((a, b) =>
                    (a.parameter?.name || "").localeCompare(b.parameter?.name || "")
                );

                return (
                    <div className="flex items-center h-full gap-1.5 px-1 overflow-visible">
                        {sortedAnalyses.map((a: Analysis) => (
                            <div
                                key={a.id}
                                title={`${a.parameter?.name}: ${a.value_numeric ?? a.value_text ?? '-'} ${a.parameter?.unit || ''} (${a.is_conforming ? 'OK' : 'OOS'})`}
                                className={cn(
                                    "h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-white/5 transition-all shadow-sm",
                                    a.is_conforming === true ? "bg-emerald-500 shadow-emerald-500/20" :
                                        a.is_conforming === false ? "bg-rose-500 shadow-rose-500/20 animate-pulse" : "bg-slate-700"
                                )}
                            />
                        ))}
                        {analyses.length === 0 && (
                            <span className="text-[10px] text-slate-600 font-bold uppercase italic tracking-widest">Sem Resultados</span>
                        )}
                    </div>
                );
            }
        },
        {
            headerName: "Ações",
            field: "id",
            width: 110,
            pinned: 'right',
            cellRenderer: (params: ICellRendererParams) => {
                if (params.data._isDetail) return null;
                return (
                    <div className="flex items-center justify-center gap-2 h-full">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-xl transition-all hover:scale-110",
                                type === 'technical' ? "text-purple-400 hover:bg-purple-500/10" : "text-emerald-400 hover:bg-emerald-500/10"
                            )}
                            onClick={() => handleSingleAction(params.value, type === 'technical' ? 'approved' : 'released')}
                            title={type === 'technical' ? "Assinar Revisto" : "Libertar para Mercado"}
                        >
                            <ShieldCheck className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all hover:scale-110"
                            onClick={() => handleSingleAction(params.value, 'rejected')}
                            title="Rejeitar"
                        >
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </div>
                );
            }
        }
    ], [type, expandedRowIds]);

    if (type === 'release') {
        const activityItems = samples.map((s: Sample) => ({
            id: s.id,
            title: s.type?.name || "Análise Laboratorial",
            code: s.code,
            status: "libertado",
            date: s.released_at || s.updated_at,
            severity: (s.lab_analysis?.some((a: Analysis) => a.is_conforming === false) ? 'major' : 'info') as 'major' | 'info',
            type: s.type?.code,
            href: `/lab/samples/${s.id}`
        }));

        return (
            <RecentActivityCard
                title="Arquivo de Libertação"
                description="Histórico de amostras validadas pelo QA e libertadas para mercado."
                items={activityItems}
                viewAllHref="/lab/history"
                viewAllLabel="Histórico Completo"
                className="bg-slate-950/20 border-white/5"
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass rounded-[2rem] border-white/5 bg-slate-900/40">
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-white italic tracking-tight">
                        {type === 'technical' ? "Assinatura Técnica" : type === 'quality' ? "Libertação de Mercado" : title}
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{description}</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group flex-1 md:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Procurar na grelha..."
                            value={quickFilterText}
                            onChange={(e) => setQuickFilterText(e.target.value)}
                            className="w-full h-10 pl-9 pr-4 bg-slate-950/40 border border-white/5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                        />
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                            <Button
                                onClick={() => handleBulkAction(type === 'technical' ? 'approved' : 'released')}
                                className={cn(
                                    "rounded-xl font-black px-6 shadow-xl transition-all hover:scale-105 active:scale-95",
                                    type === 'technical' ? "bg-purple-600 hover:bg-purple-500 shadow-purple-500/20" : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                                )}
                            >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                {type === 'technical' ? "Assinatura Técnica" : "Aprovação Final"} ({selectedIds.length})
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleBulkAction('rejected')}
                                className="rounded-xl font-black px-6 shadow-xl shadow-rose-950/20"
                            >
                                Rejeitar
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {gridData.length > 0 ? (
                <div className="h-[700px] w-full shadow-2xl rounded-[2.5rem] overflow-hidden border border-white/5 bg-slate-950/40 p-1">
                    <IndustrialGrid
                        rowData={gridData}
                        columnDefs={columnDefs}
                        quickFilterText={quickFilterText}
                        rowSelection="multiple"
                        suppressRowClickSelection={true}
                        onGridReady={(params) => setGridApi(params.api)}
                        pagination={false}
                        alwaysShowVerticalScroll={true}
                        isFullWidthRow={(params) => params.rowNode.data._isDetail}
                        fullWidthCellRenderer={(params: ICellRendererParams) => {
                            const analyses = params.data.lab_analysis || [];
                            return (
                                <div className="w-full h-full bg-slate-900/30 border-y border-white/5 flex items-center px-16 relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/20" />

                                    <div className="flex items-center gap-2 mr-6 shrink-0">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Resultados<br />Técnicos</span>
                                        <div className="h-6 w-px bg-white/10 mx-2" />
                                    </div>

                                    <div className="flex items-center gap-4 flex-1 overflow-x-auto no-scrollbar py-2 min-w-0 mask-linear-fade">
                                        {analyses.map((a: Analysis) => (
                                            <div
                                                key={a.id}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-1.5 rounded-lg border transition-all shrink-0",
                                                    "bg-slate-950/40 border-white/5 hover:border-white/10 shadow-sm",
                                                    a.is_conforming === false && "border-rose-500/20 bg-rose-500/5 shadow-rose-500/10"
                                                )}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest truncate max-w-[100px]">{a.parameter?.name}</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className={cn(
                                                            "text-sm font-black italic tracking-tighter leading-none",
                                                            a.is_conforming === false ? "text-rose-400" : "text-white"
                                                        )}>
                                                            {a.value_numeric ?? a.value_text ?? "-"}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-600 uppercase font-mono">{a.parameter?.unit}</span>
                                                    </div>
                                                </div>

                                                <div className={cn(
                                                    "h-1.5 w-1.5 rounded-full shadow-sm",
                                                    a.is_conforming === true ? "bg-emerald-500 shadow-emerald-500/50" :
                                                        a.is_conforming === false ? "bg-rose-500 animate-pulse shadow-rose-500/50" : "bg-slate-700"
                                                )} />
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full text-slate-600 hover:text-white hover:bg-white/5"
                                        onClick={() => toggleRowExpansion(params.data.id.replace('_detail', ''))}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            );
                        }}
                        onSelectionChanged={(event) => {
                            const selected = event.api.getSelectedRows().filter((r: any) => !r._isDetail);
                            setSelectedIds(selected.map((row: any) => row.id));
                        }}
                        getRowHeight={(params) => {
                            if (params.data._isDetail) {
                                return 80;
                            }
                            return 64;
                        }}
                        headerHeight={48}
                        defaultColDef={{
                            sortable: true,
                            filter: true,
                            resizable: true,
                            flex: 1,
                            minWidth: 100
                        }}
                    />
                </div>
            ) : (
                <EmptyState
                    title={type === 'technical' ? "Nenhuma Revisão Pendente" : "Lista de Libertação Vazia"}
                    description={type === 'technical'
                        ? "Nenhum resultado analítico pendente de assinatura técnica no momento."
                        : "Não existem amostras validadas aguardando libertação final para mercado."
                    }
                    icon={type === 'technical' ? Database : ShieldCheck}
                />
            )}

            <IndustrialConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={onConfirm}
                title={actionType === 'rejected' ? "Rejeitar Seleção" : `${title} em Lote`}
                description={`Está prestes a processar ${targetIds.length} amostras de uma só vez. Esta ação será registada no audit trail com a sua assinatura eletrónica.`}
                confirmLabel={actionType === 'rejected' ? "Rejeitar e Assinar" : "Validar e Assinar"}
                variant={actionType === 'rejected' ? "destructive" : "success"}
                requireReason={true}
                requireSignature={true}
            />
        </div>
    );
}
