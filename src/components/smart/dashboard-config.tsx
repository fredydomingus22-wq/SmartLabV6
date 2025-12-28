"use client";

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings2, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface DashboardToolsConfig {
    spc: boolean;
    histogram: boolean;
    pareto: boolean;
    correlation: boolean;
    ishikawa: boolean;
    fiveWhy: boolean;
    checkSheet: boolean;
    flowchart: boolean;
}

interface DashboardConfigProps {
    config: DashboardToolsConfig;
    onChange: (config: DashboardToolsConfig) => void;
}

export function DashboardConfig({ config, onChange }: DashboardConfigProps) {
    const toggleTool = (tool: keyof DashboardToolsConfig) => {
        onChange({ ...config, [tool]: !config[tool] });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Personalizar Vista
                </Button>
            </DialogTrigger>
            <DialogContent className="glass border-slate-800 text-white max-w-sm">
                <DialogHeader>
                    <DialogTitle>Configurar Painel SPC</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Selecione quais ferramentas deseja visualizar no cockpit.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-4">
                        <ToolToggle
                            label="Cartas de Controlo (SPC)"
                            checked={config.spc}
                            onCheckedChange={() => toggleTool('spc')}
                        />
                        <ToolToggle
                            label="Análise de Distribuição"
                            checked={config.histogram}
                            onCheckedChange={() => toggleTool('histogram')}
                        />
                        <ToolToggle
                            label="Diagrama de Pareto"
                            checked={config.pareto}
                            onCheckedChange={() => toggleTool('pareto')}
                        />
                        <ToolToggle
                            label="Diagrama de Dispersão"
                            checked={config.correlation}
                            onCheckedChange={() => toggleTool('correlation')}
                        />
                        <ToolToggle
                            label="Diagrama de Ishikawa"
                            checked={config.ishikawa}
                            onCheckedChange={() => toggleTool('ishikawa')}
                        />
                        <ToolToggle
                            label="Análise 5-Porquês"
                            checked={config.fiveWhy}
                            onCheckedChange={() => toggleTool('fiveWhy')}
                        />
                        <ToolToggle
                            label="Folha de Verificação"
                            checked={config.checkSheet}
                            onCheckedChange={() => toggleTool('checkSheet')}
                        />
                        <ToolToggle
                            label="Fluxograma de Processo"
                            checked={config.flowchart}
                            onCheckedChange={() => toggleTool('flowchart')}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ToolToggle({ label, checked, onCheckedChange }: { label: string, checked: boolean, onCheckedChange: () => void }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-3">
                {checked ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-slate-600" />}
                <Label className="text-sm font-medium">{label}</Label>
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
    );
}
