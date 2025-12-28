"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const DocumentSchema = z.object({
    title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
    doc_number: z.string().min(2, "O código deve ser preenchido"),
    category_id: z.string().uuid("Categoria inválida"),
    plant_id: z.string().uuid("Planta inválida"),
    // Optional initial version fields
    initial_version_file_path: z.string().optional(),
    initial_version_number: z.string().optional(),
    initial_version_description: z.string().optional(),
});

/**
 * Create a new document container, optionally with an initial version
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
            initial_version_file_path: formData.get("initial_version_file_path"),
            initial_version_number: formData.get("initial_version_number"),
            initial_version_description: formData.get("initial_version_description"),
        });

        if (!validatedFields.success) {
            return { success: false, error: "Campos inválidos", details: validatedFields.error.flatten().fieldErrors };
        }

        const { data: doc, error } = await supabase
            .from("documents")
            .insert({
                title: validatedFields.data.title,
                doc_number: validatedFields.data.doc_number,
                category_id: validatedFields.data.category_id,
                plant_id: validatedFields.data.plant_id,
                organization_id: user.organization_id,
                owner_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        // Ensure we create the initial version if file path is provided
        if (validatedFields.data.initial_version_file_path) {
            const { error: versionError } = await supabase
                .from("document_versions")
                .insert({
                    document_id: doc.id,
                    organization_id: user.organization_id,
                    version_number: validatedFields.data.initial_version_number || "1.0",
                    change_description: validatedFields.data.initial_version_description || "Versão Inicial",
                    file_path: validatedFields.data.initial_version_file_path,
                    status: "draft",
                    created_by: user.id,
                });

            if (versionError) {
                console.error("Failed to create initial version:", versionError);
                // We don't throw here to avoid failing the document creation, but we warn
            }
        }

        revalidatePath("/(dashboard)/quality/manuals", "page");
        return { success: true, data: doc, message: "Documento criado com sucesso" };
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
 * Approve or Reject a document version with 21 CFR Part 11 Signature
 */
export async function processApprovalAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const approvalId = formData.get("approvalId") as string;
        const status = formData.get("status") as "approved" | "rejected";
        const comments = formData.get("comments") as string;
        const password = formData.get("password") as string;

        if (!password) {
            return { success: false, error: "Password required for electronic signature" };
        }

        // Verify password (21 CFR Part 11 requirement: re-authentication)
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password,
        });

        if (authError) {
            return { success: false, error: "Authentication failed. Invalid password." };
        }

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

/**
 * Acknowledge reading a document version (Training record)
 */
export async function acknowledgeDocumentReadingAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const versionId = formData.get("versionId") as string;
        const password = formData.get("password") as string;

        if (!password) {
            return { success: false, error: "Password required for acknowledgment signature" };
        }

        // 21 CFR Part 11 challenge
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password,
        });

        if (authError) return { success: false, error: "Invalid password" };

        const { error } = await supabase
            .from("doc_reading_logs")
            .insert({
                organization_id: user.organization_id,
                version_id: versionId,
                user_id: user.id,
                signature_hash: btoa(JSON.stringify({ userId: user.id, timestamp: new Date().toISOString(), versionId }))
            });

        if (error) throw error;

        revalidatePath("/quality/manuals/[id]", "page");
        return { success: true, message: "Leitura confirmada com sucesso" };
    } catch (error: any) {
        return { success: false, error: error.message || "Erro ao confirmar leitura" };
    }
}

/**
 * Perform a periodic review of a document
 */
export async function performPeriodicReviewAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const reviewId = formData.get("reviewId") as string;
        const result = formData.get("result") as string;
        const comments = formData.get("comments") as string;

        const { error } = await supabase
            .from("doc_periodic_reviews")
            .update({
                result,
                comments,
                performed_at: new Date().toISOString(),
                performed_by: user.id
            })
            .eq("id", reviewId);

        if (error) throw error;

        // If revision is needed, we could automatically trigger a task or notification

        revalidatePath("/quality/manuals/[id]", "page");
        return { success: true, message: "Revisão periódica registada" };
    } catch (error: any) {
        return { success: false, error: error.message || "Erro ao registar revisão" };
    }
}

