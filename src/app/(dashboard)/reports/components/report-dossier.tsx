"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reports.map((report) => (
                    <Card key={report.id} className="glass hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-indigo-500" />
                                    {report.name}
                                </CardTitle>
                                <Badge variant={report.status === "ready" ? "default" : "secondary"}>
                                    {report.status}
                                </Badge>
                            </div>
                            <CardDescription>{report.description}</CardDescription>
                        </CardHeader>
                        <CardFooter className="pt-4">
                            <Button
                                className="w-full gap-2"
                                onClick={() => handleGenerate(report.type)}
                                disabled={!!generating}
                            >
                                {generating === report.type ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                Gerar PDF
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
