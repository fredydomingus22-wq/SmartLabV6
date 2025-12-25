"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Plus, Loader2, Microscope, ArrowRight } from "lucide-react";
import { createMicroSampleAction } from "@/app/actions/micro";

interface Tank {
    id: string;
    code: string;
    status: string;
    batch: {
        id: string;
        code: string;
        product: { id: string; name: string } | { id: string; name: string }[] | null;
    } | { id: string; code: string; product: { id: string; name: string } | { id: string; name: string }[] | null; }[] | null;
}

interface SampleType {
    id: string;
    name: string;
    code: string;
    test_category?: string;
}

interface SamplingPoint {
    id: string;
    name: string;
    code: string;
}

interface CreateMicroSampleDialogProps {
    sampleTypes: SampleType[];
    tanks: Tank[];
    samplingPoints: SamplingPoint[];
    plantId: string;
}

export function CreateMicroSampleDialog({ sampleTypes, tanks, samplingPoints, plantId }: CreateMicroSampleDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedTank, setSelectedTank] = useState<string>("");
    const [selectedSamplingPoint, setSelectedSamplingPoint] = useState<string>("");
    const router = useRouter();

    // Filter only microbiological sample types
    const microSampleTypes = sampleTypes.filter(t =>
        t.test_category === "microbiological" || t.test_category === "both"
    );

    const getProductName = (tank: Tank) => {
        const batch = Array.isArray(tank.batch) ? tank.batch[0] : tank.batch;
        if (!batch?.product) return "";
        if (Array.isArray(batch.product)) {
            return batch.product[0]?.name || "";
        }
        return batch.product.name || "";
    };

    const getBatch = (tank: Tank) => {
        return Array.isArray(tank.batch) ? tank.batch[0] : tank.batch;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("plant_id", plantId);

        const tank = tanks.find(t => t.id === selectedTank);
        const batch = tank ? getBatch(tank) : null;
        if (batch?.id) {
            formData.set("production_batch_id", batch.id);
        }
        if (selectedTank) {
            formData.set("intermediate_product_id", selectedTank);
        }
        if (selectedSamplingPoint) {
            formData.set("sampling_point_id", selectedSamplingPoint);
        }

        const result = await createMicroSampleAction(formData);

        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            setSelectedTank("");
            // Redirect to incubators page to start incubation
            router.push("/micro/incubators");
            router.refresh();
        } else {
            toast.error(result.message);
        }
    };



    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Amostra Micro
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Microscope className="h-5 w-5 text-purple-500" />
                        Registar Amostra Microbiológica
                    </DialogTitle>
                    <DialogDescription>
                        Criar amostra para análise microbiológica. Após criar, será redirecionado para iniciar a incubação.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4">
                        {/* Sample Code */}
                        <div className="grid gap-2">
                            <Label htmlFor="code">Código da Amostra</Label>
                            <Input
                                id="code"
                                name="code"
                                defaultValue="GERADO AUTOMATICAMENTE"
                                disabled
                                className="bg-slate-100 dark:bg-slate-800"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                O código oficial será gerado automaticamente com base no SKU do Produto e Tipo de Amostra.
                            </p>
                        </div>

                        {/* Sample Type - Only Micro Types */}
                        <div className="grid gap-2">
                            <Label htmlFor="sample_type_id">Tipo de Amostra *</Label>
                            <SearchableSelect
                                name="sample_type_id"
                                required
                                placeholder="Selecionar tipo..."
                                options={microSampleTypes.map((type) => ({
                                    label: `${type.name} (${type.code})`,
                                    value: type.id
                                }))}
                            />
                            {microSampleTypes.length === 0 && (
                                <p className="text-xs text-orange-500">
                                    Configure tipos de amostra com categoria &quot;Microbiológico&quot; em Tipos de Amostra
                                </p>
                            )}
                        </div>

                        {/* Tank Selection */}
                        <div className="grid gap-2">
                            <Label htmlFor="tank">Tanque (Produto Intermédio)</Label>
                            <SearchableSelect
                                value={selectedTank}
                                onValueChange={setSelectedTank}
                                placeholder="Selecionar tanque..."
                                options={tanks.map((tank) => ({
                                    label: `${tank.code} - ${getProductName(tank)} (${getBatch(tank)?.code || 'S/ Lote'})`,
                                    value: tank.id
                                }))}
                            />
                        </div>

                        {/* Sampling Point */}
                        <div className="grid gap-2">
                            <Label htmlFor="sampling_point">Ponto de Coleta</Label>
                            <SearchableSelect
                                value={selectedSamplingPoint}
                                onValueChange={setSelectedSamplingPoint}
                                placeholder="Selecionar ponto..."
                                options={samplingPoints.map((sp) => ({
                                    label: `${sp.name} (${sp.code})`,
                                    value: sp.id
                                }))}
                            />
                        </div>

                        {/* Collection Time */}
                        <div className="grid gap-2">
                            <Label htmlFor="collected_at">Data/Hora de Coleta</Label>
                            <Input
                                id="collected_at"
                                name="collected_at"
                                type="datetime-local"
                                defaultValue={new Date().toISOString().slice(0, 16)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || (!selectedTank && !selectedSamplingPoint) || microSampleTypes.length === 0}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Criar e Iniciar Incubação
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
