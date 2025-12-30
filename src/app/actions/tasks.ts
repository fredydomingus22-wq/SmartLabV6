"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { revalidatePath } from "next/cache";
import { createNotificationAction } from "./notifications";
import { ActionState } from "@/lib/types";

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

export async function createTaskAction(params: CreateTaskParams): Promise<ActionState> {
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

    if (error) return { success: false, message: error.message };

    // Notify assignee if specific user is assigned
    if (params.assigneeId) {
        await createNotificationAction({
            title: `Nova Tarefa: ${params.title}`,
            content: `Foi-lhe atribuída uma nova tarefa no módulo ${params.moduleContext}.`,
            type: 'task',
            severity: params.priority || 'medium',
            targetUserId: params.assigneeId,
            link: '/tasks',
            plantId: user.plant_id
        });
    }

    revalidatePath("/tasks");
    return { success: true, message: "Tarefa criada com sucesso.", data };
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus): Promise<ActionState> {
    const supabase = await createClient();
    const user = await getSafeUser();

    const updateData: { status: TaskStatus; started_at?: string; completed_at?: string } = { status };
    if (status === 'in_progress') updateData.started_at = new Date().toISOString();
    if (status === 'done') updateData.completed_at = new Date().toISOString();

    const { data, error } = await supabase
        .from("app_tasks")
        .update(updateData)
        .eq("id", taskId)
        .eq("organization_id", user.organization_id)
        .select()
        .single();

    if (error) return { success: false, message: error.message };

    revalidatePath("/tasks");
    return { success: true, message: "Estado da tarefa atualizado.", data };
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
