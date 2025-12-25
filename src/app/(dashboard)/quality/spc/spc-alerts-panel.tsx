"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell, CheckCircle2, Eye, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SPCAlert {
    id: string;
    alert_type: string;
    rule_number?: number;
    description: string;
    value_recorded?: number;
    threshold_value?: number;
    cpk_value?: number;
    status: string;
    created_at: string;
    parameter?: { name: string; code: string };
    sample?: { code: string };
    batch?: { code: string };
}

interface SPCAlertsPanelProps {
    alerts: SPCAlert[];
    onAcknowledge: (id: string) => Promise<{ success: boolean }>;
    onResolve: (id: string, notes: string) => Promise<{ success: boolean }>;
}

const alertTypeConfig: Record<string, { color: string; icon: typeof AlertTriangle; label: string }> = {
    run_rule_violation: { color: "bg-amber-500", icon: AlertTriangle, label: "Violação de Regra" },
    cpk_warning: { color: "bg-yellow-500", icon: Bell, label: "Cpk Advertência" },
    cpk_critical: { color: "bg-red-500", icon: XCircle, label: "Cpk Crítico" },
    out_of_spec: { color: "bg-red-600", icon: XCircle, label: "Fora de Especificação" },
};

export function SPCAlertsPanel({ alerts, onAcknowledge, onResolve }: SPCAlertsPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [resolveDialog, setResolveDialog] = useState<{ open: boolean; alertId: string | null }>({
        open: false,
        alertId: null,
    });
    const [resolveNotes, setResolveNotes] = useState("");

    const handleAcknowledge = (alertId: string) => {
        startTransition(async () => {
            const result = await onAcknowledge(alertId);
            if (result.success) {
                toast.success("Alerta reconhecido");
            } else {
                toast.error("Falha ao reconhecer alerta");
            }
        });
    };

    const handleResolve = () => {
        if (!resolveDialog.alertId) return;
        startTransition(async () => {
            const result = await onResolve(resolveDialog.alertId!, resolveNotes);
            if (result.success) {
                toast.success("Alerta resolvido");
                setResolveDialog({ open: false, alertId: null });
                setResolveNotes("");
            } else {
                toast.error("Falha ao resolver alerta");
            }
        });
    };

    if (alerts.length === 0) {
        return (
            <Card className="glass border-green-500/30">
                <CardContent className="pt-6 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-muted-foreground">Nenhum alerta SPC ativo</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="glass border-amber-500/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-400">
                        <AlertTriangle className="h-5 w-5" />
                        Alertas SPC Ativos
                        <Badge variant="destructive">{alerts.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                        Violações estatísticas que requerem atenção
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {alerts.map((alert) => {
                        const config = alertTypeConfig[alert.alert_type] || alertTypeConfig.run_rule_violation;
                        const Icon = config.icon;

                        return (
                            <div
                                key={alert.id}
                                className="flex items-start gap-3 p-3 rounded-lg border bg-background/50"
                            >
                                <div className={`p-2 rounded-full ${config.color}`}>
                                    <Icon className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className="text-xs">
                                            {config.label}
                                            {alert.rule_number && ` #${alert.rule_number}`}
                                        </Badge>
                                        {alert.parameter && (
                                            <Badge variant="secondary" className="text-xs">
                                                {alert.parameter.name}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm mt-1">{alert.description}</p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                        {alert.sample && <span>Amostra: {alert.sample.code}</span>}
                                        {alert.batch && <span>• Lote: {alert.batch.code}</span>}
                                        <span>• {new Date(alert.created_at).toLocaleString("pt-PT")}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {alert.status === "active" && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleAcknowledge(alert.id)}
                                            disabled={isPending}
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Reconhecer
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => setResolveDialog({ open: true, alertId: alert.id })}
                                        disabled={isPending}
                                    >
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Resolver
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            <Dialog open={resolveDialog.open} onOpenChange={(open) => setResolveDialog({ open, alertId: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resolver Alerta SPC</DialogTitle>
                        <DialogDescription>
                            Descreva a ação corretiva tomada para resolver este alerta.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="resolution-notes">Notas de Resolução</Label>
                            <Textarea
                                id="resolution-notes"
                                placeholder="Descreva a ação corretiva..."
                                value={resolveNotes}
                                onChange={(e) => setResolveNotes(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResolveDialog({ open: false, alertId: null })}>
                            Cancelar
                        </Button>
                        <Button onClick={handleResolve} disabled={isPending || !resolveNotes.trim()}>
                            {isPending ? "A resolver..." : "Confirmar Resolução"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
