"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { exportDataAction } from "@/app/actions/reports";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";

export default function ExportPage() {
    const [dataType, setDataType] = useState("samples");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        if (!startDate || !endDate) {
            toast.error("Por favor selecione o intervalo de datas");
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            toast.error("A data de fim não pode ser anterior à data de início");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.set("data_type", dataType);
            formData.set("start_date", startDate);
            formData.set("end_date", endDate);

            const result = await exportDataAction(formData);

            if (result.success && result.data) {
                // Convert to CSV
                const data = result.data as any[];
                if (data.length === 0) {
                    toast.error("Nenhum dado encontrado para o intervalo selecionado");
                    return;
                }

                const headers = Object.keys(data[0]);
                const csvContent = [
                    headers.join(","),
                    ...data.map(row =>
                        headers.map(h => {
                            const val = row[h];
                            if (typeof val === "string" && val.includes(",")) {
                                return `"${val}"`;
                            }
                            return val ?? "";
                        }).join(",")
                    ),
                ].join("\n");

                // Download
                const blob = new Blob([csvContent], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = result.filename || "export.csv";
                a.click();
                URL.revokeObjectURL(url);

                toast.success(`Exportação concluída: ${data.length} registos`);
            } else {
                toast.error("Falha na exportação");
            }
        } catch (error) {
            toast.error("Erro durante a exportação");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 px-6 pb-20">
            <PageHeader
                title="Exportação de Dados"
                overline="Advanced Data Extraction"
                description="Extração técnica de dados laboratoriais e de produção para análise externa em CSV/Excel."
                icon={<FileSpreadsheet className="h-4 w-4" />}
                backHref="/reports"
                variant="amber"
            />

            {/* Export Form */}
            <Card className="glass border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden max-w-2xl mx-auto">
                <CardHeader className="border-b border-slate-800 bg-slate-900/50 p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Download className="h-4 w-4 text-amber-500" />
                        </div>
                        <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 italic">Configuração de Extração</h1>
                    </div>
                    <CardTitle className="text-2xl font-black italic tracking-tighter text-white uppercase">Parâmetros de Exportação</CardTitle>
                    <CardDescription className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-[0.2em] leading-relaxed">
                        Selecione o domínio de dados e o período operacional.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="grid gap-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tipo de Dados</Label>
                        <SearchableSelect
                            value={dataType}
                            onValueChange={setDataType}
                            options={[
                                { value: "samples", label: "Amostras Laboratoriais" },
                                { value: "batches", label: "Lotes de Produção" },
                                { value: "ncs", label: "Não Conformidades" },
                                { value: "capas", label: "Ações Corretivas (CAPA)" },
                                { value: "analysis", label: "Resultados de Análise" },
                                { value: "pcc_logs", label: "Registos HACCP/PCC" },
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="grid gap-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data Inicial</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-slate-900 border-slate-800 text-white font-mono uppercase text-xs h-12 rounded-xl focus:ring-amber-500/50"
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data Final</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-slate-900 border-slate-800 text-white font-mono uppercase text-xs h-12 rounded-xl focus:ring-amber-500/50"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleExport}
                        disabled={loading}
                        className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-amber-600 hover:bg-amber-700 text-white border-amber-500 shadow-xl transition-all active:scale-95 group"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        ) : (
                            <Download className="h-5 w-5 mr-3 group-hover:bounce" />
                        )}
                        Executar Exportação CSV
                    </Button>

                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                        <p className="text-[9px] font-black text-amber-500/70 uppercase tracking-[0.2em] leading-normal text-center italic">
                            O ficheiro resultante utilizará codificação UTF-8 e separadores de vírgula padrão.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
