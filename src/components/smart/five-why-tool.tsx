"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, ArrowRight, HelpCircle, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface FiveWhyToolProps {
    problem: string;
    onComplete?: (rootCause: string) => void;
    onSave?: (whys: string[]) => void;
    isSaving?: boolean;
    initialWhys?: string[];
}

export function FiveWhyTool({ problem, onComplete, onSave, isSaving, initialWhys }: FiveWhyToolProps) {
    const [whys, setWhys] = useState<string[]>(initialWhys || [""]);

    const updateWhy = (index: number, value: string) => {
        const newWhys = [...whys];
        newWhys[index] = value;
        setWhys(newWhys);
    };

    const addWhy = () => {
        if (whys.length < 5) {
            setWhys([...whys, ""]);
        }
    };

    const removeWhy = (index: number) => {
        if (whys.length > 1) {
            setWhys(whys.filter((_, i) => i !== index));
        }
    };

    return (
        <Card className="glass border-slate-800/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                            Análise dos 5 Porquês
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-400">
                            Método iterativo para explorar a relação de causa e efeito.
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSave?.(whys)}
                        disabled={isSaving}
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 h-8"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "A guardar..." : "Guardar Análise"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">O Problema</span>
                    <p className="text-sm font-medium text-white italic">"{problem}"</p>
                </div>

                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {whys.map((why, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-start gap-4"
                            >
                                <div className="flex flex-col items-center">
                                    <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">
                                        {index + 1}º
                                    </div>
                                    {index < whys.length - 1 && (
                                        <div className="w-px h-8 bg-slate-800 mt-1" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Porquê?</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={why}
                                            onChange={(e) => updateWhy(index, e.target.value)}
                                            placeholder={`Causa ${index + 1}...`}
                                            className="glass text-white"
                                        />
                                        {index === whys.length - 1 && index < 4 && (
                                            <Button size="icon" variant="ghost" onClick={addWhy} className="h-10 w-10 shrink-0 text-blue-400 hover:bg-blue-600/10">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {index > 0 && (
                                            <Button size="icon" variant="ghost" onClick={() => removeWhy(index)} className="h-10 w-10 shrink-0 text-slate-500 hover:text-red-400">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {whys.length === 5 && whys[4].length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-emerald-600/10 border border-emerald-600/20 rounded-xl mt-6"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <HelpCircle className="h-4 w-4 text-emerald-400" />
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Causa Raiz Identificada</span>
                        </div>
                        <p className="text-sm font-bold text-white mb-4">{whys[4]}</p>
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => onComplete?.(whys[4])}
                        >
                            Confirmar Causa Raiz
                        </Button>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
