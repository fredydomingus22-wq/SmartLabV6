"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Filter,
    FileText,
    Folder,
    ChevronRight,
    MoreVertical,
    Clock,
    User,
    CheckCircle2,
    AlertCircle,
    Archive,
    Grid,
    List,
    Download,
    Eye,
    ShieldCheck,
    Users
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    GlassTable,
    GlassTableHeader,
    GlassTableRow,
    GlassTableHead,
    GlassTableCell
} from "@/components/ui/glass-table";

interface DocumentsClientProps {
    documents: any[];
    categories: any[];
    plants: any[];
}

export function DocumentsClient({ documents = [], categories = [], plants = [] }: DocumentsClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.doc_number.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory ? doc.category_id === selectedCategory : true;
            return matchesSearch && matchesCategory;
        });
    }, [documents, searchQuery, selectedCategory]);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'published': return { label: 'Efetivo', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle2 className="h-3.5 w-3.5" /> };
            case 'review': return { label: 'Revisão', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <Clock className="h-3.5 w-3.5" /> };
            case 'draft': return { label: 'Rascunho', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: <FileText className="h-3.5 w-3.5" /> };
            case 'superseded': return { label: 'Obsoleto', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: <Archive className="h-3.5 w-3.5" /> };
            default: return { label: status || '---', color: 'text-slate-500 bg-slate-500/5', icon: <AlertCircle className="h-3.5 w-3.5" /> };
        }
    };

    return (
        <div className="space-y-6">
            {/* Advanced Workstation Control Panel */}
            <div className="flex flex-col xl:flex-row gap-4 items-stretch justify-between bg-slate-900/40 p-3 rounded-2xl border border-white/5 backdrop-blur-md shadow-2xl">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                    <Input
                        placeholder="Pesquisar por Código, Título ou Conteúdo (Indexação industrial)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 bg-black/40 border-white/5 text-slate-200 focus:ring-emerald-500/20 h-12 rounded-xl placeholder:text-slate-600"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" className="border-white/5 bg-white/5 text-slate-300 hover:text-emerald-400 h-12 px-6 rounded-xl">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtros de Auditoria
                    </Button>

                    <div className="h-8 w-px bg-white/5 mx-2 hidden xl:block" />

                    <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 h-12 items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className={cn("px-3 h-full rounded-lg transition-all", viewMode === "list" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className={cn("px-3 h-full rounded-lg transition-all", viewMode === "grid" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500")}
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button className="h-12 bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-xl shadow-lg shadow-indigo-500/20">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Log
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full items-start">
                {/* Information Hierarchy (Sidebar) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-4">Taxonomia Documental</p>
                        <div className="space-y-1.5">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={cn(
                                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                    !selectedCategory ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "text-slate-400 hover:bg-white/5 border border-transparent"
                                )}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <Folder className={cn("h-4 w-4", !selectedCategory ? "text-emerald-400" : "text-slate-500")} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Root Repository</span>
                                </div>
                                <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full border border-white/5 relative z-10">{documents.length}</span>
                            </button>

                            {categories.map((cat) => {
                                const count = documents.filter(d => d.category_id === cat.id).length;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group border relative overflow-hidden",
                                            selectedCategory === cat.id ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className={cn("h-1.5 w-1.5 rounded-full", selectedCategory === cat.id ? "bg-indigo-400" : "bg-slate-700")} />
                                            <span className="text-xs font-bold tracking-tight">{cat.name}</span>
                                        </div>
                                        <span className="text-[10px] opacity-60 relative z-10">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="h-px bg-white/5 mx-4" />

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-4">Advanced Tools</p>
                        <div className="grid grid-cols-1 gap-2 px-2">
                            {[
                                { label: "Auditor Console", icon: ShieldCheck, color: "text-amber-500" },
                                { label: "Distribution Matrix", icon: Users, color: "text-blue-500" },
                                { label: "Retention Policy", icon: Archive, color: "text-slate-500" }
                            ].map((tool, i) => (
                                <Button key={i} variant="ghost" className="w-full justify-start gap-3 h-11 text-xs font-bold uppercase tracking-tighter text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5">
                                    <tool.icon className={cn("h-4 w-4", tool.color)} />
                                    {tool.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 mt-6 mx-2">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">System Integrity</p>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase">All nodes active</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-tight">Syncing with 21 CFR Part 11 Audit Trail service...</p>
                    </div>
                </div>

                {/* Primary Data Mesh */}
                <div className="lg:col-span-4">
                    {filteredDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 glass border-dashed border-white/5 rounded-[2rem]">
                            <div className="h-20 w-20 bg-slate-900/50 rounded-full flex items-center justify-center mb-6">
                                <Archive className="h-10 w-10 text-slate-700" />
                            </div>
                            <p className="text-slate-400 font-bold tracking-tight text-xl">Arquivos protegidos ou inexistentes</p>
                            <p className="text-slate-600 text-sm mt-2">A sua pesquisa não retornou nenhum contentor ativo.</p>
                            <Button variant="link" onClick={() => setSelectedCategory(null)} className="text-emerald-500 mt-6 font-bold uppercase text-xs tracking-widest">
                                Resetar Workstation
                            </Button>
                        </div>
                    ) : viewMode === "list" ? (
                        <div className="glass rounded-2xl border-white/5 overflow-hidden shadow-2xl">
                            <GlassTable>
                                <GlassTableHeader>
                                    <GlassTableRow className="hover:bg-transparent border-white/5">
                                        <GlassTableHead className="w-12"></GlassTableHead>
                                        <GlassTableHead className="text-[10px] font-black uppercase tracking-widest py-4">Ref. Industrial</GlassTableHead>
                                        <GlassTableHead className="text-[10px] font-black uppercase tracking-widest">Documento Master</GlassTableHead>
                                        <GlassTableHead className="text-[10px] font-black uppercase tracking-widest text-center">Versão</GlassTableHead>
                                        <GlassTableHead className="text-[10px] font-black uppercase tracking-widest">Estado</GlassTableHead>
                                        <GlassTableHead className="text-[10px] font-black uppercase tracking-widest">P. Review</GlassTableHead>
                                        <GlassTableHead className="text-right"></GlassTableHead>
                                    </GlassTableRow>
                                </GlassTableHeader>
                                <tbody className="divide-y divide-white/[0.02]">
                                    {filteredDocuments.map((doc) => {
                                        const status = getStatusInfo(doc.current_version?.status);
                                        return (
                                            <GlassTableRow key={doc.id} className="group hover:bg-emerald-500/[0.02] transition-colors">
                                                <GlassTableCell className="pl-6">
                                                    <div className="h-8 w-8 bg-black/40 rounded-lg flex items-center justify-center border border-white/5 group-hover:border-emerald-500/30 transition-colors">
                                                        <FileText className="h-4 w-4 text-emerald-500/70" />
                                                    </div>
                                                </GlassTableCell>
                                                <GlassTableCell>
                                                    <span className="font-mono text-[11px] bg-black/40 text-slate-300 px-2 py-1 rounded border border-white/5 font-bold">
                                                        {doc.doc_number}
                                                    </span>
                                                </GlassTableCell>
                                                <GlassTableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                                                            {doc.title}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                            <Folder className="h-2.5 w-2.5" />
                                                            {doc.category?.name || "Uncategorized"}
                                                        </span>
                                                    </div>
                                                </GlassTableCell>
                                                <GlassTableCell className="text-center">
                                                    <Badge variant="outline" className="text-[10px] font-black bg-white/5 border-white/5 text-slate-400 px-2">
                                                        V{doc.current_version?.version_number || "0.0"}
                                                    </Badge>
                                                </GlassTableCell>
                                                <GlassTableCell>
                                                    <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter", status.color)}>
                                                        {status.icon}
                                                        {status.label}
                                                    </div>
                                                </GlassTableCell>
                                                <GlassTableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] text-slate-400 font-medium">
                                                            {doc.periodic_reviews?.[0]?.scheduled_date ? new Date(doc.periodic_reviews[0].scheduled_date).toLocaleDateString() : "Sem Rev."}
                                                        </span>
                                                        {doc.periodic_reviews?.[0]?.scheduled_date && (
                                                            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Agendada</span>
                                                        )}
                                                    </div>
                                                </GlassTableCell>
                                                <GlassTableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link href={`/quality/documents/${doc.id}`}>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-indigo-400">
                                                            <ShieldCheck className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </GlassTableCell>
                                            </GlassTableRow>
                                        );
                                    })}
                                </tbody>
                            </GlassTable>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                            {filteredDocuments.map((doc) => {
                                const status = getStatusInfo(doc.current_version?.status);
                                return (
                                    <Link key={doc.id} href={`/quality/documents/${doc.id}`}>
                                        <Card className="glass-dark border-white/5 hover:border-emerald-500/40 hover:bg-white/[0.02] shadow-xl transition-all group overflow-hidden rounded-[1.5rem]">
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="p-3 rounded-2xl bg-black/60 border border-white/5 group-hover:border-emerald-500/50 transition-colors shadow-inner">
                                                        <FileText className="h-6 w-6 text-emerald-500/80" />
                                                    </div>
                                                    <div className={cn("px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5", status.color)}>
                                                        {status.icon}
                                                        {status.label}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">{doc.doc_number}</span>
                                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Edition v{doc.current_version?.version_number || "0.0"}</span>
                                                    </div>
                                                    <h3 className="text-lg font-black text-slate-100 group-hover:text-emerald-400 transition-colors tracking-tight line-clamp-2 leading-tight">
                                                        {doc.title}
                                                    </h3>
                                                </div>

                                                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span className="text-[10px] font-bold uppercase tracking-tight">
                                                            {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : "---"}
                                                        </span>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
