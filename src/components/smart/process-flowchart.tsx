"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GitGraph, ArrowRight, Settings2 } from "lucide-react";

interface Step {
    id: string;
    label: string;
    type: 'process' | 'decision' | 'start' | 'end';
}

interface ProcessFlowchartProps {
    steps?: Step[];
    title?: string;
    description?: string;
}

const DEFAULT_STEPS: Step[] = [
    { id: '1', label: 'Início', type: 'start' },
    { id: '2', label: 'Coleta de Amostra', type: 'process' },
    { id: '3', label: 'Análise Lab', type: 'process' },
    { id: '4', label: 'Conforme?', type: 'decision' },
    { id: '5', label: 'Aprovação', type: 'process' },
    { id: '6', label: 'Fim', type: 'end' },
];

export function ProcessFlowchart({
    steps = DEFAULT_STEPS,
    title = "Fluxograma de Processo",
    description = "Sequência lógica das etapas de produção e controlo."
}: ProcessFlowchartProps) {
    return (
        <Card className="glass border-slate-800/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <GitGraph className="h-5 w-5 text-blue-400" />
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center justify-center gap-4 py-8">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="relative group">
                                <div className={`
                                    flex items-center justify-center px-4 py-3 min-w-[120px] text-xs font-bold uppercase tracking-wider transition-all
                                    ${step.type === 'start' || step.type === 'end' ? 'rounded-full bg-slate-900 border-2 border-slate-700 text-slate-400' : ''}
                                    ${step.type === 'process' ? 'rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : ''}
                                    ${step.type === 'decision' ? 'bg-amber-600/10 border border-amber-500/30 text-amber-400 rotate-0 skew-x-[-15deg] px-6' : ''}
                                `}>
                                    <span className={step.type === 'decision' ? 'skew-x-[15deg]' : ''}>
                                        {step.label}
                                    </span>
                                </div>

                                {/* Micro-animations or status indicators could go here */}
                                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {index < steps.length - 1 && (
                                <ArrowRight className="h-4 w-4 text-slate-700" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
