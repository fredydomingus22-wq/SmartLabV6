"use client";

import { FileUpload } from "@/components/smart/file-upload";
import { toast } from "sonner";

import { createLabAssetDocumentAction } from "@/app/actions/lab-assets";

interface AssetDocumentUploadProps {
    assetId: string;
}

export function AssetDocumentUpload({ assetId }: AssetDocumentUploadProps) {
    const handleUploadComplete = async (url: string) => {
        // Extract filename from URL or defaulting
        const fileName = url.split('/').pop() || "documento";
        const path = url; // The FileUpload likely returns the public URL or path

        const result = await createLabAssetDocumentAction({
            asset_id: assetId,
            name: fileName,
            path: path,
            file_type: "application/octet-stream", // Simple default, can be improved
            size: 0 // We assume size isn't critical for this quick fix
        });

        if (result.success) {
            toast.success("Documento carregado e salvo com sucesso!");
        } else {
            toast.error("Erro ao salvar referência do documento: " + result.message);
        }
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
