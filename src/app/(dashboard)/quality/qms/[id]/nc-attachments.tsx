"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/smart/file-upload";
import { Paperclip, Download, Trash2, FileText, Image, File, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NCAttachmentsProps {
    ncId: string;
    organizationId: string;
}

interface Attachment {
    id: string;
    file_url: string;
    file_name: string;
    file_type?: string;
    file_size_bytes?: number;
    uploaded_at: string;
}

export function NCAttachments({ ncId, organizationId }: NCAttachmentsProps) {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const supabase = createClient();

    const loadAttachments = async () => {
        const { data } = await supabase
            .from("nc_attachments")
            .select("*")
            .eq("nonconformity_id", ncId)
            .order("uploaded_at", { ascending: false });

        if (data) setAttachments(data);
        setLoading(false);
    };

    useEffect(() => {
        loadAttachments();
    }, [ncId]);

    const handleUploadComplete = async (fileUrl: string) => {
        setUploading(true);
        // Extract filename from URL
        const fileName = fileUrl.split("/").pop() || "attachment";

        const { error } = await supabase.from("nc_attachments").insert({
            organization_id: organizationId,
            nonconformity_id: ncId,
            file_url: fileUrl,
            file_name: fileName,
        });

        if (error) {
            toast.error("Failed to save attachment");
        } else {
            toast.success("Attachment uploaded");
            loadAttachments();
        }
        setUploading(false);
    };

    const deleteAttachment = async (id: string, fileUrl: string) => {
        // Delete from storage
        const path = fileUrl.split("/").slice(-2).join("/");
        await supabase.storage.from("nc-evidence").remove([path]);

        // Delete from database
        const { error } = await supabase
            .from("nc_attachments")
            .delete()
            .eq("id", id);

        if (error) {
            toast.error("Failed to delete attachment");
        } else {
            toast.success("Attachment deleted");
            setAttachments((prev) => prev.filter((a) => a.id !== id));
        }
    };

    const getFileIcon = (type?: string) => {
        if (type?.startsWith("image/")) return <Image className="h-5 w-5 text-blue-500" />;
        if (type?.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
        return <File className="h-5 w-5 text-gray-500" />;
    };

    const formatSize = (bytes?: number) => {
        if (!bytes) return "";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Evidências & Anexos
                </CardTitle>
                <span className="text-sm text-slate-400">
                    {attachments.length} ficheiro(s)
                </span>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Secção de Upload */}
                <div className="border-2 border-dashed border-slate-800 rounded-lg p-4 bg-slate-900/20">
                    <FileUpload
                        name="nc-evidence"
                        bucket="nc-evidence"
                        folder={`nc-${ncId}`}
                        onUploadComplete={handleUploadComplete}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    />
                </div>

                {/* Listagem de Anexos */}
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : attachments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum anexo encontrado</p>
                    </div>
                ) : (

                    <div className="space-y-2">
                        {attachments.map((att) => (
                            <div
                                key={att.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                            >
                                <div className="flex items-center gap-3">
                                    {getFileIcon(att.file_type)}
                                    <div>
                                        <p className="font-medium text-sm truncate max-w-[200px]">
                                            {att.file_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(att.uploaded_at).toLocaleDateString()}
                                            {att.file_size_bytes && ` • ${formatSize(att.file_size_bytes)}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </a>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() => deleteAttachment(att.id, att.file_url)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
