"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

export async function uploadAuditEvidenceAction(formData: FormData) {
    const file = formData.get("file") as File;
    const auditId = formData.get("auditId") as string;
    const questionId = formData.get("questionId") as string;

    if (!file || !auditId || !questionId) {
        return { success: false, message: "Dados inválidos" };
    }

    const supabase = await createClient();
    const user = await getSafeUser();

    // Generate unique path
    const fileExt = file.name.split(".").pop();
    const fileName = `${auditId}/${questionId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from("audit-evidence")
        .upload(fileName, file, {
            upsert: false,
        });

    if (uploadError) {
        console.error("Upload error:", uploadError);
        return { success: false, message: "Erro ao fazer upload do ficheiro" };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from("audit-evidence")
        .getPublicUrl(fileName);

    return {
        success: true,
        url: publicUrl,
        name: file.name,
        type: file.type
    };
}
