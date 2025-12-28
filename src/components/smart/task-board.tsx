"use client";

import React, { useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Circle,
    Clock,
    AlertTriangle,
    MoreVertical,
    User,
    Calendar,
    Plus,
    Tag,
    ChevronRight,
    Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskStatus, TaskPriority, updateTaskStatusAction } from "@/app/actions/tasks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string;
    module_context: string;
    entity_reference?: string;
    assignee?: {
        full_name: string;
        id: string;
    };
}

interface TaskBoardProps {
    initialTasks: Task[];
}

const COLUMN_CONFIG = [
    { id: 'todo', label: 'A Fazer', icon: Circle, color: 'text-slate-400', bg: 'bg-slate-400/10' },
    { id: 'in_progress', label: 'Em Curso', icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { id: 'done', label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
];

const PRIORITY_CONFIG = {
    low: { label: 'Baixa', color: 'bg-blue-500/10 text-blue-400' },
    medium: { label: 'Média', color: 'bg-amber-500/10 text-amber-400' },
    high: { label: 'Alta', color: 'bg-orange-500/10 text-orange-400' },
    critical: { label: 'Crítica', color: 'bg-rose-500/10 text-rose-400' },
};

const CONTEXT_LABELS: Record<string, string> = {
    qms_nc: 'Não Conformidade',
    qms_8d: 'Relatório 8D',
    lab_sample: 'Amostra Fís-Qui',
    micro_sample: 'Amostra Micro',
    maintenance: 'Manutenção',
    other: 'Outro'
};

export function TaskBoard({ initialTasks }: TaskBoardProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.entity_reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
        try {
            // Optimistic update
            const oldTasks = [...tasks];
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

            await updateTaskStatusAction(taskId, newStatus);
        } catch (error) {
            setTasks(tasks); // Rollback
            console.error("Failed to update task", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        placeholder="Pesquisar tarefas ou referências..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button className="glass-primary rounded-xl h-10 px-6">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Tarefa
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4">
                {COLUMN_CONFIG.map(column => {
                    const columnTasks = filteredTasks.filter(t => t.status === column.id);

                    return (
                        <div key={column.id} className="min-w-[320px] flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <column.icon className={cn("h-4 w-4", column.color)} />
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">
                                        {column.label}
                                    </h3>
                                    <Badge variant="outline" className="text-[10px] bg-white/5 border-none">
                                        {columnTasks.length}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 min-h-[500px] rounded-2xl bg-slate-900/40 p-3 border border-slate-800/50">
                                <AnimatePresence mode="popLayout">
                                    {columnTasks.map(task => (
                                        <motion.div
                                            key={task.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="glass p-4 rounded-xl border-slate-800/50 hover:border-slate-700/50 transition-all group cursor-grab active:cursor-grabbing"
                                        >
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <Badge className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border-none", PRIORITY_CONFIG[task.priority].color)}>
                                                        {PRIORITY_CONFIG[task.priority].label}
                                                    </Badge>
                                                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <Tag className="h-3 w-3" />
                                                        <span className="text-[10px] uppercase font-bold tracking-tight">
                                                            {task.entity_reference || 'Geral'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-bold text-white leading-snug group-hover:text-purple-400 transition-colors">
                                                        {task.title}
                                                    </h4>
                                                    {task.description && (
                                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                                            <User className="h-3 w-3 text-purple-400" />
                                                        </div>
                                                        <span className="text-[10px] font-medium text-slate-300">
                                                            {task.assignee?.full_name?.split(' ')[0] || 'Sem Atribuição'}
                                                        </span>
                                                    </div>

                                                    {task.due_date && (
                                                        <div className="flex items-center gap-1.5 text-slate-500">
                                                            <Calendar className="h-3 w-3" />
                                                            <span className="text-[10px] font-bold">
                                                                {format(new Date(task.due_date), "dd MMM", { locale: ptBR })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1 mt-1">
                                                    {column.id !== 'todo' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 text-[9px] px-2 hover:bg-slate-800"
                                                            onClick={() => handleStatusUpdate(task.id, 'todo')}
                                                        >
                                                            Recuar
                                                        </Button>
                                                    )}
                                                    {column.id !== 'done' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 text-[9px] px-2 text-indigo-400 hover:bg-indigo-500/10"
                                                            onClick={() => handleStatusUpdate(task.id, column.id === 'todo' ? 'in_progress' : 'done')}
                                                        >
                                                            {column.id === 'todo' ? 'Iniciar' : 'Concluir'}
                                                            <ChevronRight className="h-3 w-3 ml-1" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {columnTasks.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 opacity-20 select-none">
                                        <column.icon className="h-10 w-10 mb-2" />
                                        <p className="text-xs font-bold uppercase tracking-widest italic">Vazio</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
