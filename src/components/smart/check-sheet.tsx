"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Save, RotateCcw, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

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
        if (confirm("Deseja zerar todas as contagens?")) {
            setItems(prev => prev.map(item => ({ ...item, count: 0 })));
        }
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

    return (
        <Card className="glass border-slate-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-emerald-400" />
                        {title}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={handleReset} title="Reiniciar">
                        <RotateCcw className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 h-8">
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "A guardar..." : "Guardar"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 mt-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-xl group transition-all hover:border-slate-700">
                            <span className="text-sm font-medium text-slate-200">{item.label}</span>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => updateCount(item.id, -1)}
                                        className="h-7 w-7 text-slate-500 hover:text-red-400"
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <div className="w-10 text-center font-mono font-bold text-white text-sm">
                                        {item.count}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => updateCount(item.id, 1)}
                                        className="h-7 w-7 text-slate-500 hover:text-emerald-400"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-500">
                    <span>Total de Ocorrências</span>
                    <span className="text-lg text-white font-black">{total}</span>
                </div>
            </CardContent>
        </Card>
    );
}
