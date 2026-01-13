"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    BookOpen,
    Video,
    FileText,
    CheckCircle,
    Clock,
    AlertTriangle,
    Play,
    Award
} from "lucide-react";
import { TrainingAssignment } from "@/app/actions/quality/training";
import { startTraining } from "@/app/actions/quality/training";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";

interface MyTrainingClientProps {
    assignments: TrainingAssignment[];
}

export function MyTrainingClient({ assignments }: MyTrainingClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleStart = (assignmentId: string) => {
        startTransition(async () => {
            const result = await startTraining(assignmentId);
            if (result.error) {
                toast.error(result.error);
            } else {
                router.push(`/quality/training/my-training/${assignmentId}`);
            }
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'document': return <FileText className="w-5 h-5 text-blue-400" />;
            case 'video': return <Video className="w-5 h-5 text-purple-400" />;
            case 'quiz': return <BookOpen className="w-5 h-5 text-emerald-400" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'assigned': return <Badge variant="outline" className="border-blue-500/50 text-blue-400">Assigned</Badge>;
            case 'in_progress': return <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">In Progress</Badge>;
            case 'completed': return <Badge variant="outline" className="border-green-500/50 text-green-400">Completed</Badge>;
            case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-10">
            {/* KPI Section - Industrial Glassmorphism */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPISparkCard
                    variant="blue"
                    title="Pendentes"
                    value={assignments.filter(a => a.status === 'assigned').length.toString().padStart(2, '0')}
                    description="Módulos aguardando início"
                    icon={<BookOpen className="h-4 w-4" />}
                    data={[10, 15, 12, 18, 14, 20, 17].map(v => ({ value: v }))}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="amber"
                    title="Em Progresso"
                    value={assignments.filter(a => a.status === 'in_progress').length.toString().padStart(2, '0')}
                    description="Sessões ativas no sistema"
                    icon={<Clock className="h-4 w-4" />}
                    data={[5, 8, 12, 10, 15, 12, 14].map(v => ({ value: v }))}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="emerald"
                    title="Concluídos"
                    value={assignments.filter(a => a.status === 'completed').length.toString().padStart(2, '0')}
                    description="Certificados emitidos"
                    icon={<Award className="h-4 w-4" />}
                    data={[20, 25, 22, 28, 24, 30, 27].map(v => ({ value: v }))}
                    dataKey="value"
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                        Módulos Disponíveis
                    </h2>
                    <span className="text-[10px] font-bold text-slate-600 uppercase bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        {assignments.length} Total
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {assignments.map((assignment) => (
                        <GlassCard
                            key={assignment.id}
                            className="p-5 transition-all hover:bg-white/[0.05] group relative border border-white/5 hover:border-white/20 active:scale-[0.99] flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="flex gap-4">
                                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shadow-xl group-hover:border-blue-500/30 transition-colors">
                                        {getTypeIcon(assignment.module_type)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors leading-tight">
                                            {assignment.module_title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 mt-1.5 uppercase tracking-wider">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{assignment.duration_minutes} min</span>
                                            </div>
                                            {assignment.due_date && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                    <div className={cn(
                                                        "flex items-center gap-1",
                                                        new Date(assignment.due_date) < new Date() && assignment.status !== 'completed' ? "text-rose-400" : ""
                                                    )}>
                                                        <span>Vencimento: {new Date(assignment.due_date).toLocaleDateString()}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {getStatusBadge(assignment.status)}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex -space-x-2">
                                    {/* Placeholder for progress/difficulty indicators if needed */}
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                        Qualificação Técnica
                                    </span>
                                </div>
                                {assignment.status !== 'completed' ? (
                                    <Button
                                        onClick={() => handleStart(assignment.id)}
                                        disabled={isPending}
                                        size="sm"
                                        className="gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-widest px-4 h-9 shadow-[0_0_20px_rgba(37,99,235,0.2)] border-0"
                                    >
                                        {isPending ? (
                                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                                        ) : (
                                            <Play className="w-3 h-3 fill-current" />
                                        )}
                                        {assignment.status === 'in_progress' ? 'Retomar' : 'Iniciar'}
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Concluído</span>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    ))}

                    {assignments.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white/[0.02] rounded-2xl border-2 border-dashed border-white/5">
                            <div className="p-4 rounded-full bg-slate-500/5 w-fit mx-auto mb-4 border border-white/5">
                                <BookOpen className="w-10 h-10 text-slate-700" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-400">Nenhum treinamento pendente</h3>
                            <p className="text-sm text-slate-500">Você está em dia com todas as qualificações!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
