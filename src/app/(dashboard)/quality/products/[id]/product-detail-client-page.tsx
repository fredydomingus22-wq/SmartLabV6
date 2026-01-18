"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
    Calendar, Box, Thermometer, User,
    ArrowLeft, ClipboardList, Activity,
    History, Edit, Package, Archive, Layers,
    Trash2, Plus, Info, Settings2
} from "lucide-react";
import { BOMDialog } from "./bom-dialog";
import { removeBOMItemAction } from "@/app/actions/engineering";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataGrid } from "@/components/smart/data-grid";
import { ProductDialog } from "../product-dialog";

interface Product {
    id: string;
    name: string;
    sku: string;
    description?: string;
    category: string;
    status: string;
    unit?: string;
    shelf_life_days?: number;
    storage_conditions?: string;
    version?: number;
    created_at: string;
    updated_at?: string;
    bev_category?: string;
}

interface Spec {
    id: string;
    parameter: { id: string; name: string; code: string; unit?: string; category: string };
    min_value?: number;
    max_value?: number;
    target_value?: number;
    is_critical: boolean;
    version: number;
    process_context?: string;
}

interface Batch {
    id: string;
    code: string;
    status: string;
    created_at: string;
}

interface ProductHistory {
    id: string;
    version: number;
    name: string;
    category: string;
    shelf_life_days?: number;
    change_reason?: string;
    superseded_at: string;
    changed_by_user?: { full_name: string };
    bev_category?: string;
}

interface SpecHistory {
    id: string;
    version: number;
    min_value?: number;
    max_value?: number;
    target_value?: number;
    change_reason?: string;
    superseded_at: string;
    changed_by_user?: { full_name: string };
    parameter?: { name: string; code: string };
    effective_date?: string;
}

interface ProductDetailClientPageProps {
    product: Product;
    specifications: Spec[];
    recentBatches: Batch[];
    productHistory: ProductHistory[];
    specHistory: SpecHistory[];
    bom: any[];
    allProducts: any[];
    allRawMaterials: any[];
}

