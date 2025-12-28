"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureSystemOwner, logSystemAction } from "./utils";
import { revalidatePath } from "next/cache";

export async function getAllGlobalUsers() {
    try {
        const user = await ensureSystemOwner();
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
                *,
                organizations (name, slug),
                plants (name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function createGlobalUserAction(formData: FormData) {
    try {
        const user = await ensureSystemOwner();
        const supabase = createAdminClient();

        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const fullName = formData.get('full_name') as string;
        const role = formData.get('role') as string;
        const organizationId = formData.get('organization_id') as string;
        let plantId = formData.get('plant_id') as string || null;

        // Handle explicit "no_plant" value from UI
        if (plantId === 'no_plant') plantId = null;

        if (!email || !password || !fullName || !organizationId || !role) {
            return { success: false, message: "Missing required fields" };
        }

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) throw authError;

        // 2. Create User Profile
        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                id: authData.user.id,
                organization_id: organizationId,
                plant_id: plantId,
                role,
                full_name: fullName
            });

        if (profileError) {
            // Rollback auth user creation if profile fails
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw profileError;
        }

        // Log SaaS Action
        await logSystemAction({
            actorId: user.id,
            action: 'CREATE_GLOBAL_USER',
            entityType: 'user',
            entityId: authData.user.id,
            newData: { email, fullName, role, organizationId }
        });

        revalidatePath('/saas/users');
        return { success: true, message: "Utilizador criado com sucesso" };
    } catch (e: any) {
        console.error("Error creating global user:", e);
        return { success: false, message: e.message };
    }
}

export async function deleteGlobalUserAction(userId: string) {
    try {
        const user = await ensureSystemOwner();
        const supabase = createAdminClient();

        // This will cascade to user_profiles due to FK REFERENCES auth.users(id) ON DELETE CASCADE
        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) throw error;

        // Log SaaS Action
        await logSystemAction({
            actorId: user.id,
            action: 'DELETE_GLOBAL_USER',
            entityType: 'user',
            entityId: userId
        });

        revalidatePath('/saas/users');
        return { success: true, message: "Utilizador removido do sistema" };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}


export async function updateGlobalUserAction(formData: FormData) {
    try {
        const user = await ensureSystemOwner();
        const supabase = createAdminClient();

        const userId = formData.get('user_id') as string;
        const role = formData.get('role') as string;
        const organizationId = formData.get('organization_id') as string;
        let plantId = formData.get('plant_id') as string || null;

        // Handle explicit "no_plant" value from UI
        if (plantId === 'no_plant') plantId = null;
        const fullName = formData.get('full_name') as string;

        if (!userId || !role || !fullName) {
            return { success: false, message: "Missing required fields" };
        }

        // 1. Update User Profile
        const { error: profileError } = await supabase
            .from('user_profiles')
            .update({
                role,
                organization_id: organizationId || null,
                plant_id: plantId,
                full_name: fullName
            })
            .eq('id', userId);

        if (profileError) throw profileError;

        // 2. Update Auth Metadata (for consistent full_name)
        const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { full_name: fullName }
        });

        if (authError) throw authError;

        // Log SaaS Action
        await logSystemAction({
            actorId: user.id,
            action: 'UPDATE_GLOBAL_USER',
            entityType: 'user',
            entityId: userId,
            newData: { fullName, role, plantId }
        });

        revalidatePath('/saas/users');
        revalidatePath(`/saas/users/${userId}`);
        return { success: true, message: "Utilizador atualizado com sucesso" };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
