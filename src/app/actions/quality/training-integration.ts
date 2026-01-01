"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { revalidatePath } from "next/cache";

/**
 * Triggered when a Document Version is PUBLISHED.
 * Ensures a corresponding Training Module exists and is up to date.
 */
export async function syncDocumentToTrainingAction(documentId: string, versionId: string, versionNumber: string, title: string) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        // 1. Check if a Training Module already exists for this Document
        const { data: existingModule } = await supabase
            .from("training_modules")
            .select("id, title")
            .eq("document_id", documentId)
            .single();

        let moduleId = existingModule?.id;

        if (existingModule) {
            // UPDATE existing module to point to new version
            await supabase
                .from("training_modules")
                .update({
                    document_version: versionNumber,
                    title: `${title} (v${versionNumber}) - Rev`, // Append revision indicator
                    updated_at: new Date().toISOString()
                })
                .eq("id", existingModule.id);
        } else {
            // CREATE new "Read & Understood" Module
            const { data: newModule, error } = await supabase
                .from("training_modules")
                .insert({
                    organization_id: user.organization_id,
                    title: `Leitura: ${title} (v${versionNumber})`,
                    description: `Leitura obrigatória para o documento ${title} versão ${versionNumber}.`,
                    type: "document",
                    document_id: documentId,
                    document_version: versionNumber,
                    duration_minutes: 15, // Default duration
                    created_by: user.id
                })
                .select("id")
                .single();

            if (error) throw error;
            moduleId = newModule.id;
        }

        // 2. Auto-Assign Training (Optional - Logic can be complex)
        // For Phase 12-A, we will just create the module. 
        // A Manager would manually "Assign" or we could auto-assign to previous assignees.

        // Log the linkage
        console.log(`[ClosedLoop] Synced Document ${documentId} to Training Module ${moduleId}`);

        return { success: true, moduleId };

    } catch (error: any) {
        console.error("syncDocumentToTrainingAction error:", error);
        return { success: false, error: error.message };
    }
}
