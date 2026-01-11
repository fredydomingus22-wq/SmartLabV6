"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, X, HelpCircle, Save, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { IndustrialCard } from "@/components/shared/industrial-card";
import { Box, Typography, Stack } from "@mui/material";

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

    const actions = (
        <Button
            variant="outline"
            size="sm"
            onClick={() => onSave?.(whys)}
            disabled={isSaving}
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-7 text-[10px] uppercase font-black tracking-widest bg-slate-900"
        >
            <Save className="h-3 w-3 mr-2" />
            {isSaving ? "A guardar..." : "Guardar Análise"}
        </Button>
    );

    return (
        <IndustrialCard
            title="Análise dos 5 Porquês"
            subtitle="Método iterativo para explorar a relação de causa e efeito."
            icon={Target}
            actions={actions}
        >
            <Box className="space-y-6 pt-4">
                <Box className="p-4 bg-blue-600/5 rounded-xl border border-blue-500/20 backdrop-blur-md">
                    <Typography className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">O Problema (Efeito)</Typography>
                    <Typography className="text-sm font-bold text-white italic">"{problem}"</Typography>
                </Box>

                <Box className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {whys.map((why, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-start gap-4"
                            >
                                <Box className="flex flex-col items-center">
                                    <Box className="h-8 w-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black text-blue-400 shrink-0 shadow-lg">
                                        {index + 1}º
                                    </Box>
                                    {index < whys.length - 1 && (
                                        <Box className="w-px h-8 bg-gradient-to-b from-blue-500/50 to-transparent mt-1" />
                                    )}
                                </Box>
                                <Box className="flex-1 space-y-1.5">
                                    <Typography className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Porquê?</Typography>
                                    <Box className="flex gap-2">
                                        <Input
                                            value={why}
                                            onChange={(e) => updateWhy(index, e.target.value)}
                                            placeholder={`Causa ${index + 1}...`}
                                            className="h-10 glass border-white/5 bg-slate-900/50 text-white text-sm font-medium focus:ring-1 focus:ring-blue-500/50"
                                        />
                                        {index === whys.length - 1 && index < 4 && (
                                            <Button size="icon" variant="ghost" onClick={addWhy} className="h-10 w-10 shrink-0 text-blue-400 hover:bg-blue-600/10 border border-white/5 bg-slate-900/50">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {index > 0 && (
                                            <Button size="icon" variant="ghost" onClick={() => removeWhy(index)} className="h-10 w-10 shrink-0 text-slate-500 hover:text-red-400 border border-white/5 bg-slate-900/50">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </Box>

                {whys.length === 5 && whys[4].length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 rounded-2xl bg-emerald-600/10 border border-emerald-600/20 backdrop-blur-xl mt-6 text-center"
                    >
                        <Stack spacing={2} alignItems="center">
                            <Box className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <HelpCircle className="h-5 w-5 text-emerald-400" />
                            </Box>
                            <Typography className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Causa Raiz Identificada</Typography>
                            <Typography className="text-lg font-black text-white px-4">"{whys[4]}"</Typography>
                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 font-black uppercase tracking-widest text-[10px] rounded-xl mt-4"
                                onClick={() => onComplete?.(whys[4])}
                            >
                                Confirmar para CAPA
                            </Button>
                        </Stack>
                    </motion.div>
                )}
            </Box>
        </IndustrialCard>
    );
}
