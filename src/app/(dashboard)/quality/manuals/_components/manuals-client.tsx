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
    Archive
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ManualsClientProps {
    documents: any[];
    categories: any[];
    plants: any[];
}

export function ManualsClient({ documents = [], categories = [], plants = [] }: ManualsClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
            case 'published': return { label: 'Publicado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> };
            case 'review': return { label: 'Em Revisão', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Clock className="h-3 w-3 mr-1" /> };
            case 'draft': return { label: 'Rascunho', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: <FileText className="h-3 w-3 mr-1" /> };
            case 'superseded': return { label: 'Obsoleto', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: <Archive className="h-3 w-3 mr-1" /> };
            default: return { label: 'Desconhecido', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: <AlertCircle className="h-3 w-3 mr-1" /> };
        }
    };

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Pesquisar por título, código ou conteúdo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-slate-950/50 border-slate-800 text-slate-200 focus:ring-emerald-500/20 h-11"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtros Avançados
                    </Button>
                    <div className="h-8 w-px bg-slate-800 mx-2 hidden md:block" />
                    <div className="flex bg-slate-950/50 p-1 rounded-lg border border-slate-800">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className={cn("px-2", viewMode === "grid" && "bg-slate-800 text-emerald-400")}
                        >
                            <Folder className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className={cn("px-2", viewMode === "list" && "bg-slate-800 text-emerald-400")}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Categories Sidebar */}
                <div className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-4">Categorias</h2>
                    <div className="space-y-1">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group",
                                !selectedCategory ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Folder className={cn("h-4 w-4 transition-transform group-hover:scale-110", !selectedCategory ? "text-emerald-400" : "text-slate-500")} />
                                <span className="text-sm font-medium">Todos os Documentos</span>
                            </div>
                            <Badge variant="outline" className="bg-slate-950/50 border-slate-800 text-[10px]">{documents.length}</Badge>
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group",
                                    selectedCategory === cat.id ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Folder className={cn("h-4 w-4 transition-transform group-hover:scale-110", selectedCategory === cat.id ? "text-emerald-400" : "text-slate-500")} />
                                    <span className="text-sm font-medium">{cat.name}</span>
                                </div>
                                <Badge variant="outline" className="bg-slate-950/50 border-slate-800 text-[10px]">
                                    {documents.filter(d => d.category_id === cat.id).length}
                                </Badge>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    {filteredDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                            <Archive className="h-12 w-12 text-slate-700 mb-4" />
                            <p className="text-slate-500 font-medium">Nenhum documento encontrado nesta categoria.</p>
                            <Button variant="link" onClick={() => setSelectedCategory(null)} className="text-emerald-500 mt-2">
                                Limpar filtros
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredDocuments.map((doc) => {
                                const status = getStatusInfo(doc.current_version?.status);
                                return (
                                    <Link key={doc.id} href={`/quality/manuals/${doc.id}`}>
                                        <Card className="glass border-slate-800/50 hover:border-emerald-500/40 hover:bg-slate-800/20 transition-all group overflow-hidden">
                                            <CardContent className="p-5">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 group-hover:border-emerald-500/50 transition-colors">
                                                        <FileText className="h-5 w-5 text-emerald-500" />
                                                    </div>
                                                    <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-tighter px-2", status.color)}>
                                                        {status.icon}
                                                        {status.label}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                                                        {doc.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span className="font-mono bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-800/50">{doc.doc_number}</span>
                                                        <span>•</span>
                                                        <span>v{doc.current_version?.version_number || "0.0"}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-5 pt-4 border-t border-slate-800/50 grid grid-cols-2 gap-2">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="text-[10px] font-medium truncate">
                                                            P. Rev: {doc.periodic_reviews?.[0]?.scheduled_date || "N/A"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-400 justify-end">
                                                        <User className="h-3 w-3" />
                                                        <span className="text-[10px] font-medium truncate">Owner ID: {doc.owner_id?.slice(0, 8)}...</span>
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
