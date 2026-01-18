"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import {
    Package,
    ArrowLeft,
    Search,
    Filter,
    Plus
} from "lucide-react";
import Link from "next/link";
import { ProductDialog } from "./product-dialog";
import { BulkImportDialog } from "./bulk-import-dialog";
import { ProductsToolbar } from "./_components/products-toolbar";
import { DataGrid } from "@/components/smart/data-grid";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";

interface Product {
    id: string;
    name: string;
    sku: string;
    category?: string;
    status: string;
    shelf_life_days?: number;
    parent?: { name: string; sku: string };
    parent_id?: string | null;
}

interface ProductsClientPageProps {
    initialProducts: Product[];
    categories: Record<string, number>;
    specsByProduct: Record<string, number>;
}

export function ProductsClientPage({ initialProducts, categories, specsByProduct }: ProductsClientPageProps) {
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string | null>(null);

    // Derived state for filtering
    const filteredProducts = initialProducts.filter(product => {
        const matchesCategory = filterCategory ? product.category === filterCategory : true;
        const matchesStatus = filterStatus ? product.status === filterStatus : true;
        const matchesSearch = searchTerm
            ? product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
            : true;
        return matchesCategory && matchesStatus && matchesSearch;
    });

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            final: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            intermediate: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            raw_material: "bg-amber-500/10 text-amber-500 border-amber-500/20"
        };
        return colors[cat] || "bg-slate-500/10 text-slate-500 border-slate-500/20";
    };

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
            final: "Produto Final",
            intermediate: "Intermédio",
            raw_material: "Matéria-Prima"
        };
        return labels[cat] || cat;
    };

    const columns = [
        {
            key: "sku",
            label: "SKU",
            render: (row: Product) => (
                <span className="font-mono text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300">
                    {row.sku}
                </span>
            )
        },
        {
            key: "name",
            label: "Nome do Produto",
            render: (row: Product) => {
                const parentData = Array.isArray(row.parent) ? row.parent[0] : row.parent;
                return (
                    <div className="flex flex-col">
                        <Link
                            href={`/quality/products/${row.id}`}
                            className="font-medium text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors w-fit"
                        >
                            {row.name}
                        </Link>
                        {parentData && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                ↳ Origem: {parentData.name}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            key: "category",
            label: "Categoria",
            render: (row: Product) => (
                <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] uppercase font-bold tracking-wider border ${getCategoryColor(row.category || 'final')}`}>
                    {getCategoryLabel(row.category || 'final')}
                </Badge>
            )
        },
        {
            key: "specs",
            label: "Especificações",
            render: (row: Product) => (
                <Link
                    href={`/quality/specifications?product=${row.id}`}
                    className="group flex items-center gap-2 hover:opacity-80 transition-opacity w-fit"
                >
                    <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {specsByProduct[row.id] || 0}
                    </div>
                    {(specsByProduct[row.id] || 0) === 0 && (
                        <span className="text-[10px] text-rose-500 font-black uppercase tracking-widest animate-pulse italic">Em Falta</span>
                    )}
                </Link>
            )
        },
        {
            key: "shelf_life",
            label: "Validade",
            render: (row: Product) => (
                <span className="text-xs text-muted-foreground">
                    {row.shelf_life_days ? `${row.shelf_life_days} dias` : "-"}
                </span>
            )
        },
        {
            key: "status",
            label: "Estado",
            render: (row: Product) => (
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${row.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-400'}`} />
                    <span className={`text-xs font-medium uppercase tracking-wider ${row.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                        {row.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
            )
        },
        {
            key: "actions",
            label: " ",
            render: (row: Product) => (
                <div className="flex justify-end">
                    <ProductDialog mode="edit" product={row} />
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 px-6 pb-20 animate-in fade-in duration-500">
            <PageHeader
                variant="emerald"
                icon={<Package className="h-4 w-4" />}
                overline="GQ • Gestão de Especificações"
                title="Catálogo de Produtos"
                description="Gestão de hierarquia de produtos, receitas e especificações de qualidade por SKU."
                backHref="/quality"
                actions={
                    <div className="flex gap-3">
                        <BulkImportDialog />
                        <ProductDialog mode="create" />
                    </div>
                }
            />

            {/* Stats / Filter Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                <KPISparkCard
                    variant="slate"
                    title="Volume de SKUs"
                    value={initialProducts.length.toString().padStart(2, '0')}
                    description="Total de registos ativos"
                    icon={<Package className="h-4 w-4" />}
                    data={[initialProducts.length - 2, initialProducts.length - 1, initialProducts.length].map(v => ({ value: v }))}
                    dataKey="value"
                    onClick={() => setFilterCategory(null)}
                    active={filterCategory === null}
                />
                <KPISparkCard
                    variant="emerald"
                    title="Produtos Finais"
                    value={(categories.final || 0).toString().padStart(2, '0')}
                    description="Status: Pronto para Expedição"
                    icon={<Package className="h-4 w-4" />}
                    data={[10, 12, 11, 13].map(v => ({ value: v }))}
                    dataKey="value"
                    onClick={() => setFilterCategory("final")}
                    active={filterCategory === "final"}
                />
                <KPISparkCard
                    variant="blue"
                    title="Intermédios"
                    value={(categories.intermediate || 0).toString().padStart(2, '0')}
                    description="Status: Processamento Interno"
                    icon={<Package className="h-4 w-4" />}
                    data={[5, 4, 6, 7].map(v => ({ value: v }))}
                    dataKey="value"
                    onClick={() => setFilterCategory("intermediate")}
                    active={filterCategory === "intermediate"}
                />
                <KPISparkCard
                    variant="amber"
                    title="Matérias-Primas"
                    value={(categories.raw_material || 0).toString().padStart(2, '0')}
                    description="Status: Receção / Armazém"
                    icon={<Package className="h-4 w-4" />}
                    data={[8, 7, 9, 8].map(v => ({ value: v }))}
                    dataKey="value"
                    onClick={() => setFilterCategory("raw_material")}
                    active={filterCategory === "raw_material"}
                />
            </div>

            {/* Main Content Area */}
            <div className="glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-slate-950/40">
                <ProductsToolbar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                />

                {/* Data Grid */}
                <div className="p-2">
                    <DataGrid
                        data={filteredProducts}
                        columns={columns}
                        className="border-none shadow-none bg-transparent"
                    />
                </div>
            </div>
        </div>
    );
}
