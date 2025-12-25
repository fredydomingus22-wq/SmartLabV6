import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ClipboardList,
    ArrowLeft,
    AlertTriangle,
    Target
} from "lucide-react";
import Link from "next/link";
import { ProductSelector } from "./product-selector";
import { SpecDialog } from "./spec-dialog";
import { CopySpecsDialog } from "./copy-specs-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
                parameter:qa_parameters(id, name, code, unit, category, method)
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
                                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                                    <TabsTrigger value="finished">Final Product</TabsTrigger>
                                    <TabsTrigger value="intermediates">Intermediates / Phases</TabsTrigger>
                                </TabsList>

                                {/* Final Product Tab */}
                                <TabsContent value="finished">
                                    <SpecsTable
                                        specs={specifications.filter(s => !s.sample_type_id)}
                                        productId={selectedProductId}
                                        sampleTypes={sampleTypes || []}
                                        getCategoryColor={getCategoryColor}
                                        getFrequencyLabel={getFrequencyLabel}
                                    />
                                </TabsContent>

                                {/* Intermediates Tab */}
                                <TabsContent value="intermediates">
                                    {/* Group by Sample Type */}
                                    {(() => {
                                        const interSpecs = specifications.filter(s => s.sample_type_id);
                                        if (interSpecs.length === 0) {
                                            return (
                                                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                                    No intermediate specifications found.
                                                </div>
                                            );
                                        }

                                        // Grouping
                                        const groups: Record<string, typeof interSpecs> = {};
                                        interSpecs.forEach(s => {
                                            const typeName = sampleTypes?.find(t => t.id === s.sample_type_id)?.name || "Unknown Phase";
                                            if (!groups[typeName]) groups[typeName] = [];
                                            groups[typeName].push(s);
                                        });

                                        return (
                                            <div className="space-y-6 mt-4">
                                                {Object.entries(groups).map(([phase, specs]) => (
                                                    <Card key={phase} className="glass">
                                                        <CardHeader className="py-3 bg-muted/20 border-b">
                                                            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                                                                Phase: <span className="text-foreground font-bold">{phase}</span>
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="p-0">
                                                            <SpecsTable
                                                                specs={specs}
                                                                productId={selectedProductId}
                                                                sampleTypes={sampleTypes || []}
                                                                getCategoryColor={getCategoryColor}
                                                                getFrequencyLabel={getFrequencyLabel}
                                                            />
                                                        </CardContent>
                                                    </Card>
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

// Helper Component for Table to avoid duplication
function SpecsTable({ specs, productId, sampleTypes, getCategoryColor, getFrequencyLabel }: any) {
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

