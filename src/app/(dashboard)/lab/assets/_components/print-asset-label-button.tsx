"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintAssetLabelButtonProps {
    asset: {
        code: string;
        name: string;
        next_calibration_date: string | null;
    };
}

export function PrintAssetLabelButton({ asset }: PrintAssetLabelButtonProps) {
    const handlePrint = () => {
        const nextCalDate = asset.next_calibration_date
            ? new Date(asset.next_calibration_date).toLocaleDateString('pt-BR')
            : "N/A";

        const printWindow = window.open('', '_blank', 'width=400,height=300');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Etiqueta - ${asset.code}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Arial', sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: #f5f5f5;
                    }
                    .label {
                        width: 80mm;
                        padding: 8mm;
                        background: white;
                        border: 2px solid #000;
                        text-align: center;
                    }
                    .code {
                        font-size: 24px;
                        font-weight: bold;
                        letter-spacing: 2px;
                        margin-bottom: 4mm;
                        border-bottom: 1px solid #ccc;
                        padding-bottom: 4mm;
                    }
                    .name {
                        font-size: 14px;
                        margin-bottom: 4mm;
                        color: #333;
                    }
                    .calibration {
                        font-size: 12px;
                        color: #666;
                    }
                    .calibration strong {
                        color: #000;
                        font-size: 14px;
                    }
                    @media print {
                        body { background: white; }
                        .label { border: 1px solid #000; }
                    }
                </style>
            </head>
            <body>
                <div class="label">
                    <div class="code">${asset.code}</div>
                    <div class="name">${asset.name}</div>
                    <div class="calibration">
                        Próxima Calibração:<br/>
                        <strong>${nextCalDate}</strong>
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <Button
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-slate-300"
            onClick={handlePrint}
        >
            <Printer className="h-4 w-4 mr-2" />
            Etiqueta
        </Button>
    );
}
