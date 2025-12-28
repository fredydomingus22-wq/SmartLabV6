"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2, Printer, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface GenerateBatchReportButtonProps {
    batchId: string;
    batchNumber: string;
}

export function GenerateBatchReportButton({ batchId, batchNumber }: GenerateBatchReportButtonProps) {
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const response = await fetch("/api/reports/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reportType: "batch_record",
                    params: { batchId }
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Failed to generate report");

            // Handle Download
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${data.pdf}`;
            link.download = data.filename || `BMR_${batchNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Batch Record gerado com sucesso!");
        } catch (error: any) {
            console.error("Report generation error:", error);
            toast.error("Erro ao gerar PDF: " + error.message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <FileText className="h-4 w-4" />
            )}
            Download BMR (PDF)
        </Button>
    );
}
