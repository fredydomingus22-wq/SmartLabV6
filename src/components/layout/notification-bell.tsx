"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getUnreadCountAction } from "@/app/actions/notifications";

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const supabase = createClient();

    const fetchUnreadCount = useCallback(async () => {
        const count = await getUnreadCountAction();
        setUnreadCount(count);
    }, []);

    useEffect(() => {
        fetchUnreadCount();

        // Subscribe to changes in notifications and reads
        const channel = supabase
            .channel('notifications_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'app_notifications' },
                () => fetchUnreadCount()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'app_notification_reads' },
                () => fetchUnreadCount()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchUnreadCount]);

    return (
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-100 hover:bg-slate-900/50" asChild>
            <Link href="/notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                )}
            </Link>
        </Button>
    );
}
