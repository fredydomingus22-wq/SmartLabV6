"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ApprovalStatus = "approved" | "rejected" | "quarantine" | "active";

/* --- Raw Material Lots --- */

export async function approveRawMaterialLotAction(lotId: string, status: ApprovalStatus, comments: string) {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Unauthorized" };

        // Get organization_id
        const { data: profile } = await supabase.from("user_profiles").select("organization_id").eq("id", user.id).single();
        if (!profile) return { success: false, message: "Profile not found" };

        // Get current status for log
        const { data: currentLot } = await supabase.from("raw_material_lots").select("status").eq("id", lotId).single();

        // Update Lot
        const { error: updateError } = await supabase
            .from("raw_material_lots")
            .update({
                status: status,
                qc_notes: comments
            })
            .eq("id", lotId);

        if (updateError) throw updateError;

        // Log Approval
        const { error: logError } = await supabase.from("raw_material_lot_approvals").insert({
            lot_id: lotId,
            new_status: status,
            previous_status: currentLot?.status,
            comments: comments,
            reviewed_by: user.id,
            organization_id: profile.organization_id
        });

        if (logError) console.error("Error logging approval:", logError);

        revalidatePath(`/materials/raw/lots/${lotId}`);
        revalidatePath(`/materials/raw`);
        revalidatePath(`/materials/raw/lots`);
        return { success: true, message: `Lote ${status === 'approved' || status === 'active' ? 'aprovado/libertado' : status === 'rejected' ? 'rejeitado' : 'atualizado'} com sucesso.` };

    } catch (error: any) {
        console.error("Error approving lot:", error);
        return { success: false, message: "Erro ao processar aprovação." };
    }
}


/* --- Packaging Lots --- */

export async function approvePackagingLotAction(lotId: string, status: ApprovalStatus, comments: string) {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Unauthorized" };

        // Get organization_id
        const { data: profile } = await supabase.from("user_profiles").select("organization_id").eq("id", user.id).single();
        if (!profile) return { success: false, message: "Profile not found" };

        // Get current status for log
        const { data: currentLot } = await supabase.from("packaging_lots").select("status").eq("id", lotId).single();

        // Update Lot
        const { error: updateError } = await supabase
            .from("packaging_lots")
            .update({
                status: status,
                qc_notes: comments
            })
            .eq("id", lotId);

        if (updateError) throw updateError;

        // Log Approval
        const { error: logError } = await supabase.from("packaging_lot_approvals").insert({
            lot_id: lotId,
            new_status: status,
            previous_status: currentLot?.status,
            comments: comments,
            reviewed_by: user.id,
            organization_id: profile.organization_id
        });

        if (logError) console.error("Error logging packaging approval:", logError);

        revalidatePath(`/materials/packaging/lots`);
        revalidatePath(`/materials/packaging`);
        return { success: true, message: `Lote de embalagem ${status === 'approved' || status === 'active' ? 'ativado/libertado' : status === 'rejected' ? 'rejeitado' : 'atualizado'} com sucesso.` };

    } catch (error: any) {
        console.error("Error approving packaging lot:", error);
        return { success: false, message: "Erro ao processar aprovação." };
    }
}
