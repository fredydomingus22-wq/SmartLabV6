"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, GraduationCap, ShieldCheck } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface SkillMatrixProps {
    employees: any[];
    parameters: any[];
    qualifications: any[];
}

export function SkillMatrix({ employees, parameters, qualifications }: SkillMatrixProps) {
    // Unique list of parameters that have at least one qualification or are "critical"
    const relevantParameters = parameters.slice(0, 10); // Limit for UI readability initially

    const getQual = (empId: string, paramId: string) => {
        return qualifications.find(q => q.employee_id === empId && q.qa_parameter_id === paramId);
    };

    return (
        <Card className="glass border-slate-800 overflow-hidden">
            <CardHeader className="border-b border-slate-800 bg-slate-900/40">
                <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    Heatmap de Competências Analíticas
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900/60">
                            <th className="p-4 font-medium text-slate-400 border-b border-slate-800 sticky left-0 bg-slate-900 z-10 w-48">Funcionário</th>
                            {relevantParameters.map(param => (
                                <th key={param.id} className="p-4 font-medium text-slate-400 border-b border-slate-800 text-center min-w-32">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-mono opacity-50">{param.code}</span>
                                        <span className="truncate max-w-[120px]">{param.name}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                        {employees.map(emp => (
                            <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 font-medium text-slate-200 sticky left-0 bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.3)] z-10">
                                    <div className="flex flex-col">
                                        <span>{emp.full_name}</span>
                                        <span className="text-[10px] text-slate-500">{emp.position}</span>
                                    </div>
                                </td>
                                {relevantParameters.map(param => {
                                    const qual = getQual(emp.id, param.id);
                                    return (
                                        <td key={param.id} className="p-4 text-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <QualificationIcon status={qual?.status} validUntil={qual?.valid_until} />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="glass border-slate-800 text-xs">
                                                        {qual ? (
                                                            <div className="space-y-1">
                                                                <p className="font-bold text-emerald-400 uppercase">{qual.status}</p>
                                                                <p>Qualificado em: {qual.qualified_at || 'N/D'}</p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-slate-500">Não qualificado</p>
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
            <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex flex-wrap gap-6 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-slate-800 border border-slate-700" /> N/A
                </div>
                <div className="flex items-center gap-2 text-amber-500">
                    <GraduationCap className="h-3 w-3" /> Trainee
                </div>
                <div className="flex items-center gap-2 text-emerald-500">
                    <Check className="h-3 w-3" /> Qualified
                </div>
                <div className="flex items-center gap-2 text-purple-500">
                    <Star className="h-3 w-3 fill-purple-500/20" /> Expert
                </div>
                <div className="flex items-center gap-2 text-yellow-500">
                    <Check className="h-3 w-3 animate-pulse" /> A Expirar
                </div>
                <div className="flex items-center gap-2 text-red-500">
                    <X className="h-3 w-3" /> Expirado
                </div>
            </div>
        </Card>
    );
}

function QualificationIcon({ status, validUntil }: { status?: string; validUntil?: string }) {
    // Check if expiring within 30 days
    const isExpiringSoon = validUntil && new Date(validUntil) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const isExpired = validUntil && new Date(validUntil) < new Date();

    if (!status) return <div className="mx-auto h-4 w-4 rounded-full bg-slate-800/50 border border-slate-700/30" />;

    if (isExpired) return <X className="mx-auto h-5 w-5 text-red-400 p-0.5 bg-red-500/10 rounded-full" />;

    if (status === 'expert') return (
        <Star className={`mx-auto h-5 w-5 fill-purple-500/10 ${isExpiringSoon ? 'text-yellow-400 animate-pulse' : 'text-purple-400'}`} />
    );
    if (status === 'qualified') return (
        <Check className={`mx-auto h-5 w-5 p-0.5 rounded-full ${isExpiringSoon ? 'text-yellow-400 bg-yellow-500/10 animate-pulse' : 'text-emerald-400 bg-emerald-500/10'}`} />
    );
    if (status === 'trainee') return <GraduationCap className="mx-auto h-5 w-5 text-amber-400" />;

    return <X className="mx-auto h-4 w-4 text-slate-600" />;
}
