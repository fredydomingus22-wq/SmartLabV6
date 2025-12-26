import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ClipboardList,
    ArrowLeft,
    AlertTriangle,
    Target,
    Beaker,
    Microscope
} from "lucide-react";
import Link from "next/link";
import { ProductSelector } from "./product-selector";
import { SpecDialog } from "./spec-dialog";
import { CopySpecsDialog } from "./copy-specs-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isFinishedProduct, isIntermediateProduct } from "@/lib/constants/lab";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ product?: string }>;
}

export default async function SpecificationsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const supabase = await createClient();

    // Fetch sample types
    const { data: sampleTypes } = await supabase
        .from("sample_types")
        .select("id, name, code")
        .order("name");

    // Fetch products
    const { data: products } = await supabase
        .from("products")
        .select("id, name, sku, status")
        .order("name");

    const selectedProductId = params.product;

    // Fetch specifications for selected product
    let specifications: any[] = [];
    if (selectedProductId) {
        const { data } = await supabase
            .from("product_specifications")
            .select(`
                id,
                qa_parameter_id,
                min_value,
                max_value,
                target_value,
                text_value_expected,
                is_critical,
                sampling_frequency,
                test_method_override,
                sample_type_id,
                created_at,
                updated_at,
                parameter:qa_parameters(id, name, code, unit, category, method),
                sample_type:sample_types(id, name, code)
            `)
            .eq("product_id", selectedProductId)
            .order("created_at");

        specifications = data || [];
    }

    // Get available parameters (not already in specs)
    let availableParameters: any[] = [];
    if (selectedProductId) {
        const { data: params } = await supabase
            .from("qa_parameters")
            .select("id, name, code, unit, category")
            .eq("status", "active")
            .order("name");

        availableParameters = params || [];
    }

    // Get selected product info
    const selectedProduct = products?.find(p => p.id === selectedProductId);

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            physico_chemical: "bg-blue-100 text-blue-700",
            microbiological: "bg-green-100 text-green-700",
            sensory: "bg-purple-100 text-purple-700",
            other: "bg-gray-100 text-gray-700"
        };
        return colors[cat] || "bg-gray-100 text-gray-700";
    };

    const getFrequencyLabel = (freq: string) => {
        const labels: Record<string, string> = {
            per_batch: "Por Lote",
            hourly: "Horária",
            per_shift: "Por Turno",
            daily: "Diária",
            weekly: "Semanal"
        };
        return labels[freq] || freq;
    };

    // Fetch sampling points for polymorphic specs
    const { data: samplingPoints } = await supabase
        .from("sampling_points")
        .select("id, name, code")
        .eq("status", "active")
        .order("name");

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/quality">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <ClipboardList className="h-8 w-8 text-purple-500" />
                            Especificações de Produto
                        </h1>
                        <p className="text-muted-foreground">
                            Defina os limites de qualidade para cada produto
                        </p>
                    </div>
                </div>
                {selectedProductId && (
                    <div className="flex gap-2">
                        <CopySpecsDialog
                            products={products || []}
                            currentProductId={selectedProductId}
                        />
                        <SpecDialog
                            mode="create"
                            productId={selectedProductId}
                            availableParameters={availableParameters}
                            sampleTypes={sampleTypes || []}
                            samplingPoints={samplingPoints || []}
                        />
                    </div>
                )}
            </div>

            {/* Product Selector */}
            <Card className="glass">
                <CardContent className="pt-6">
                    <ProductSelector
                        products={products || []}
                        selectedProductId={selectedProductId}
                    />
                </CardContent>
            </Card>

            {!selectedProductId ? (
                <Card className="glass">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Selecione um produto para ver e gerir as especificações.</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Specifications Content */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold">Specifications</h2>
                        </div>

                        {specifications.length === 0 ? (
                            <Card className="glass">
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Nenhuma especificação definida para este produto.</p>
                                    <p className="text-sm">Adicione especificações ou copie de outro produto.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <Tabs defaultValue="finished" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                                    <TabsTrigger value="finished">Final Products</TabsTrigger>
                                    <TabsTrigger value="intermediates">Intermediates (IP)</TabsTrigger>
                                    <TabsTrigger value="others">Monitoring / Others</TabsTrigger>
                                </TabsList>

                                {/* Final Product Tab */}
                                <TabsContent value="finished" className="mt-4">
                                    <LabTypeTabs
                                        specs={specifications.filter(s =>
                                            !s.sample_type_id ||
                                            (s.sample_type?.code ? isFinishedProduct(s.sample_type.code) : false)
                                        )}
                                        productId={selectedProductId}
                                        sampleTypes={sampleTypes || []}
                                        samplingPoints={samplingPoints || []}
                                        getCategoryColor={getCategoryColor}
                                        getFrequencyLabel={getFrequencyLabel}
                                    />
                                </TabsContent>

                                {/* Intermediates Tab */}
                                <TabsContent value="intermediates" className="mt-4">
                                    <LabTypeTabs
                                        specs={specifications.filter(s =>
                                            s.sample_type_id &&
                                            (s.sample_type?.code ? isIntermediateProduct(s.sample_type.code) : false)
                                        )}
                                        productId={selectedProductId}
                                        sampleTypes={sampleTypes || []}
                                        samplingPoints={samplingPoints || []}
                                        getCategoryColor={getCategoryColor}
                                        getFrequencyLabel={getFrequencyLabel}
                                    />
                                </TabsContent>

                                {/* Others Tab */}
                                <TabsContent value="others" className="mt-4">
                                    {/* Group by Sample Type for Others */}
                                    {(() => {
                                        const otherSpecsGrouped = specifications.filter(s =>
                                            s.sample_type_id &&
                                            (s.sample_type?.code ? (!isFinishedProduct(s.sample_type.code) && !isIntermediateProduct(s.sample_type.code)) : false)
                                        );
                                        if (otherSpecsGrouped.length === 0) {
                                            return (
                                                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                                    No environmental or auxiliary specifications found.
                                                </div>
                                            );
                                        }

                                        // Grouping by Phase
                                        const groups: Record<string, typeof otherSpecsGrouped> = {};
                                        otherSpecsGrouped.forEach(s => {
                                            const typeName = sampleTypes?.find(t => t.id === s.sample_type_id)?.name || "Other Phase";
                                            if (!groups[typeName]) groups[typeName] = [];
                                            groups[typeName].push(s);
                                        });

                                        return (
                                            <div className="space-y-10">
                                                {Object.entries(groups).map(([phase, specs]) => (
                                                    <div key={phase} className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-px flex-1 bg-border" />
                                                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                                                                Type: {phase}
                                                            </h3>
                                                            <div className="h-px flex-1 bg-border" />
                                                        </div>
                                                        <LabTypeTabs
                                                            specs={specs}
                                                            productId={selectedProductId}
                                                            sampleTypes={sampleTypes || []}
                                                            samplingPoints={samplingPoints || []}
                                                            getCategoryColor={getCategoryColor}
                                                            getFrequencyLabel={getFrequencyLabel}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

/**
 * Helper to split specs by Lab Category using NESTED TABS for reduced stress
 */
function LabTypeTabs({ specs, productId, sampleTypes, samplingPoints, getCategoryColor, getFrequencyLabel }: any) {
    const fqSpecs = specs.filter((s: any) => s.parameter?.category !== 'microbiological');
    const microSpecs = specs.filter((s: any) => s.parameter?.category === 'microbiological');

    if (specs.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                Nenhuma especificação definida nesta categoria.
            </div>
        );
    }

    return (
        <Tabs defaultValue={fqSpecs.length > 0 ? "fq" : "micro"} className="w-full">
            <TabsList className="bg-muted/30 p-1 h-auto gap-1 border border-border/40">
                <TabsTrigger
                    value="fq"
                    className="flex items-center gap-2 py-1.5 px-4 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
                >
                    <Beaker className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">Físico-Química ({fqSpecs.length})</span>
                </TabsTrigger>
                <TabsTrigger
                    value="micro"
                    className="flex items-center gap-2 py-1.5 px-4 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                >
                    <Microscope className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">Microbiologia ({microSpecs.length})</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="fq" className="mt-4 focus-visible:outline-none">
                {fqSpecs.length > 0 ? (
                    <SpecsTable
                        specs={fqSpecs}
                        productId={productId}
                        sampleTypes={sampleTypes}
                        samplingPoints={samplingPoints}
                        getCategoryColor={getCategoryColor}
                        getFrequencyLabel={getFrequencyLabel}
                    />
                ) : (
                    <div className="p-8 text-center text-muted-foreground italic text-sm">
                        Nenhuma especificação FQ definida.
                    </div>
                )}
            </TabsContent>

            <TabsContent value="micro" className="mt-4 focus-visible:outline-none">
                {microSpecs.length > 0 ? (
                    <SpecsTable
                        specs={microSpecs}
                        productId={productId}
                        sampleTypes={sampleTypes}
                        samplingPoints={samplingPoints}
                        getCategoryColor={getCategoryColor}
                        getFrequencyLabel={getFrequencyLabel}
                    />
                ) : (
                    <div className="p-8 text-center text-muted-foreground italic text-sm">
                        Nenhuma especificação Microbiológica definida.
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
}

// Helper Component for Table to avoid duplication
function SpecsTable({ specs, productId, sampleTypes, samplingPoints, getCategoryColor, getFrequencyLabel }: any) {
    if (specs.length === 0) {
        return <div className="p-8 text-center text-muted-foreground italic">No specifications in this category.</div>;
    }

    return (
        <Card className="glass">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/30">
                            <th className="text-left py-3 px-4">Parameter</th>
                            <th className="text-left py-3 px-2">Category</th>
                            <th className="text-right py-3 px-2">Min</th>
                            <th className="text-right py-3 px-2">Target</th>
                            <th className="text-right py-3 px-2">Max</th>
                            <th className="text-left py-3 px-2">Unit</th>
                            <th className="text-center py-3 px-2">Critical</th>
                            <th className="text-left py-3 px-2">Frequency</th>
                            <th className="text-right py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {specs.map((spec: any) => (
                            <tr key={spec.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="font-medium">{spec.parameter?.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">
                                        {spec.parameter?.code}
                                    </div>
                                </td>
                                <td className="py-3 px-2">
                                    <Badge variant="secondary" className={getCategoryColor(spec.parameter?.category)}>
                                        {spec.parameter?.category?.replace("_", "-")}
                                    </Badge>
                                </td>
                                <td className="py-3 px-2 text-right font-mono text-muted-foreground">
                                    {spec.min_value ?? "-"}
                                </td>
                                <td className="py-3 px-2 text-right font-mono font-bold">
                                    {spec.target_value ?? "-"}
                                </td>
                                <td className="py-3 px-2 text-right font-mono text-muted-foreground">
                                    {spec.max_value ?? "-"}
                                </td>
                                <td className="py-3 px-2 text-muted-foreground">
                                    {spec.parameter?.unit || "-"}
                                </td>
                                <td className="py-3 px-2 text-center">
                                    {spec.is_critical ? (
                                        <AlertTriangle className="h-4 w-4 text-red-500 mx-auto" />
                                    ) : (
                                        <span className="text-muted-foreground opacity-30">—</span>
                                    )}
                                </td>
                                <td className="py-3 px-2">
                                    <div className="text-xs border px-2 py-0.5 rounded bg-background inline-block">
                                        {getFrequencyLabel(spec.sampling_frequency)}
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <SpecDialog
                                        mode="edit"
                                        productId={productId}
                                        specification={spec}
                                        availableParameters={[]}
                                        sampleTypes={sampleTypes}
                                        samplingPoints={samplingPoints}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

