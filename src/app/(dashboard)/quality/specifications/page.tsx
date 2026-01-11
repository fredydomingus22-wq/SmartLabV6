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
    Microscope,
    ShieldAlert,
    FileText,
    Activity,
    FlaskConical,
    Settings2,
    Globe
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
    const isGlobalMode = selectedProductId === "global";

    // Fetch specifications for selected product OR global (non-product) specs
    let specifications: any[] = [];
    if (selectedProductId) {
        let query = supabase
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
                haccp_hazard_id,
                haccp_hazard:haccp_hazards(id, is_pcc, hazard_description, hazard_category),
                parameter:qa_parameters(id, name, code, unit, category),
                sample_type:sample_types(id, name, code)
            `)
            .order("created_at");

        if (isGlobalMode) {
            query = query.is("product_id", null);
        } else {
            query = query.eq("product_id", selectedProductId);
        }

        const { data } = await query;
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

    // Get selected product info (null for global mode)
    const selectedProduct = isGlobalMode ? null : products?.find(p => p.id === selectedProductId);

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            physico_chemical: "bg-blue-100 text-blue-700",
            microbiological: "bg-green-100 text-green-700",
            sensory: "bg-purple-100 text-purple-700",
            process: "bg-amber-100 text-amber-700",
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
                            {isGlobalMode ? (
                                <Globe className="h-8 w-8 text-emerald-500" />
                            ) : (
                                <FlaskConical className="h-8 w-8 text-purple-500" />
                            )}
                            {isGlobalMode ? "Especificações Globais" : "Especificações de Produto"}
                        </h1>
                        <p className="text-muted-foreground">
                            {isGlobalMode
                                ? "Especificações para CIP, Água, Monitoramento Ambiental, etc."
                                : "Defina os limites de qualidade para cada produto"
                            }
                        </p>
                    </div>
                </div>
                {selectedProductId && (
                    <div className="flex gap-2">
                        {!isGlobalMode && (
                            <CopySpecsDialog
                                products={products || []}
                                currentProductId={selectedProductId}
                            />
                        )}
                        <SpecDialog
                            mode="create"
                            productId={isGlobalMode ? undefined : selectedProductId}
                            availableParameters={availableParameters}
                            sampleTypes={sampleTypes || []}
                            samplingPoints={samplingPoints || []}
                        />
                    </div>
                )}
            </div>

            {/* Product Selector */}
            <Card className="glass border-l-4 border-l-primary/50">
                <CardContent className="pt-6">
                    <ProductSelector
                        products={products || []}
                        selectedProductId={selectedProductId}
                    />
                </CardContent>
            </Card>

            {!selectedProductId ? (
                <Card className="glass border-2 border-dashed">
                    <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center">
                        <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                            <ClipboardList className="h-10 w-10 opacity-40" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Selecione um Produto ou Modo Global</h3>
                        <p className="max-w-md mx-auto">
                            Utilize o seletor acima para visualizar as especificações de um produto específico ou para gerenciar especificações globais.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="glass border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Parâmetros</CardTitle>
                                <FileText className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{specifications.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">Especificações cadastradas</p>
                            </CardContent>
                        </Card>

                        <Card className="glass border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Parâmetros Críticos</CardTitle>
                                <ShieldAlert className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {specifications.filter(s => s.is_critical).length}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Requerem atenção especial</p>
                            </CardContent>
                        </Card>

                        <Card className="glass border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Tipos de Análise</CardTitle>
                                <Activity className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {new Set(specifications.map(s => s.parameter?.category)).size}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Categorias distintas</p>
                            </CardContent>
                        </Card>
                    </div>

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
                                            (
                                                !s.sample_type?.code || // Include if code is missing/lookup failed
                                                (!isFinishedProduct(s.sample_type.code) && !isIntermediateProduct(s.sample_type.code))
                                            )
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
    const fqSpecs = specs.filter((s: any) => s.parameter?.category !== 'microbiological' && s.parameter?.category !== 'process');
    const microSpecs = specs.filter((s: any) => s.parameter?.category === 'microbiological');
    const processSpecs = specs.filter((s: any) => s.parameter?.category === 'process');

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
                <TabsTrigger
                    value="process"
                    className="flex items-center gap-2 py-1.5 px-4 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
                >
                    <Settings2 className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">Engenharia / Processo ({specs.filter((s: any) => s.parameter?.category === 'process').length})</span>
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

            <TabsContent value="process" className="mt-4 focus-visible:outline-none">
                {processSpecs.length > 0 ? (
                    <SpecsTable
                        specs={processSpecs}
                        productId={productId}
                        sampleTypes={sampleTypes}
                        samplingPoints={samplingPoints}
                        getCategoryColor={getCategoryColor}
                        getFrequencyLabel={getFrequencyLabel}
                    />
                ) : (
                    <div className="p-8 text-center text-muted-foreground italic text-sm">
                        Nenhuma especificação de Processo definida.
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
        <div className="rounded-md border bg-background/50 overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b bg-muted/40 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Parameter</th>
                        <th className="h-12 px-2 text-left align-middle font-medium text-muted-foreground">Category</th>
                        <th className="h-12 px-2 text-right align-middle font-medium text-muted-foreground">Min</th>
                        <th className="h-12 px-2 text-right align-middle font-medium text-muted-foreground">Target</th>
                        <th className="h-12 px-2 text-right align-middle font-medium text-muted-foreground">Max</th>
                        <th className="h-12 px-2 text-left align-middle font-medium text-muted-foreground">Unit</th>
                        <th className="h-12 px-2 text-center align-middle font-medium text-muted-foreground">Critical</th>
                        <th className="h-12 px-2 text-left align-middle font-medium text-muted-foreground">Frequency</th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {specs.map((spec: any) => (
                        <tr key={spec.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted last:border-0 group">
                            <td className="p-4 align-middle">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-foreground">{spec.parameter?.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">
                                            {spec.parameter?.code}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-2 align-middle">
                                <Badge variant="outline" className={`${getCategoryColor(spec.parameter?.category)} bg-opacity-10 border-opacity-20`}>
                                    {spec.parameter?.category?.replace("_", "-")}
                                </Badge>
                            </td>
                            <td className="p-2 align-middle text-right font-mono text-muted-foreground">
                                {spec.min_value ?? "-"}
                            </td>
                            <td className="p-2 align-middle text-right font-mono font-bold text-foreground">
                                {spec.target_value ?? "-"}
                            </td>
                            <td className="p-2 align-middle text-right font-mono text-muted-foreground">
                                {spec.max_value ?? "-"}
                            </td>
                            <td className="p-2 align-middle text-muted-foreground text-xs">
                                {spec.parameter?.unit || "-"}
                            </td>
                            <td className="p-2 align-middle text-center">
                                {spec.is_critical ? (
                                    <div className="flex justify-center">
                                        <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full">
                                            <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground opacity-30">—</span>
                                )}
                            </td>
                            <td className="p-2 align-middle">
                                <Badge variant="outline" className="font-normal text-muted-foreground">
                                    {getFrequencyLabel(spec.sampling_frequency)}
                                </Badge>
                            </td>
                            <td className="p-4 align-middle text-right">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <SpecDialog
                                        mode="edit"
                                        productId={productId}
                                        specification={spec}
                                        availableParameters={[]} // Not needed for edit
                                        sampleTypes={sampleTypes}
                                        samplingPoints={samplingPoints}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