export function ProductDetailClientPage({
    product,
    specifications,
    recentBatches,
    productHistory,
    specHistory,
    bom,
    allProducts,
    allRawMaterials
}: ProductDetailClientPageProps) {

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
            final: "Produto Final",
            intermediate: "Intermédio",
            raw_material: "Matéria-Prima"
        };
        return labels[cat] || cat;
    };

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            final: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
            intermediate: "bg-blue-500/10 text-blue-600 border-blue-500/20",
            raw_material: "bg-amber-500/10 text-amber-600 border-amber-500/20"
        };
        return colors[cat] || "bg-slate-500/10 text-slate-600 border-slate-500/20";
    };

    const getStatusBadge = (status: string) => (
        <Badge variant="outline" className={`
            ${status === 'active'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-slate-500/10 text-slate-600 border-slate-500/20'} 
            uppercase tracking-wider font-bold text-[10px]
        `}>
            {status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
    );

    // Columns for DataGrids
    const specColumns = [
        { key: "parameter.code", label: "Código", render: (row: Spec) => <span className="font-mono text-xs">{row.parameter.code}</span> },
        {
            key: "parameter.name",
            label: "Parâmetro",
            render: (row: Spec) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.parameter.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{row.parameter.category.replace('_', ' ')}</span>
                </div>
            )
        },
        { key: "min_value", label: "Min", render: (row: Spec) => <span className="font-mono">{row.min_value ?? "-"}</span> },
        { key: "target_value", label: "Target", render: (row: Spec) => <span className="font-mono font-bold">{row.target_value ?? "-"}</span> },
        { key: "max_value", label: "Max", render: (row: Spec) => <span className="font-mono">{row.max_value ?? "-"}</span> },
        { key: "parameter.unit", label: "Unidade", render: (row: Spec) => row.parameter.unit ?? "-" },
        {
            key: "is_critical",
            label: "Crítico",
            render: (row: Spec) => row.is_critical ? <Badge variant="destructive" className="text-[10px]">Crítico</Badge> : null
        },
        {
            key: "process_context",
            label: "Contexto",
            render: (row: Spec) => row.process_context ? (
                <Badge variant="outline" className="text-[10px] bg-slate-500/5 text-slate-500 border-slate-500/10">
                    {row.process_context}
                </Badge>
            ) : <span className="text-slate-300">-</span>
        }
    ];

    const batchColumns = [
        { key: "code", label: "Lote", render: (row: Batch) => <span className="font-mono font-bold text-primary">{row.code}</span> },
        {
            key: "status",
            label: "Estado",
            render: (row: Batch) => (
                <Badge variant="outline" className="text-[10px] uppercase">
                    {row.status}
                </Badge>
            )
        },
        {
            key: "created_at",
            label: "Data Início",
            render: (row: Batch) => <span className="text-xs">{format(new Date(row.created_at), "dd/MM/yyyy HH:mm")}</span>
        },
        {
            key: "actions",
            label: "",
            render: (row: Batch) => (
                <Link href={`/production/${row.id}`} className="text-xs text-primary hover:underline">
                    Ver Detalhes
                </Link>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Premium Header */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-bl-full pointer-events-none" />

                <div className="relative p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex items-start gap-6">
                        <Link href="/quality/products">
                            <Button variant="ghost" size="icon" className="mt-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                                <ArrowLeft className="h-6 w-6 text-slate-500" />
                            </Button>
                        </Link>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Badge className={`${getCategoryColor(product.category)} rounded-md px-2 py-0.5`}>
                                        {getCategoryLabel(product.category)}
                                    </Badge>
                                    {product.bev_category && (
                                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                            {product.bev_category}
                                        </Badge>
                                    )}
                                    {getStatusBadge(product.status)}
                                </div>
                                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                                    {product.name}
                                </h1>
                                <p className="text-lg text-slate-500 font-mono mt-1 flex items-center gap-2">
                                    <span className="opacity-50">#</span>{product.sku}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <Box className="h-4 w-4 text-emerald-500" />
                                    <span>Unidade: <strong className="text-slate-900 dark:text-slate-200">{product.unit || 'N/A'}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <span>Validade: <strong className="text-slate-900 dark:text-slate-200">{product.shelf_life_days ? `${product.shelf_life_days} dias` : 'N/A'}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <History className="h-4 w-4 text-purple-500" />
                                    <span>Versão: <strong className="text-slate-900 dark:text-slate-200">v{product.version || 1}</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between items-end gap-4">
                        <ProductDialog mode="edit" product={product} />
                        <div className="text-xs text-slate-400 text-right">
                            <p>Criado em {format(new Date(product.created_at), "dd MMM yyyy")}</p>
                            {product.updated_at && <p>Atualizado em {format(new Date(product.updated_at), "dd MMM yyyy")}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start h-auto p-1 bg-transparent border-b border-slate-200 dark:border-slate-800 space-x-6 rounded-none">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-2 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:text-emerald-600 transition-all">
                        Visão Geral
                    </TabsTrigger>
                    <TabsTrigger value="specs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-2 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:text-emerald-600 transition-all">
                        Especificações <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1">{specifications.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="batches" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-2 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:text-emerald-600 transition-all">
                        Produção <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1">{recentBatches.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-2 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:text-emerald-600 transition-all">
                        Histórico e Auditoria
                    </TabsTrigger>
                    <TabsTrigger value="engineering" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none px-2 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:text-amber-600 transition-all">
                        Engenharia / Ficha Técnica <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1">{bom.length + specifications.filter(s => s.parameter.category === 'process').length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="md:col-span-2 glass border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-emerald-500" /> Descrição do Produto
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {product.description || "Nenhuma descrição disponível para este produto."}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="glass border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Thermometer className="h-5 w-5 text-amber-500" /> Armazenamento
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
                                        <p className="font-medium text-amber-900 dark:text-amber-200">
                                            {product.storage_conditions || "N/A"}
                                        </p>
                                        <p className="text-xs text-amber-700/70 dark:text-amber-400 mt-1">
                                            Condições recomendadas
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="specs">
                        <Card className="glass border-0 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Especificações de Qualidade</CardTitle>
                                    <CardDescription>Parâmetros atuais definidos (v1)</CardDescription>
                                </div>
                                <Link href={`/quality/specifications?product=${product.id}`}>
                                    <Button size="sm" variant="outline" className="gap-2">
                                        <Edit className="h-4 w-4" /> Gerir Specs
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                <DataGrid
                                    data={specifications}
                                    columns={specColumns}
                                    className="border-none shadow-none"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="batches">
                        <Card className="glass border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle>Histórico de Produção</CardTitle>
                                <CardDescription>Últimos 10 lotes processados</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DataGrid
                                    data={recentBatches}
                                    columns={batchColumns}
                                    className="border-none shadow-none"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Product Version History */}
                            <Card className="glass border-0 shadow-lg bg-white/50">
                                <CardHeader>
                                    <CardTitle className=" text-base">Histórico do Produto</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                    {productHistory.length === 0 ? (
                                        <p className="text-muted-foreground text-sm italic">Sem alterações registadas.</p>
                                    ) : (
                                        productHistory.map((h) => (
                                            <div key={h.id} className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 pb-4 last:pb-0">
                                                <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-950" />
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">v{h.version}</span>
                                                    <span className="text-[10px] text-muted-foreground">{format(new Date(h.superseded_at), "dd/MM/yyyy HH:mm")}</span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                                    {h.change_reason || "Atualização de propriedades"}
                                                </p>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-900 w-fit px-2 py-0.5 rounded-full">
                                                        <User className="h-3 w-3" /> {h.changed_by_user?.full_name || "Sistema"}
                                                    </div>
                                                    {h.bev_category && (
                                                        <Badge variant="outline" className="text-[10px] bg-purple-500/5 text-purple-600 border-purple-500/10 h-5">
                                                            {h.bev_category}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>

                            {/* Specification History */}
                            <Card className="glass border-0 shadow-lg bg-white/50">
                                <CardHeader>
                                    <CardTitle className="text-base">Histórico de Especificações</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                    {specHistory.length === 0 ? (
                                        <p className="text-muted-foreground text-sm italic">Sem alterações de especificações registadas.</p>
                                    ) : (
                                        specHistory.map((h: SpecHistory) => (
                                            <div key={h.id} className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 pb-4 last:pb-0">
                                                <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-emerald-300 dark:bg-emerald-900 ring-4 ring-white dark:ring-slate-950" />
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                                        {h.parameter?.name || "Parâmetro"} (v{h.version})
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">{format(new Date(h.superseded_at), "dd/MM/yyyy HH:mm")}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-600 dark:text-slate-400 mb-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                                                    <div>Min: {h.min_value ?? '-'}</div>
                                                    <div>Target: {h.target_value ?? '-'}</div>
                                                    <div>Max: {h.max_value ?? '-'}</div>
                                                </div>
                                                {h.change_reason && (
                                                    <p className="text-xs text-slate-500 italic mb-1">"{h.change_reason}"</p>
                                                )}
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <User className="h-3 w-3" /> {h.changed_by_user?.full_name || "Sistema"}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="engineering" className="space-y-6">
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* BOM Section */}
                            <Card className="lg:col-span-2 glass border-0 shadow-lg">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-500/10 rounded-lg">
                                            <Layers className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">BOM - Lista de Materiais</CardTitle>
                                            <CardDescription>Composição por unidade de produto</CardDescription>
                                        </div>
                                    </div>
                                    <BOMDialog
                                        productId={product.id}
                                        allProducts={allProducts}
                                        allRawMaterials={allRawMaterials}
                                    />
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium">
                                                <tr>
                                                    <th className="text-left py-3 px-4">Componente</th>
                                                    <th className="text-left py-3 px-4">Tipo</th>
                                                    <th className="text-right py-3 px-4">Qtd. Standard</th>
                                                    <th className="text-left py-3 px-4">Unidade</th>
                                                    <th className="text-right py-3 px-4"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {bom.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="py-10 text-center text-muted-foreground italic">
                                                            Nenhum componente registado.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    bom.map((item) => (
                                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group">
                                                            <td className="py-3 px-4">
                                                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                                    {item.component_product?.name || item.component_raw_material?.name}
                                                                </div>
                                                                <div className="text-[10px] font-mono text-slate-400">
                                                                    {item.component_product?.sku || item.component_raw_material?.code}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <Badge variant="outline" className="text-[10px] font-normal">
                                                                    {item.component_product ? 'Intermédio' : 'Raw Material'}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-mono font-bold">
                                                                {item.quantity}
                                                            </td>
                                                            <td className="py-3 px-4 text-slate-500">
                                                                {item.unit || item.component_product?.unit || item.component_raw_material?.unit}
                                                            </td>
                                                            <td className="py-3 px-4 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={async () => {
                                                                        if (confirm("Remover este componente da ficha técnica?")) {
                                                                            const fd = new FormData();
                                                                            fd.set("id", item.id);
                                                                            fd.set("product_id", product.id);
                                                                            const res = await removeBOMItemAction(fd);
                                                                            if (res.success) toast.success(res.message);
                                                                            else toast.error(res.message);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Process Parameters Section */}
                            <Card className="glass border-0 shadow-lg bg-gradient-to-br from-amber-500/5 to-transparent">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-500/10 rounded-lg">
                                            <Settings2 className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Parâmetros de Processo</CardTitle>
                                            <CardDescription>Condições de fabrico (v1)</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {specifications.filter(s => s.parameter.category === 'process').length === 0 ? (
                                        <div className="p-10 border-2 border-dashed rounded-2xl text-center text-muted-foreground">
                                            <p className="text-xs">Nenhum parâmetro técnico definido.</p>
                                            <Link href={`/quality/specifications?product=${product.id}`}>
                                                <Button variant="link" size="sm" className="text-amber-600 mt-2">Configurar Engenharia</Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {specifications.filter((s: any) => s.parameter.category === 'process').map(spec => (
                                                <div key={spec.id} className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-sm font-bold">{spec.parameter.name}</span>
                                                        {spec.is_critical && <Badge variant="destructive" className="text-[8px] h-4 px-1">PCC/OPRP</Badge>}
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-2xl font-black text-amber-600">{spec.target_value}</span>
                                                        <span className="text-xs text-slate-500 uppercase font-bold">{spec.parameter.unit}</span>
                                                    </div>
                                                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[10px] text-slate-400 font-mono">
                                                        <span>MIN: {spec.min_value ?? '-'}</span>
                                                        <span>MAX: {spec.max_value ?? '-'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
