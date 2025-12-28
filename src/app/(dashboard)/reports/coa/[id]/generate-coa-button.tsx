"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface GenerateCoAButtonProps {
    sampleId: string;
    sampleCode: string;
}

export function GenerateCoAButton({ sampleId, sampleCode }: GenerateCoAButtonProps) {
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const response = await fetch("/api/reports/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reportType: "coa",
                    params: { sampleId }
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Failed to generate CoA");

            // Handle Download
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${data.pdf}`;
            link.download = data.filename || `CoA_${sampleCode}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("CoA generated and downloaded!");
        } catch (error: any) {
            console.error("PDF generation error:", error);
            toast.error("Failed to generate PDF: " + error.message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <Download className="h-4 w-4 mr-2" />
            )}
            {generating ? "Generating..." : "Download CoA"}
        </Button>
    );
}
