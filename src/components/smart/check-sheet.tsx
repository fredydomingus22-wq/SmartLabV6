"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Minus, Save, RotateCcw, ClipboardCheck } from "lucide-react";
import { IndustrialCard } from "@/components/shared/industrial-card";
import { Box, Typography, Stack } from "@mui/material";

interface CheckItem {
    id: string;
    label: string;
    count: number;
}

interface CheckSheetProps {
    title?: string;
    description?: string;
    initialItems?: CheckItem[];
    onSave?: (items: CheckItem[]) => void;
}

const DEFAULT_ITEMS: CheckItem[] = [
    { id: '1', label: 'Defeito Superficial', count: 0 },
    { id: '2', label: 'Erro de Medida', count: 0 },
    { id: '3', label: 'Material Incorreto', count: 0 },
    { id: '4', label: 'Avaria no Transporte', count: 0 },
    { id: '5', label: 'Outros', count: 0 },
];

export function CheckSheet({
    title = "Folha de Verificação",
    description = "Coleta de dados de frequência e ocorrências.",
    initialItems,
    onSave
}: CheckSheetProps) {
    const [items, setItems] = useState<CheckItem[]>(initialItems || DEFAULT_ITEMS);
    const [saving, setSaving] = useState(false);

    const updateCount = (id: string, delta: number) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, count: Math.max(0, item.count + delta) } : item
        ));
    };

    const handleReset = () => {
        setItems(prev => prev.map(item => ({ ...item, count: 0 })));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave?.(items);
        } finally {
            setSaving(false);
        }
    };

    const total = items.reduce((acc, item) => acc + item.count, 0);

    const actions = (
        <Stack direction="row" spacing={1}>
            <Button variant="ghost" size="icon" onClick={handleReset} className="h-7 w-7 text-slate-500 hover:text-white transition-colors">
                <RotateCcw className="h-3 w-3" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 h-7 text-[10px] font-black uppercase tracking-widest border-none px-4">
                <Save className="h-3 w-3 mr-2" />
                {saving ? "A guardar..." : "Guardar"}
            </Button>
        </Stack>
    );

    return (
        <IndustrialCard
            title={title}
            subtitle={description}
            icon={ClipboardCheck}
            actions={actions}
        >
            <Box className="space-y-3 mt-4">
                {items.map((item) => (
                    <Box key={item.id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl group transition-all hover:border-blue-500/30">
                        <Typography className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{item.label}</Typography>
                        <Box className="flex items-center gap-4">
                            <Box className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => updateCount(item.id, -1)}
                                    className="h-7 w-7 text-slate-500 hover:text-red-400"
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <Typography className="w-10 text-center font-mono font-black text-white text-sm">
                                    {item.count}
                                </Typography>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => updateCount(item.id, 1)}
                                    className="h-7 w-7 text-slate-500 hover:text-emerald-400"
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </Box>
                            <Box className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                <Box
                                    className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                                    sx={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
                                />
                            </Box>
                        </Box>
                    </Box>
                ))}
            </Box>

            <Box className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                <Typography className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total de Ocorrências</Typography>
                <Typography className="text-xl font-black text-white">{total}</Typography>
            </Box>
        </IndustrialCard>
    );
}
