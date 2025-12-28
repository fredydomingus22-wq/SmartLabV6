"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, FileSpreadsheet, AlertCircle } from "lucide-react";
import { bulkImportParametersAction } from "@/app/actions/parameters";
import { toast } from "sonner";

const CSV_EXAMPLE = `name,code,unit,category,method,precision
pH,PH,pH,physico_chemical,Potenciométrico,2
Brix,BRIX,°Bx,physico_chemical,Refratométrico,1
Acidez,ACID,%,physico_chemical,Titulação,2
Coliformes,COLI,UFC/mL,microbiological,ISO 4832,0`;

export function BulkImportDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [csvData, setCsvData] = useState("");
    const [errors, setErrors] = useState<string[]>([]);

    function parseCSV(csv: string): Array<{
        name: string;
        code: string;
        unit?: string;
        category?: string;
        method?: string;
        precision?: number;
    }> {
        const lines = csv.trim().split("\n");
        if (lines.length < 2) return [];

        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        const parameters = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map(v => v.trim());
            const param: any = {};

            headers.forEach((header, idx) => {
                if (values[idx]) {
                    if (header === "precision") {
                        param[header] = parseInt(values[idx], 10);
                    } else {
                        param[header] = values[idx];
                    }
                }
            });

            if (param.name && param.code) {
                parameters.push(param);
            }
        }

        return parameters;
    }

    async function handleImport() {
        setLoading(true);
        setErrors([]);

        const parameters = parseCSV(csvData);

        if (parameters.length === 0) {
            toast.error("No valid parameters found in CSV");
            setLoading(false);
            return;
        }

        const result = await bulkImportParametersAction(parameters);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            setCsvData("");
        } else {
            toast.warning(result.message);
            setErrors(result.errors);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium shadow-none transition-all">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Bulk Import Parameters
                    </DialogTitle>
                    <DialogDescription>
                        Import multiple QA parameters from CSV format
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-muted p-3 rounded-lg text-sm">
                        <p className="font-medium mb-2">CSV Format:</p>
                        <pre className="text-xs overflow-x-auto whitespace-pre">
                            {CSV_EXAMPLE}
                        </pre>
                    </div>

                    <div className="space-y-2">
                        <Textarea
                            placeholder="Paste your CSV data here..."
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                            rows={8}
                            className="font-mono text-sm"
                        />
                    </div>

                    {errors.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-red-600 mb-2">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-medium">Import Errors:</span>
                            </div>
                            <ul className="text-sm text-red-600 space-y-1">
                                {errors.map((err, i) => (
                                    <li key={i}>• {err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={loading || !csvData.trim()}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Import Parameters
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
