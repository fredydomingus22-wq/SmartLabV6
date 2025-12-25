"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, Pause, AlertCircle } from "lucide-react";
import { updateAuditStatusAction } from "@/app/actions/audits";
import { toast } from "sonner";
import { useTransition } from "react";

interface AuditStatusToggleProps {
    auditId: string;
    currentStatus: string;
    isLarge?: boolean;
}

export function AuditStatusToggle({ auditId, currentStatus, isLarge }: AuditStatusToggleProps) {
    const [isPending, startTransition] = useTransition();

    const handleUpdate = (newStatus: string) => {
        startTransition(async () => {
            const result = await updateAuditStatusAction(auditId, newStatus);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        });
    };

    if (currentStatus === 'planned') {
        return (
            <Button
                onClick={() => handleUpdate('in_progress')}
                disabled={isPending}
                className={isLarge ? "h-12 px-8 glass-primary text-lg" : "glass-primary"}
            >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Auditoria
            </Button>
        );
    }

    if (currentStatus === 'in_progress') {
        return (
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={() => handleUpdate('reporting')}
                    disabled={isPending}
                    className="border-slate-800 text-slate-300"
                >
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar / Relatório
                </Button>
                <Button
                    onClick={() => handleUpdate('completed')}
                    disabled={isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Concluir Auditoria
                </Button>
            </div>
        );
    }

    if (currentStatus === 'completed') {
        return (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-2 px-4 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Auditoria Concluída
            </Badge>
        );
    }

    return null;
}

import { Badge } from "@/components/ui/badge";
