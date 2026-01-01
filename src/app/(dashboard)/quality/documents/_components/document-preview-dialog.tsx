"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Download, ExternalLink, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDocumentSignedUrlAction } from "@/app/actions/dms";
import { toast } from "sonner";

interface DocumentPreviewDialogProps {
    filePath: string | null;
    fileName: string;
    fileType: string | null;
    documentTitle: string;
    versionNumber: string;
    versionId?: string;
}

export function DocumentPreviewDialog({
    filePath,
    fileName,
    fileType,
    documentTitle,
    versionNumber,
    versionId
}: DocumentPreviewDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);

    useEffect(() => {
        if (isOpen && filePath) {
            handleGenerateUrl();
        } else if (!isOpen) {
            setSignedUrl(null);
            setIsLoading(true);
        }
    }, [isOpen, filePath]);

    const handleGenerateUrl = async () => {
        if (!filePath) return;

        setIsGeneratingUrl(true);
        const result = await getDocumentSignedUrlAction(filePath, versionId);
        setIsGeneratingUrl(false);

        if (result.success && result.signedUrl) {
            setSignedUrl(result.signedUrl);
        } else {
            toast.error(result.error || "Erro ao carregar ficheiro");
            setIsOpen(false);
        }
    };

    // More robust extension detection
    const getExtension = (path: string | null) => {
        if (!path) return "";
        try {
            // Remove query parameters and hashes
            const base = path.split(/[?#]/)[0];
            const parts = base.split('.');
            return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
        } catch (e) {
            return "";
        }
    };

    const extension = getExtension(filePath) || getExtension(fileName);
    const mimeType = fileType?.toLowerCase() || "";

    const isImageMime = mimeType.startsWith('image/');
    const isPdfMime = mimeType === 'application/pdf';

    const previewableExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'pdf'];
    const isPdf = isPdfMime || extension === 'pdf';
    const canPreview = isPdf || isImageMime || previewableExtensions.includes(extension);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="border-white/5 bg-white/5 text-slate-300 hover:text-emerald-400 h-11 px-6 rounded-xl transition-all"
                >
                    <Eye className="mr-2 h-4 w-4" />
                    Workstation View
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl h-[90vh] glass border-white/10 bg-black/90 backdrop-blur-2xl flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b border-white/5 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-indigo-400" />
                                </div>
                                {documentTitle}
                            </DialogTitle>
                            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">
                                Version {versionNumber} • {fileName || "No file attached"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {signedUrl && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-white/10 text-slate-400 hover:text-white gap-2"
                                        onClick={() => window.open(signedUrl, '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Open in New Tab
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-2"
                                        asChild
                                    >
                                        <a href={signedUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                                            <Download className="h-4 w-4" />
                                            Download
                                        </a>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden bg-black/50 relative">
                    {isGeneratingUrl ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                            <p className="text-sm font-mono tracking-widest uppercase">Securing Workstation Connection...</p>
                        </div>
                    ) : !filePath ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                            <div className="h-24 w-24 rounded-2xl bg-white/5 flex items-center justify-center">
                                <FileText className="h-12 w-12 text-slate-600" />
                            </div>
                            <p className="text-lg font-medium">No document file attached</p>
                            <p className="text-sm text-slate-600">Upload a file to enable preview</p>
                        </div>
                    ) : !canPreview ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                            <div className="h-24 w-24 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                <AlertTriangle className="h-12 w-12 text-amber-400" />
                            </div>
                            <p className="text-lg font-medium">Preview not available</p>
                            <p className="text-sm text-slate-600 text-center max-w-md">
                                This file format cannot be previewed in the browser.
                                Please download the file to view it.
                            </p>
                            {/* Technical Diagnostic info */}
                            <div className="mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 font-mono uppercase">Detected:</span>
                                <span className="text-[10px] text-amber-400 font-mono">{extension || mimeType || "Unknown"}</span>
                            </div>
                            <Button
                                variant="outline"
                                className="mt-4 border-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-2"
                                asChild
                            >
                                <a href={signedUrl || "#"} download={fileName}>
                                    <Download className="h-4 w-4" />
                                    Download File
                                </a>
                            </Button>
                        </div>
                    ) : isPdf ? (
                        <>
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm text-slate-400">Loading document...</p>
                                    </div>
                                </div>
                            )}
                            {signedUrl && (
                                <iframe
                                    src={`${signedUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                                    className="w-full h-full border-0"
                                    onLoad={() => setIsLoading(false)}
                                    title={documentTitle}
                                />
                            )}
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center p-8">
                            {signedUrl && (
                                <img
                                    src={signedUrl}
                                    alt={documentTitle}
                                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                                    onLoad={() => setIsLoading(false)}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Industrial Footer */}
                <div className="p-4 border-t border-white/5 shrink-0 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                        <span>21 CFR Part 11 Compliant</span>
                        <span className="h-1 w-1 rounded-full bg-white/20" />
                        <span>Controlled Document</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-slate-500 font-mono uppercase">Workstation Mode Active</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
