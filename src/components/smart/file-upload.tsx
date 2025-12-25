"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, File, X, Loader2, ExternalLink, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface FileUploadProps {
    name: string;
    label?: string;
    accept?: string;
    bucket?: string;
    folder?: string;
    onUploadComplete?: (url: string) => void;
    existingUrl?: string;
}

export function FileUpload({
    name,
    label = "Upload File",
    accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    bucket = "coa-documents",
    folder = "",
    onUploadComplete,
    existingUrl,
}: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string>(existingUrl || "");
    const [fileName, setFileName] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-upload when file is selected
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        console.log("File selected:", selectedFile.name);

        // Validate file size (max 10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error("File too large. Maximum size is 10MB.");
            return;
        }

        setFileName(selectedFile.name);
        setUploading(true);

        try {
            const supabase = createClient();

            // Check if user is authenticated
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            console.log("Auth check:", user?.email, authError);

            if (!user) {
                throw new Error("You must be logged in to upload files");
            }

            // Generate unique filename
            const timestamp = Date.now();
            const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
            const path = folder ? `${folder}/${timestamp}_${safeFileName}` : `${timestamp}_${safeFileName}`;

            console.log("Uploading to:", bucket, path);

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(path, selectedFile, {
                    cacheControl: "3600",
                    upsert: false,
                });

            console.log("Upload result:", data, error);

            if (error) {
                throw error;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            console.log("Public URL:", urlData.publicUrl);

            setUploadedUrl(urlData.publicUrl);
            onUploadComplete?.(urlData.publicUrl);
            toast.success("File uploaded successfully!");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to upload file");
            setFileName("");
        } finally {
            setUploading(false);
            // Reset input so same file can be selected again
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    };

    const handleRemove = () => {
        setUploadedUrl("");
        setFileName("");
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>

            {/* Hidden input to store the URL for form submission */}
            <input type="hidden" name={name} value={uploadedUrl} />

            {uploadedUrl ? (
                // Show uploaded file info
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="flex-1 text-sm truncate text-green-700 dark:text-green-300">
                        {fileName || "Document uploaded"}
                    </span>
                    <a
                        href={uploadedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                        View <ExternalLink className="h-3 w-3" />
                    </a>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemove}
                        className="h-6 w-6 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : uploading ? (
                // Show uploading state
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="flex-1 text-sm">Uploading {fileName}...</span>
                </div>
            ) : (
                // Show file picker
                <div
                    className="flex items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => inputRef.current?.click()}
                >
                    <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                            Click to select and upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            PDF, DOC, DOCX, JPG, PNG (max 10MB)
                        </p>
                    </div>
                    <Input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            )}
        </div>
    );
}
