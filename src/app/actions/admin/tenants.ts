"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureSystemOwner, logSystemAction } from "./utils";
import { revalidatePath } from "next/cache";

export type AdminTenantActionState = {
    success: boolean;
    message: string;
    data?: any;
};

export async function getAllTenantsAction() {
    try {
        const user = await ensureSystemOwner();
        const supabase = createAdminClient();

        const { data: orgs, error } = await supabase
            .from('organizations')
            .select(`
                *,
                plants (*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Add count of plants to each organization
        const orgsWithCount = orgs.map(org => ({
            ...org,
            plants_count: org.plants?.length || 0
        }));

        return { success: true, message: "Tenants retrieved", data: orgsWithCount };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function createTenantAction(formData: FormData): Promise<AdminTenantActionState> {
    try {
        const user = await ensureSystemOwner();
        const supabase = createAdminClient();

        const name = formData.get('name') as string;
        const slug = formData.get('slug') as string;
        const plan = formData.get('plan') as string || 'trial';

        if (!name || !slug) {
            return { success: false, message: "Name and Slug are required" };
        }

        // 1. Create Organization
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name,
                slug,
                plan,
                status: 'active',
                config: {}
            })
            .select()
            .single();

        if (orgError) throw orgError;

        // Log SaaS Action
        await logSystemAction({
            actorId: user.id,
            action: 'CREATE_TENANT',
            entityType: 'organization',
            entityId: org.id,
            newData: org
        });

        revalidatePath('/saas/tenants');
        return { success: true, message: "Tenant created successfully", data: org };

    } catch (error: any) {
        console.error("Create Tenant Error:", error);
        return { success: false, message: error.message };
    }
}

export async function updateTenantStatusAction(id: string, status: string): Promise<AdminTenantActionState> {
    try {
        const user = await ensureSystemOwner();
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('organizations')
            .update({ status })
            .eq('id', id);

        if (error) throw error;

        // Log SaaS Action
        await logSystemAction({
            actorId: user.id,
            action: 'UPDATE_TENANT_STATUS',
            entityType: 'organization',
            entityId: id,
            newData: { status }
        });

        revalidatePath('/saas/tenants');
        return { success: true, message: `Tenant status updated to ${status}` };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function getOrganizationDetails(id: string) {
    try {
        await ensureSystemOwner();
        const supabase = createAdminClient();

        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select(`
                *,
                plants (*),
                user_profiles (*)
            `)
            .eq('id', id)
            .single();

        if (orgError) throw orgError;

        return { success: true, data: org };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function createPlantAction(formData: FormData): Promise<AdminTenantActionState> {
    try {
        const user = await ensureSystemOwner();
        const supabase = createAdminClient();

        const name = formData.get('name') as string;
        const code = formData.get('code') as string;
        const organizationId = formData.get('organization_id') as string;
        const timezone = formData.get('timezone') as string || 'UTC';
        const city = formData.get('city') as string;
        const country = formData.get('country') as string || 'PT';

        if (!name || !organizationId || !code) {
            return { success: false, message: "Name, Code and Organization ID are required" };
        }

        const address = {
            city,
            country,
            line1: formData.get('address_line1') as string || ''
        };

        const { data: plant, error } = await supabase
            .from('plants')
            .insert({
                name,
                code,
                organization_id: organizationId,
                timezone,
                address
            })
            .select()
            .single();

        if (error) throw error;

        // Log action
        await logSystemAction({
            actorId: user.id,
            action: 'CREATE_PLANT',
            entityType: 'plant',
            entityId: plant.id,
            newData: plant
        });

        revalidatePath(`/saas/tenants/${organizationId}`);
        return { success: true, message: "Unidade criada com sucesso", data: plant };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updatePlantAction(formData: FormData): Promise<AdminTenantActionState> {
    try {
        const user = await ensureSystemOwner();
        const supabase = createAdminClient();

        const plantId = formData.get('plant_id') as string;
        const organizationId = formData.get('organization_id') as string;
        const name = formData.get('name') as string;
        const code = formData.get('code') as string;
        const timezone = formData.get('timezone') as string;
        const city = formData.get('city') as string;
        const country = formData.get('country') as string;

        if (!plantId || !name) {
            return { success: false, message: "Plant ID and Name are required" };
        }

        const address = {
            city: city,
            country: country,
            line1: formData.get('address_line1') as string || ''
        };

        const { data: plant, error } = await supabase
            .from('plants')
            .update({
                name,
                code,
                timezone,
                address
            })
            .eq('id', plantId)
            .select()
            .single();

        if (error) throw error;

        // Log action
        await logSystemAction({
            actorId: user.id,
            action: 'UPDATE_PLANT',
            entityType: 'plant',
            entityId: plant.id,
            newData: plant
        });

        revalidatePath(`/saas/tenants/${organizationId}`);
        return { success: true, message: "Unidade atualizada com sucesso", data: plant };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
