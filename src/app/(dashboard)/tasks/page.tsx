import { getPlantTasksAction } from "@/app/actions/tasks";
import { TaskBoard } from "@/components/smart/task-board";
import {
    LayoutDashboard,
    ListTodo,
    CheckCircle2,
    Clock,
    AlertCircle,
    Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
    const tasks = await getPlantTasksAction();
    const supabase = await createClient();

    // Get stats
    const todoCount = tasks.filter(t => t.status === 'todo').length;
    const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
    const doneCount = tasks.filter(t => t.status === 'done').length;
    const criticalCount = tasks.filter(t => t.priority === 'critical').length;

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="glass p-8 rounded-3xl border-none shadow-xl bg-gradient-to-br from-indigo-500/5 to-transparent">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 italic">
                            <ListTodo className="h-10 w-10 text-indigo-400" />
                            GESTÃO DE TAREFAS
                        </h1>
                        <p className="text-slate-400 mt-2 font-medium">
                            Controlo centralizado de atividades, atribuições e progresso.
                        </p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <StatCard
                        label="A Fazer"
                        value={todoCount}
                        icon={ListTodo}
                        color="text-slate-400"
                    />
                    <StatCard
                        label="Em Curso"
                        value={inProgressCount}
                        icon={Clock}
                        color="text-indigo-400"
                    />
                    <StatCard
                        label="Concluídas"
                        value={doneCount}
                        icon={CheckCircle2}
                        color="text-emerald-400"
                    />
                    <StatCard
                        label="Críticas"
                        value={criticalCount}
                        icon={AlertCircle}
                        color="text-rose-400"
                    />
                </div>
            </div>

            {/* Main Kanban Board */}
            <TaskBoard initialTasks={tasks} />
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) {
    return (
        <div className="glass p-4 rounded-2xl border-white/5 bg-white/5">
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl bg-white/5", color)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
                    <p className="text-xl font-black">{value}</p>
                </div>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
