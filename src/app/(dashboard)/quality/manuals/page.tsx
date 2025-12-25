import { Suspense } from "react";
import { getDocuments, getDocCategories, getPlants } from "@/lib/queries/dms";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CreateDocumentDialog } from "./_components/create-document-dialog";

export default async function ManualsPage() {
    const { data: documents } = await getDocuments();
    const { data: categories } = await getDocCategories();
    const { data: plants } = await getPlants();

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                        Gestão Documental (DMS)
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Controlo de SOPs, Métodos, Especificações e Formulários normatizados.
                    </p>
                </div>
                <CreateDocumentDialog categories={categories} plants={plants} />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Pesquisar documentos por título ou código..."
                        className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-slate-800 text-slate-300">
                        <Filter className="mr-2 h-4 w-4" />
                        Prioridade
                    </Button>
                    <Button variant="outline" className="border-slate-800 text-slate-300">
                        Todas as Categorias
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                    <Link key={doc.id} href={`/quality/manuals/${doc.id}`}>
                        <Card className="glass border-slate-800/50 hover:border-emerald-500/50 transition-all group overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <Badge variant="outline" className="border-slate-700 text-slate-400">
                                        {doc.category?.code || "DOC"}
                                    </Badge>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                                        {doc.title}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {doc.doc_number}
                                    </p>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-500">Versão Atual</span>
                                        <span className="text-xs font-medium text-slate-300">
                                            {doc.current_version?.version_number || "Sem Versão"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-500">Estado</span>
                                        <Badge className={getStatusColor(doc.current_version?.status)}>
                                            {getStatusLabel(doc.current_version?.status)}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function getStatusColor(status?: string) {
    switch (status) {
        case 'published': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'review': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'draft': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        case 'superseded': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
}

function getStatusLabel(status?: string) {
    switch (status) {
        case 'published': return 'Publicado';
        case 'review': return 'Em Revisão';
        case 'draft': return 'Rascunho';
        case 'superseded': return 'Obsoleto';
        default: return 'Pendente';
    }
}
