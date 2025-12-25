"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const DocumentSchema = z.object({
    title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
    doc_number: z.string().min(2, "O código deve ser preenchido"),
    category_id: z.string().uuid("Categoria inválida"),
    plant_id: z.string().uuid("Planta inválida"),
});

/**
 * Create a new document container
 */
export async function createDocumentAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const validatedFields = DocumentSchema.safeParse({
            title: formData.get("title"),
            doc_number: formData.get("doc_number"),
            category_id: formData.get("category_id"),
            plant_id: formData.get("plant_id"),
        });

        if (!validatedFields.success) {
            return { success: false, error: "Campos inválidos", details: validatedFields.error.flatten().fieldErrors };
        }

        const { data, error } = await supabase
            .from("documents")
            .insert({
                ...validatedFields.data,
                organization_id: user.organization_id,
                owner_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath("/(dashboard)/quality/manuals", "page");
        return { success: true, data, message: "Documento criado com sucesso" };
    } catch (error: any) {
        console.error("createDocumentAction error:", error);
        return { success: false, error: error.message || "Erro ao criar documento" };
    }
}

/**
 * Upload a new version for a document
 */
export async function createDocumentVersionAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const document_id = formData.get("document_id") as string;
        const version_number = formData.get("version_number") as string;
        const change_description = formData.get("change_description") as string;
        const file_path = formData.get("file_path") as string;

        const { data: version, error: versionError } = await supabase
            .from("document_versions")
            .insert({
                document_id,
                organization_id: user.organization_id,
                version_number,
                change_description,
                file_path,
                status: "draft",
                created_by: user.id,
            })
            .select()
            .single();

        if (versionError) throw versionError;

        revalidatePath(`/(dashboard)/quality/manuals/${document_id}`, "page");
        return { success: true, version, message: "Versão carregada com sucesso" };
    } catch (error: any) {
        console.error("createDocumentVersionAction error:", error);
        return { success: false, error: error.message || "Erro ao fazer upload da versão" };
    }
}

/**
 * Submit a version for review
 */
export async function submitForReviewAction(versionId: string, approverIds: string[]) {
    try {
        const supabase = await createClient();

        // Update version status
        const { error: statusError } = await supabase
            .from("document_versions")
            .update({ status: "review" })
            .eq("id", versionId);

        if (statusError) throw statusError;

        // Create approval records
        const approvals = approverIds.map(approverId => ({
            version_id: versionId,
            approver_id: approverId,
            status: "pending",
            role: "approver"
        }));

        const { error: approvalsError } = await supabase
            .from("document_approvals")
            .insert(approvals);

        if (approvalsError) throw approvalsError;

        revalidatePath("/(dashboard)/quality/manuals", "layout");
        return { success: true, message: "Documento submetido para revisão" };
    } catch (error: any) {
        console.error("submitForReviewAction error:", error);
        return { success: false, error: error.message || "Erro ao submeter para revisão" };
    }
}

/**
 * Approve or Reject a document version
 */
export async function processApprovalAction(approvalId: string, status: "approved" | "rejected", comments?: string) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const { error } = await supabase
            .from("document_approvals")
            .update({
                status,
                comments,
                signed_at: new Date().toISOString()
            })
            .eq("id", approvalId)
            .eq("approver_id", user.id);

        if (error) throw error;

        revalidatePath("/(dashboard)/quality/manuals", "layout");
        return { success: true, message: status === "approved" ? "Aprovado com sucesso" : "Rejeitado com sucesso" };
    } catch (error: any) {
        console.error("processApprovalAction error:", error);
        return { success: false, error: error.message || "Erro ao processar aprovação" };
    }
}

/**
 * Publish an approved version (marking previous as superseded)
 */
export async function publishDocumentVersionAction(versionId: string) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        // 1. Get version and document info
        const { data: version, error: vError } = await supabase
            .from("document_versions")
            .select("document_id")
            .eq("id", versionId)
            .single();

        if (vError) throw vError;

        // 2. Mark existing published version as superseded
        await supabase
            .from("document_versions")
            .update({ status: "superseded" })
            .eq("document_id", version.document_id)
            .eq("status", "published");

        // 3. Mark this version as published
        const { error: pError } = await supabase
            .from("document_versions")
            .update({
                status: "published",
                published_at: new Date().toISOString(),
                published_by: user.id,
                effective_date: new Date().toISOString()
            })
            .eq("id", versionId);

        if (pError) throw pError;

        // 4. Update the document container's current version
        await supabase
            .from("documents")
            .update({ current_version_id: versionId, updated_at: new Date().toISOString() })
            .eq("id", version.document_id);

        revalidatePath("/(dashboard)/quality/manuals", "layout");
        return { success: true, message: "Documento publicado com sucesso" };
    } catch (error: any) {
        console.error("publishDocumentVersionAction error:", error);
        return { success: false, error: error.message || "Erro ao publicar documento" };
    }
}
