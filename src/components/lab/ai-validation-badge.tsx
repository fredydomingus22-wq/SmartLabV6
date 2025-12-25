"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Bot, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIValidationBadgeProps {
    status: 'approved' | 'warning' | 'blocked' | 'pending' | null;
    message?: string;
    confidence?: number;
    isLoading?: boolean;
    onValidate?: () => void;
}

export function AIValidationBadge({
    status,
    message,
    confidence,
    isLoading,
    onValidate,
}: AIValidationBadgeProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'approved':
                return {
                    icon: CheckCircle,
                    label: 'AI Approved',
                    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    iconColor: 'text-emerald-500',
                };
            case 'warning':
                return {
                    icon: AlertTriangle,
                    label: 'AI Warning',
                    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    iconColor: 'text-amber-500',
                };
            case 'blocked':
                return {
                    icon: XCircle,
                    label: 'AI Blocked',
                    className: 'bg-red-500/10 text-red-400 border-red-500/20',
                    iconColor: 'text-red-500',
                };
            default:
                return {
                    icon: Bot,
                    label: 'Validate',
                    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    iconColor: 'text-blue-500',
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    if (isLoading) {
        return (
            <Badge variant="outline" className="bg-slate-800/50 text-slate-400 border-slate-700 gap-1.5 animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-[9px] uppercase tracking-widest font-bold">Validando...</span>
            </Badge>
        );
    }

    if (!status && onValidate) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={onValidate}
                className="h-6 px-2 text-[9px] uppercase tracking-widest font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-full"
            >
                <Bot className="h-3 w-3 mr-1" />
                Validar c/ IA
            </Button>
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Badge
                    variant="outline"
                    className={cn(
                        "cursor-pointer hover:opacity-80 transition-opacity gap-1.5",
                        config.className
                    )}
                >
                    <Icon className={cn("h-3 w-3", config.iconColor)} />
                    <span className="text-[9px] uppercase tracking-widest font-bold">{config.label}</span>
                </Badge>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-slate-950 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-blue-400" />
                        Análise de IA
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                        <Icon className={cn("h-8 w-8", config.iconColor)} />
                        <div>
                            <p className="font-bold text-sm">{config.label}</p>
                            {confidence !== undefined && (
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                    Confiança: {Math.round(confidence * 100)}%
                                </p>
                            )}
                        </div>
                    </div>

                    {message && (
                        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Justificação</p>
                            <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
                        </div>
                    )}

                    <p className="text-[9px] text-slate-600 text-center uppercase tracking-widest">
                        Powered by OpenAI GPT-4o-mini
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
