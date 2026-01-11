"use client";

import { useEffect, useState } from "react";
import { processSamplingHeartbeatAction } from "@/app/actions/production";
import { toast } from "sonner";
import { Beaker, Bell, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExecutionHeartbeatProps {
    batchId: string;
    intervalMinutes?: number;
}

export function ExecutionHeartbeat({ batchId, intervalMinutes = 5 }: ExecutionHeartbeatProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastCheck, setLastCheck] = useState<Date | null>(null);

    useEffect(() => {
        // Run immediately on mount
        const runHeartbeat = async () => {
            if (isProcessing) return;
            setIsProcessing(true);
            try {
                const result = await processSamplingHeartbeatAction(batchId);
                setLastCheck(new Date());

                if (result.samples_created && result.samples_created > 0) {
                    toast.info(`Controlo de Qualidade: ${result.samples_created} novas amostras geradas automaticamente.`, {
                        icon: <Beaker className="h-4 w-4 text-indigo-400" />,
                        duration: 10000,
                    });
                }
            } catch (error) {
                console.error("Heartbeat error:", error);
            } finally {
                setIsProcessing(false);
            }
        };

        runHeartbeat();

        // Setup interval
        const interval = setInterval(runHeartbeat, intervalMinutes * 60 * 1000);
        return () => clearInterval(interval);
    }, [batchId, intervalMinutes]);

    if (!lastCheck) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md shadow-2xl mr-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                    Monitorização de Execução Ativa • {lastCheck.toLocaleTimeString()}
                </p>
            </div>

            <div className="relative">
                <div className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl backdrop-blur-md">
                    {isProcessing ? (
                        <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                    ) : (
                        <Bell className="h-5 w-5 text-indigo-400" />
                    )}
                </div>
            </div>
        </div>
    );
}
