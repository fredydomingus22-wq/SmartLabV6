"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { revalidatePath } from "next/cache";

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface CreateTaskParams {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    assigneeId?: string;
    moduleContext: string;
    entityId?: string;
    entityReference?: string;
}

export async function createTaskAction(params: CreateTaskParams) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("app_tasks")
        .insert({
            organization_id: user.organization_id,
            plant_id: user.plant_id,
            title: params.title,
            description: params.description,
            status: params.status || 'todo',
            priority: params.priority || 'medium',
            due_date: params.dueDate,
            assignee_id: params.assigneeId,
            module_context: params.moduleContext,
            entity_id: params.entityId,
            entity_reference: params.entityReference,
            created_by: user.id
        })
        .select()
        .single();

    if (error) throw error;

    revalidatePath("/tasks");
    return data;
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const updateData: any = { status };
    if (status === 'in_progress') updateData.started_at = new Date().toISOString();
    if (status === 'done') updateData.completed_at = new Date().toISOString();

    const { data, error } = await supabase
        .from("app_tasks")
        .update(updateData)
        .eq("id", taskId)
        .eq("organization_id", user.organization_id)
        .select()
        .single();

    if (error) throw error;

    revalidatePath("/tasks");
    return data;
}

export async function getMyTasksAction() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("app_tasks")
        .select(`
            *,
            assignee:user_profiles!app_tasks_assignee_id_fkey(full_name, id)
        `)
        .eq("organization_id", user.organization_id)
        .or(`assignee_id.eq.${user.id},created_by.eq.${user.id}`)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function getPlantTasksAction() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("app_tasks")
        .select(`
            *,
            assignee:user_profiles!app_tasks_assignee_id_fkey(full_name, id)
        `)
        .eq("organization_id", user.organization_id)
        .eq("plant_id", user.plant_id)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}
