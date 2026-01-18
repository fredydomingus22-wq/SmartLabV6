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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
        <div className="space-y-8">
            {/* Advanced Workstation Control Panel */}
            <div className="flex flex-col xl:flex-row gap-4 items-stretch justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-2xl">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        placeholder="Pesquisar por Código, Título ou Conteúdo (Indexação industrial)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 bg-slate-950 border-slate-800 text-slate-200 focus:ring-blue-500/20 h-12 rounded-xl placeholder:text-slate-600 font-bold uppercase text-[10px] tracking-widest"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" className="border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtros de Auditoria
                    </Button>

                    <div className="h-8 w-px bg-slate-800 mx-2 hidden xl:block" />

                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 h-12 items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "px-3 h-full rounded-lg transition-all font-black uppercase text-[10px]",
                                viewMode === "list" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "px-3 h-full rounded-lg transition-all font-black uppercase text-[10px]",
                                viewMode === "grid" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button className="h-12 bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl shadow-lg shadow-blue-500/20 font-black uppercase text-[10px] tracking-widest whitespace-nowrap">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Log
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                {/* Information Hierarchy (Sidebar) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 px-4 italic">Taxonomia Documental</p>
                        <div className="space-y-1.5">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={cn(
                                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden text-left",
                                    !selectedCategory
                                        ? "bg-blue-600/10 border border-blue-500/20 text-blue-400"
                                        : "text-slate-500 hover:bg-slate-900 border border-transparent hover:border-slate-800"
                                )}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <Folder className={cn("h-4 w-4", !selectedCategory ? "text-blue-400" : "text-slate-600")} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Repositório Root</span>
                                </div>
                                <span className="text-[9px] font-black bg-slate-950/50 px-2 py-0.5 rounded-full border border-slate-800 relative z-10">{documents.length}</span>
                            </button>

                            {categories.map((cat) => {
                                const count = documents.filter(d => d.category_id === cat.id).length;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group border relative overflow-hidden text-left",
                                            selectedCategory === cat.id
                                                ? "bg-slate-900 border-slate-700 text-white"
                                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900 border-transparent hover:border-slate-800"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className={cn("h-1.5 w-1.5 rounded-full", selectedCategory === cat.id ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-slate-800")} />
                                            <span className="text-[10px] font-black uppercase tracking-tight">{cat.name}</span>
                                        </div>
                                        <span className="text-[9px] font-black opacity-40 relative z-10">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="h-px bg-slate-800/50 mx-4" />

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 px-4 italic">Operações Avançadas</p>
                        <div className="grid grid-cols-1 gap-1.5">
                            {[
                                { label: "Console de Auditoria", icon: ShieldCheck, color: "text-amber-500" },
                                { label: "Matriz de Distribuição", icon: Users, color: "text-blue-500" },
                                { label: "Política de Retenção", icon: Archive, color: "text-slate-500" }
                            ].map((tool, i) => (
                                <Button key={i} variant="ghost" className="w-full justify-start gap-4 h-11 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-800 transition-all">
                                    <tool.icon className={cn("h-4 w-4", tool.color)} />
                                    {tool.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800/50 mt-8 mx-2 shadow-inner">
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ShieldCheck className="h-3 w-3" />
                            Integridade do Sistema
                        </p>
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Canais de Log Ativos</span>
                        </div>
                        <p className="text-[9px] text-slate-600 leading-relaxed font-medium uppercase tracking-tighter italic">
                            Sincronização redundante com serviço 21 CFR Part 11 Audit Trail em execução...
                        </p>
                    </div>
                </div>

                {/* Primary Data Mesh */}
                <div className="lg:col-span-4">
                    {filteredDocuments.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center py-32 rounded-[2.5rem] border-2 border-dashed border-slate-800 bg-slate-900/20 shadow-inner">
                            <div className="h-24 w-24 bg-slate-950/50 rounded-3xl flex items-center justify-center mb-8 border border-slate-800 shadow-xl">
                                <Archive className="h-10 w-10 text-slate-700" />
                            </div>
                            <p className="text-white font-black uppercase tracking-[0.2em] italic text-lg shadow-sm">Contentores Não Localizados</p>
                            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.1em] mt-3">A sua indexação não retornou nenhum registro no nó atual.</p>
                            <Button variant="ghost" onClick={() => setSelectedCategory(null)} className="mt-8 font-black uppercase text-[10px] tracking-[0.3em] text-blue-500 hover:text-blue-400 hover:bg-blue-500/5">
                                [ Resetar Workstation ]
                            </Button>
                        </Card>
                    ) : viewMode === "list" ? (
                        <Card className="bg-card border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-900/50">
                                    <TableRow className="border-b border-slate-800 hover:bg-transparent">
                                        <TableHead className="w-16 py-4 px-6"></TableHead>
                                        <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Código Documental</TableHead>
                                        <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Título / Mestre</TableHead>
                                        <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Versão</TableHead>
                                        <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Estado Industrial</TableHead>
                                        <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Próxima Revisão</TableHead>
                                        <TableHead className="py-4 px-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDocuments.map((doc) => {
                                        const status = getStatusInfo(doc.current_version?.status);
                                        return (
                                            <TableRow key={doc.id} className="group hover:bg-slate-900/40 transition-all border-b border-slate-800/30 last:border-0 border-x-0">
                                                <TableCell className="py-3 px-6">
                                                    <div className="h-10 w-10 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 group-hover:border-blue-500/30 transition-all shadow-inner">
                                                        <FileText className="h-5 w-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <span className="font-mono text-[10px] bg-slate-950/50 text-blue-400 px-2 py-1 rounded border border-slate-800 font-black italic">
                                                        {doc.doc_number}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-white italic tracking-tight group-hover:text-blue-400 transition-colors line-clamp-1">
                                                            {doc.title}
                                                        </span>
                                                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                                            <Folder className="h-2.5 w-2.5" />
                                                            {doc.category?.name || "Geral"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <Badge variant="outline" className="text-[9px] font-black bg-slate-950/50 border-slate-800 text-slate-500 px-2 min-w-[32px] justify-center italic">
                                                        V{doc.current_version?.version_number || "0.0"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest shadow-inner", status.color)}>
                                                        {status.icon}
                                                        {status.label}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter italic">
                                                            {doc.periodic_reviews?.[0]?.scheduled_date ? new Date(doc.periodic_reviews[0].scheduled_date).toLocaleDateString() : "---"}
                                                        </span>
                                                        {doc.periodic_reviews?.[0]?.scheduled_date && (
                                                            <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em] italic">Agendada</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                                                        <Link href={`/quality/documents/${doc.id}`}>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg">
                                                            <ShieldCheck className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-600 rounded-lg">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            <div className="p-4 bg-slate-950/20 border-t border-slate-800">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 text-center italic">
                                    SmartLab Documentation Engine • ISO 9001 Regulatory Center
                                </p>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                            {filteredDocuments.map((doc) => {
                                const status = getStatusInfo(doc.current_version?.status);
                                return (
                                    <Link key={doc.id} href={`/quality/documents/${doc.id}`}>
                                        <Card className="bg-card border-slate-800 hover:border-blue-500/40 hover:bg-slate-900/50 shadow-xl transition-all group overflow-hidden rounded-2xl h-full flex flex-col">
                                            <CardContent className="p-6 flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 group-hover:border-blue-500/50 group-hover:scale-110 transition-all shadow-inner">
                                                        <FileText className="h-6 w-6 text-blue-500/80" />
                                                    </div>
                                                    <div className={cn("px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-inner", status.color)}>
                                                        {status.icon}
                                                        {status.label}
                                                    </div>
                                                </div>

                                                <div className="space-y-3 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">{doc.doc_number}</span>
                                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">EDITION v{doc.current_version?.version_number || "0.0"}</span>
                                                    </div>
                                                    <h3 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors tracking-tight italic leading-relaxed line-clamp-2">
                                                        {doc.title}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-tight flex items-center gap-2">
                                                        <Folder className="h-3 w-3" />
                                                        {doc.category?.name || "Global"}
                                                    </p>
                                                </div>

                                                <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5 text-slate-500">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">
                                                            Logs: {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : "---"}
                                                        </span>
                                                    </div>
                                                    <div className="h-7 w-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:border-blue-500/50 group-hover:bg-blue-600 transition-all">
                                                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white" />
                                                    </div>
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
