"use client";

import { FileUpload } from "@/components/smart/file-upload";
import { toast } from "sonner";

interface AssetDocumentUploadProps {
    assetId: string;
}

export function AssetDocumentUpload({ assetId }: AssetDocumentUploadProps) {
    const handleUploadComplete = (url: string) => {
        toast.success("Documento carregado com sucesso!");
        console.log("Uploaded to:", url);
        // Future: Save reference to database
    };

    return (
        <FileUpload
            name="asset_document"
            label="Carregar Documento"
            bucket="lab-assets"
            folder={assetId}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv"
            onUploadComplete={handleUploadComplete}
        />
    );
}
