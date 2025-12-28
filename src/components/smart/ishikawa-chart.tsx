"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, Edit2, MessageSquare, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Cause {
    id: string;
    text: string;
}

interface Category {
    id: string;
    name: string;
    causes: Cause[];
}

interface IshikawaChartProps {
    effect: string;
    initialCategories?: Category[];
    onUpdate?: (categories: Category[]) => void;
    onSave?: (categories: Category[]) => void;
    isSaving?: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
    { id: 'm1', name: 'Máquina', causes: [] },
    { id: 'm2', name: 'Mão de Obra', causes: [] },
    { id: 'm3', name: 'Material', causes: [] },
    { id: 'm4', name: 'Método', causes: [] },
    { id: 'm5', name: 'Medição', causes: [] },
    { id: 'm6', name: 'Meio Ambiente', causes: [] },
];

export function IshikawaChart({ effect, initialCategories, onUpdate, onSave, isSaving }: IshikawaChartProps) {
    const [categories, setCategories] = useState<Category[]>(initialCategories || DEFAULT_CATEGORIES);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [newCause, setNewCause] = useState("");

    const addCause = (categoryId: string) => {
        if (!newCause.trim()) return;
        const updated = categories.map(cat => {
            if (cat.id === categoryId) {
                return {
                    ...cat,
                    causes: [...cat.causes, { id: Math.random().toString(36).substr(2, 9), text: newCause }]
                };
            }
            return cat;
        });
        setCategories(updated);
        setNewCause("");
        setActiveCategory(null);
        onUpdate?.(updated);
    };

    const removeCause = (categoryId: string, causeId: string) => {
        const updated = categories.map(cat => {
            if (cat.id === categoryId) {
                return {
                    ...cat,
                    causes: cat.causes.filter(c => c.id !== causeId)
                };
            }
            return cat;
        });
        setCategories(updated);
        onUpdate?.(updated);
    };

    return (
        <Card className="glass border-slate-800/50 overflow-hidden">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                            Diagrama de Ishikawa
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-400">Análise de Causa Raiz (6M)</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSave?.(categories)}
                            disabled={isSaving}
                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 h-8"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? "A guardar..." : "Guardar Análise"}
                        </Button>
                        <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">Efeito/Problema</span>
                            <span className="text-sm font-bold text-white">{effect}</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative w-full aspect-[21/9] bg-slate-950/50 min-h-[400px]">
                    <svg viewBox="0 0 1000 400" className="w-full h-full">
                        {/* Main Backbone */}
                        <line x1="50" y1="200" x2="850" y2="200" stroke="#475569" strokeWidth="4" />
                        <polygon points="850,200 830,185 830,215" fill="#475569" />

                        {/* Head */}
                        <rect x="850" y="160" width="130" height="80" rx="4" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
                        <foreignObject x="855" y="165" width="120" height="70">
                            <div className="h-full flex items-center justify-center text-center p-1">
                                <span className="text-[11px] font-bold text-white leading-tight uppercase">{effect}</span>
                            </div>
                        </foreignObject>

                        {/* Top Bones */}
                        {categories.slice(0, 3).map((cat, i) => {
                            const x = 150 + i * 250;
                            return (
                                <g key={cat.id}>
                                    <line x1={x} y1="200" x2={x + 100} y2="50" stroke="#334155" strokeWidth="2" />
                                    <rect x={x + 30} y="15" width="120" height="30" rx="4" fill="#1e293b"
                                        className="cursor-pointer hover:fill-slate-800 transition-colors"
                                        onClick={() => setActiveCategory(cat.id)} />
                                    <text x={x + 90} y="35" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold" className="pointer-events-none uppercase tracking-tighter">
                                        {cat.name}
                                    </text>

                                    {/* Causes list */}
                                    {cat.causes.map((cause, ci) => (
                                        <g key={cause.id} transform={`translate(${x + 40 + ci * 10}, ${70 + ci * 25})`}>
                                            <line x1="0" y1="0" x2="60" y2="0" stroke="#1e293b" strokeWidth="1" />
                                            <text x="5" y="-5" fill="#cbd5e1" fontSize="10">{cause.text}</text>
                                            <circle cx="0" cy="0" r="2" fill="#3b82f6" />
                                        </g>
                                    ))}
                                </g>
                            );
                        })}

                        {/* Bottom Bones */}
                        {categories.slice(3, 6).map((cat, i) => {
                            const x = 150 + i * 250;
                            return (
                                <g key={cat.id}>
                                    <line x1={x} y1="200" x2={x + 100} y2="350" stroke="#334155" strokeWidth="2" />
                                    <rect x={x + 30} y="355" width="120" height="30" rx="4" fill="#1e293b"
                                        className="cursor-pointer hover:fill-slate-800 transition-colors"
                                        onClick={() => setActiveCategory(cat.id)} />
                                    <text x={x + 90} y="375" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold" className="pointer-events-none uppercase tracking-tighter">
                                        {cat.name}
                                    </text>

                                    {/* Causes list */}
                                    {cat.causes.map((cause, ci) => (
                                        <g key={cause.id} transform={`translate(${x + 40 + ci * 10}, ${320 - ci * 25})`}>
                                            <line x1="0" y1="0" x2="60" y2="0" stroke="#1e293b" strokeWidth="1" />
                                            <text x="5" y="-5" fill="#cbd5e1" fontSize="10">{cause.text}</text>
                                            <circle cx="0" cy="0" r="2" fill="#3b82f6" />
                                        </g>
                                    ))}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Interaction Overlay */}
                    <AnimatePresence>
                        {activeCategory && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50 p-4"
                            >
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                                            Adicionar Causa: {categories.find(c => c.id === activeCategory)?.name}
                                        </h3>
                                        <Button variant="ghost" size="icon" onClick={() => setActiveCategory(null)} className="h-8 w-8 text-slate-500 hover:text-white">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <input
                                                autoFocus
                                                value={newCause}
                                                onChange={(e) => setNewCause(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addCause(activeCategory)}
                                                placeholder="Descreva a causa encontrada..."
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() => addCause(activeCategory)}
                                                className="absolute right-2 top-2 h-8 bg-blue-600 hover:bg-blue-700"
                                            >
                                                Adicionar
                                            </Button>
                                        </div>

                                        <div className="space-y-2 mt-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                            {categories.find(c => c.id === activeCategory)?.causes.map(cause => (
                                                <div key={cause.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg border border-slate-700/50 group">
                                                    <span className="text-xs text-slate-200">{cause.text}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeCause(activeCategory, cause.id)}
                                                        className="h-6 w-6 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="grid grid-cols-6 gap-0 border-t border-slate-800 bg-slate-900/30">
                    {categories.map(cat => (
                        <div
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-slate-800/50 transition-all border-r border-slate-800 last:border-0",
                                activeCategory === cat.id && "bg-blue-600/10 border-b-2 border-b-blue-600"
                            )}
                        >
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mb-1">{cat.name}</span>
                            <span className="text-sm font-bold text-white">{cat.causes.length}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
