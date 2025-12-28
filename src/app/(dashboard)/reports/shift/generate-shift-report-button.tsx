"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GenerateShiftReportButtonProps {
    date: string;
    shiftId: string;
    disabled?: boolean;
}

export function GenerateShiftReportButton({ date, shiftId, disabled }: GenerateShiftReportButtonProps) {
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const response = await fetch("/api/reports/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reportType: "shift_report",
                    params: { date, shiftId }
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Failed to generate report");

            // Handle Download
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${data.pdf}`;
            link.download = data.filename || `ShiftReport_${date}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Relatório gerado com sucesso!");
        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao gerar PDF: " + error.message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Button
            onClick={handleGenerate}
            disabled={disabled || generating}
            className="gap-2"
        >
            {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <FileDown className="h-4 w-4" />
            )}
            Baixar PDF
        </Button>
    );
}
