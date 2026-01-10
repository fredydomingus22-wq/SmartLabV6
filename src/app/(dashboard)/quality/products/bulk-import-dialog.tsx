"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { bulkImportProductsAction } from "@/app/actions/products";
import { toast } from "sonner";

export function BulkImportDialog() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [csvData, setCsvData] = useState("");
    const [errors, setErrors] = useState<string[]>([]);

    async function handleImport() {
        if (!csvData.trim()) {
            toast.error("Cole os dados CSV");
            return;
        }

        setLoading(true);
        setErrors([]);

        // Parse CSV
        const lines = csvData.trim().split("\n");
        const products: Array<{
            name: string;
            sku: string;
            description?: string;
            category?: string;
            unit?: string;
        }> = [];

        for (let i = 1; i < lines.length; i++) { // Skip header
            const cols = lines[i].split(",").map(c => c.trim());
            if (cols.length >= 2) {
                products.push({
                    sku: cols[0],
                    name: cols[1],
                    category: cols[2] || "final",
                    unit: cols[3] || "unit",
                    description: cols[4] || undefined,
                });
            }
        }

        if (products.length === 0) {
            toast.error("Nenhum produto válido encontrado no CSV");
            setLoading(false);
            return;
        }

        const result = await bulkImportProductsAction(products);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            setCsvData("");
            router.refresh();
        } else {
            toast.error(result.message);
            if (result.errors.length > 0) {
                setErrors(result.errors);
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" suppressHydrationWarning>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Importar Produtos via CSV</DialogTitle>
                    <DialogDescription>
                        Cole dados CSV com colunas: SKU, Nome, Categoria, Unidade, Descrição
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-lg text-sm font-mono">
                        <p className="font-bold mb-1">Formato esperado:</p>
                        <p>SKU,Nome,Categoria,Unidade,Descrição</p>
                        <p>PROD-001,Sumo Laranja 1L,final,L,Sumo natural</p>
                        <p>PROD-002,Base Pasteurizada,intermediate,kg,</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="csv">Dados CSV</Label>
                        <Textarea
                            id="csv"
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                            placeholder="Cole os dados CSV aqui..."
                            rows={10}
                            className="font-mono text-sm"
                        />
                    </div>

                    {errors.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="font-medium text-red-700 mb-2">Erros:</p>
                            <ul className="text-sm text-red-600 space-y-1">
                                {errors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleImport} disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Importar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
