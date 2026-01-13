"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertCircle, CheckCircle2, FlaskConical, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SamplingReminder {
    id: string;
    sampling_plan_id: string;
    next_sample_due_at: string;
    status: "pending" | "completed" | "skipped";
    plan?: {
        name?: string;
        sample_type?: { name: string };
        frequency_minutes?: number;
    };
}

interface Props {
    reminders: SamplingReminder[];
    batchId: string;
    onTriggerSample?: (reminderId: string) => Promise<void>;
}

export function SamplingRemindersPanel({ reminders, batchId, onTriggerSample }: Props) {
    const [loading, setLoading] = React.useState<string | null>(null);

    const pendingReminders = reminders.filter(r => r.status === "pending");
    const overdueReminders = pendingReminders.filter(r => new Date(r.next_sample_due_at) < new Date());
    const upcomingReminders = pendingReminders.filter(r => new Date(r.next_sample_due_at) >= new Date());

    const getTimeUntil = (dateStr: string) => {
        const target = new Date(dateStr).getTime();
        const now = Date.now();
        const diff = target - now;

        if (diff < 0) {
            const minutes = Math.abs(Math.round(diff / 60000));
            if (minutes < 60) return `${minutes} min atrasado`;
            return `${Math.round(minutes / 60)}h atrasado`;
        }

        const minutes = Math.round(diff / 60000);
        if (minutes < 60) return `em ${minutes} min`;
        if (minutes < 1440) return `em ${Math.round(minutes / 60)}h`;
        return `em ${Math.round(minutes / 1440)}d`;
    };

    const handleTrigger = async (reminderId: string) => {
        if (!onTriggerSample) {
            toast.info("Trigger manual não disponível");
            return;
        }
        setLoading(reminderId);
        try {
            await onTriggerSample(reminderId);
            toast.success("Amostra criada com sucesso");
        } catch (error) {
            toast.error("Erro ao criar amostra");
        }
        setLoading(null);
    };

    if (pendingReminders.length === 0) {
        return (
            <Card className="bg-card border-slate-800 rounded-2xl">
                <CardContent className="py-8 text-center">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-3 text-emerald-500/50" />
                    <p className="text-sm text-slate-500 font-medium">
                        Nenhuma amostragem pendente
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card border-slate-800 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-indigo-400" />
                    Monitorização de Amostragem
                    {overdueReminders.length > 0 && (
                        <Badge variant="destructive" className="text-[9px] font-bold">
                            {overdueReminders.length} Atrasado(s)
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-800/50">
                    {/* Overdue first */}
                    {overdueReminders.map((reminder) => (
                        <div
                            key={reminder.id}
                            className="flex items-center justify-between p-4 bg-red-500/5 hover:bg-red-500/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">
                                        {reminder.plan?.name || reminder.plan?.sample_type?.name || "Amostra"}
                                    </p>
                                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
                                        {getTimeUntil(reminder.next_sample_due_at)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleTrigger(reminder.id)}
                                disabled={loading === reminder.id}
                                className="h-8 text-[10px] font-bold uppercase tracking-widest"
                            >
                                <Play className="h-3 w-3 mr-1" />
                                Coletar Agora
                            </Button>
                        </div>
                    ))}

                    {/* Upcoming */}
                    {upcomingReminders.map((reminder) => (
                        <div
                            key={reminder.id}
                            className="flex items-center justify-between p-4 hover:bg-slate-900/30 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">
                                        {reminder.plan?.name || reminder.plan?.sample_type?.name || "Amostra"}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        {getTimeUntil(reminder.next_sample_due_at)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTrigger(reminder.id)}
                                disabled={loading === reminder.id}
                                className="h-8 text-[10px] font-bold uppercase tracking-widest border-slate-700 hover:bg-slate-800"
                            >
                                <Play className="h-3 w-3 mr-1" />
                                Antecipar
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
