"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssetDocument {
    id: string;
    name: string;
    path: string;
    file_type: string | null;
    size: number | null;
    created_at: string;
    uploaded_by: string;
}

interface AssetDocumentListProps {
    documents: AssetDocument[];
}

export function AssetDocumentList({ documents }: AssetDocumentListProps) {
    if (documents.length === 0) {
        return (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhum documento carregado.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg hover:bg-slate-800/60 transition-colors group">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                            <FileText className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-200">{doc.name}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                                <span>•</span>
                                <span className="uppercase">{doc.file_type?.split('/').pop() || 'DOC'}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={doc.path} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            Abrir
                        </a>
                    </Button>
                </div>
            ))}
        </div>
    );
}
