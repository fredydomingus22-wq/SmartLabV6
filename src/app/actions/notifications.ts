"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { revalidatePath } from "next/cache";

export type NotificationType = 'info' | 'alert' | 'deviation' | 'task';
export type NotificationSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CreateNotificationParams {
    title: string;
    content: string;
    type?: NotificationType;
    severity?: NotificationSeverity;
    link?: string;
    targetRole?: string;
    targetUserId?: string;
    plantId?: string;
}

export async function createNotificationAction(params: CreateNotificationParams) {
    const supabase = await createClient();
    const user = await getSafeUser();

    try {
        const { data, error } = await supabase
            .from("app_notifications")
            .insert({
                organization_id: user.organization_id,
                plant_id: params.plantId || user.plant_id,
                title: params.title,
                content: params.content,
                type: params.type || 'info',
                severity: params.severity || 'low',
                link: params.link,
                target_role: params.targetRole,
                target_user_id: params.targetUserId,
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;

        // Log Success (Optional, can be verbose. Let's log only failures to keep it clean, or keep it standard)
        // For DLQ we usually care about failures.

        return data;
    } catch (err: any) {
        // [NC-OPS-01] Dead Letter Queue Logic
        console.error("Notification Failed. Logging to DLQ:", err);

        await supabase.from("notification_logs").insert({
            organization_id: user.organization_id,
            target_role: params.targetRole || 'unknown',
            title: params.title,
            status: 'failed',
            error_message: err.message || JSON.stringify(err),
            metadata: { params }
        });

        // We do NOT throw here, allowing the calling transaction to proceed.
        return null;
    }
}

export async function getNotificationsAction() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Fetch notifications the user is supposed to see
    const { data: notifications, error } = await supabase
        .from("app_notifications")
        .select(`
            *,
            reads:app_notification_reads(user_id)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) throw error;

    // Map to include 'isRead' property
    return notifications.map(n => ({
        ...n,
        isRead: n.reads.some((r: { user_id: string }) => r.user_id === user.id)
    }));
}

export async function getUnreadCountAction() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // This is a bit tricky with RLS and joins, using a simpler approach
    const { data: notifications, error } = await supabase
        .from("app_notifications")
        .select(`
            id,
            reads:app_notification_reads(user_id)
        `);

    if (error) return 0;

    const unread = notifications.filter(n => !n.reads.some((r: { user_id: string }) => r.user_id === user.id));
    return unread.length;
}

export async function markAsReadAction(notificationId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { error } = await supabase
        .from("app_notification_reads")
        .upsert({
            notification_id: notificationId,
            user_id: user.id,
            read_at: new Date().toISOString()
        }, {
            onConflict: 'notification_id,user_id'
        });

    if (error) throw error;

    revalidatePath("/notifications");
    return { success: true };
}

export async function markAllAsReadAction() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const notifications = await getNotificationsAction();
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);

    if (unreadIds.length === 0) return { success: true };

    const readsToInsert = unreadIds.map(id => ({
        notification_id: id,
        user_id: user.id,
        read_at: new Date().toISOString()
    }));

    const { error } = await supabase
        .from("app_notification_reads")
        .upsert(readsToInsert, {
            onConflict: 'notification_id,user_id'
        });

    if (error) throw error;

    revalidatePath("/notifications");
    return { success: true };
}
