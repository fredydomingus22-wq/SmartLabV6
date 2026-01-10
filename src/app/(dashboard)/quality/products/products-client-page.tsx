"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { DataGrid } from "@/components/smart/data-grid";
import { motion } from "framer-motion";

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
                        <span className="text-[10px] text-rose-500 font-medium animate-pulse">Missing</span>
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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/quality">
                        <Button variant="ghost" size="icon" className="h-10 w-10 class rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                            <ArrowLeft className="h-5 w-5 text-slate-500" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/10">
                                <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            Catálogo de Produtos
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 pl-1">
                            Gerir hierarquia de produtos, receitas e especificações de qualidade
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <BulkImportDialog />
                    <ProductDialog mode="create" />
                </div>
            </div>

            {/* Stats / Filter Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Card
                        className={`glass border-0 shadow-lg cursor-pointer transition-all duration-300 relative overflow-hidden group ${filterCategory === null ? 'ring-2 ring-primary/50 bg-primary/5' : 'hover:bg-white/50 dark:hover:bg-slate-900/50'
                            }`}
                        onClick={() => setFilterCategory(null)}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="pt-6 relative z-10">
                            <div className="text-3xl font-black text-slate-700 dark:text-slate-200">{initialProducts.length}</div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Total Produtos</p>
                        </CardContent>
                    </Card>
                </motion.div>

                {Object.entries(categories).map(([cat, count]) => (
                    <motion.div key={cat} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card
                            className={`glass border-0 shadow-sm cursor-pointer transition-all duration-300 relative overflow-hidden group ${filterCategory === cat
                                ? `ring-2 ring-offset-2 ring-offset-background ${cat === 'final' ? 'ring-emerald-500/50 bg-emerald-500/5' : cat === 'intermediate' ? 'ring-blue-500/50 bg-blue-500/5' : 'ring-amber-500/50 bg-amber-500/5'}`
                                : 'hover:bg-white/50 dark:hover:bg-slate-900/50'
                                }`}
                            onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
                        >
                            <CardContent className="pt-6 relative z-10">
                                <div className="text-3xl font-black text-slate-700 dark:text-slate-200">{count}</div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{getCategoryLabel(cat)}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-slate-950/40">
                {/* Toolbar */}
                <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/20 dark:bg-slate-900/20">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome ou SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border-none bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterStatus(filterStatus === 'active' ? null : 'active')}
                            className={filterStatus === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'text-slate-500'}
                        >
                            Ativos
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterStatus(filterStatus === 'inactive' ? null : 'inactive')}
                            className={filterStatus === 'inactive' ? 'bg-slate-500/10 text-slate-600' : 'text-slate-500'}
                        >
                            Inativos
                        </Button>
                    </div>
                </div>

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
