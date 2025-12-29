"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Bell,
    AlertCircle,
    Clock,
    CheckCircle2,
    ChevronRight,
    Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getNotificationsAction, markAsReadAction, markAllAsReadAction } from "@/app/actions/notifications";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function NotificationsList() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await getNotificationsAction();
            setNotifications(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar notificações");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();

        const channel = supabase
            .channel('notifications_page_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'app_notifications' },
                () => fetchNotifications()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'app_notification_reads' },
                () => fetchNotifications()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchNotifications]);

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        try {
            await markAsReadAction(id);
            toast.success("Notificação lida");
        } catch (error) {
            toast.error("Erro ao marcar como lida");
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsReadAction();
            toast.success("Todas as notificações marcadas como lidas");
        } catch (error) {
            toast.error("Erro ao marcar todas como lidas");
        }
    };

    if (loading) {
        return <div className="py-20 text-center text-slate-400">Carregando notificações...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-8 rounded-2xl border-slate-800/50">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-orange-500/20">
                            <Bell className="h-6 w-6 text-orange-400" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Centro de Notificações</h1>
                    </div>
                    <p className="text-slate-400 font-medium">Alertas críticos e avisos do sistema em tempo real.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="border-slate-800 text-slate-400 hover:text-slate-100 h-11 px-6"
                        onClick={handleMarkAllAsRead}
                    >
                        Marcar todas como lidas
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="max-w-4xl mx-auto space-y-4">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 glass rounded-2xl border-slate-800/50">
                        <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-100">Tudo em conformidade</h3>
                            <p className="text-slate-400">Não existem alertas ou desvios pendentes no momento.</p>
                        </div>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <Card
                            key={n.id}
                            className={cn(
                                "glass border-slate-800/50 hover:border-slate-700 transition-all cursor-pointer group overflow-hidden",
                                !n.isRead && "border-l-4 border-l-orange-500"
                            )}
                            onClick={() => handleMarkAsRead(n.id, n.isRead)}
                        >
                            <CardContent className="p-0">
                                <div className="flex items-start gap-4 p-5">
                                    <div className={`mt-1 p-2.5 rounded-xl ${n.severity === 'high' || n.severity === 'critical' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
                                        }`}>
                                        {n.type === 'deviation' ? <AlertCircle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className={cn(
                                                "text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors uppercase tracking-tight",
                                                !n.isRead && "text-slate-50"
                                            )}>
                                                {n.title}
                                            </h3>
                                            <span className="text-[10px] font-mono text-slate-500">
                                                {new Date(n.created_at).toLocaleString('pt-PT')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                            {n.content}
                                        </p>
                                        <div className="flex items-center gap-3 pt-2">
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] font-bold uppercase border-none",
                                                (n.severity === 'high' || n.severity === 'critical') ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                                            )}>
                                                {n.severity === 'critical' ? 'Crítico' : n.severity === 'high' ? 'Grave' : 'Aviso'}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] font-bold bg-slate-900 border-slate-800 text-slate-400">
                                                {n.type.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                    {n.link && (
                                        <Link href={n.link} className="self-center ml-2">
                                            <ChevronRight className="h-5 w-5 text-slate-700 group-hover:text-slate-400 transition-all" />
                                        </Link>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

function Info({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    )
}
