"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, AlertCircle, FileCheck, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReportDossierProps {
    batchId: string;
    batchCode: string;
    productName: string;
}

export default function ReportDossier({ batchId, batchCode, productName }: ReportDossierProps) {
    const [generating, setGenerating] = useState<string | null>(null);

    const reports = [
        {
            id: "batch_record",
            name: "Registo de Lote (BMR)",
            description: "Dossier completo de produção e rastreabilidade",
            status: "ready", // Mocked for now
            type: "batch_record"
        },
        {
            id: "coa",
            name: "Certificado de Análise",
            description: "Documento oficial de qualidade",
            status: "ready",
            type: "coa",
            // Typically requires a sampleId, handling via batch context in future
        }
    ];

    const handleGenerate = async (reportType: string) => {
        setGenerating(reportType);
        try {
            const response = await fetch("/api/reports/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reportType,
                    params: { batchId }
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Failed to generate");

            // Handle Download
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${data.pdf}`;
            link.download = data.filename || 'report.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Relatório gerado com sucesso!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setGenerating(null);
        }
    };

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 italic">
                    <ClipboardList className="h-3 w-3" />
                    Documentação Disponível para Emissão
                </h2>
                <Badge variant="outline" className="border-slate-800 text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 bg-slate-900/50">
                    LOTE: {batchCode}
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reports.map((report) => (
                    <Card key={report.id} className="glass border-slate-800 shadow-xl rounded-[2rem] overflow-hidden group hover:border-indigo-500/50 transition-all">
                        <CardHeader className="border-b border-slate-800 bg-slate-900/50 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-indigo-500/30 transition-colors">
                                    <FileText className="h-5 w-5 text-indigo-500" />
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "font-black uppercase tracking-[0.2em] text-[8px] italic px-3 py-1 border shadow-inner",
                                        report.status === 'ready' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                    )}
                                >
                                    {report.status === 'ready' ? 'PDF Disponível' : 'Em Processamento'}
                                </Badge>
                            </div>
                            <CardTitle className="text-xl font-black italic tracking-tighter text-white uppercase group-hover:text-indigo-400 transition-colors">
                                {report.name}
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-[0.2em] leading-relaxed">
                                {report.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Button
                                className="w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-lg group active:scale-95 transition-all"
                                onClick={() => handleGenerate(report.type)}
                                disabled={!!generating}
                            >
                                {generating === report.type ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Download className="h-4 w-4 mr-2 group-hover:bounce" />
                                )}
                                Gerar Relatório PDF
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
