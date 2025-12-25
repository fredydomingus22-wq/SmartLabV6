import { getObjectives, getObjectiveKpis } from "@/lib/queries/objectives";
import { getUsers } from "@/lib/queries/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, AlertTriangle, CheckCircle, XCircle, Calendar, User } from "lucide-react";
import { CreateObjectiveDialog } from "./_components/create-objective-dialog";
import { UpdateProgressDialog } from "./_components/update-progress-dialog";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function ObjectivesPage() {
    const kpis = await getObjectiveKpis();
    const { data: objectives } = await getObjectives();
    const { data: users } = await getUsers();

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Target className="h-8 w-8 text-emerald-400" />
                        Objetivos da Qualidade (Clause 6.2)
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Defina, monitorize e acompanhe os objetivos estratégicos de qualidade da organização.
                    </p>
                </div>
                <CreateObjectiveDialog users={users} />
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-5">
                <KpiCard label="Total" value={kpis.total} icon={<Target className="h-4 w-4" />} />
                <KpiCard label="Em Progresso" value={kpis.onTrack} icon={<TrendingUp className="h-4 w-4 text-emerald-400" />} color="emerald" />
                <KpiCard label="Em Risco" value={kpis.atRisk} icon={<AlertTriangle className="h-4 w-4 text-amber-400" />} color="amber" />
                <KpiCard label="Atingidos" value={kpis.achieved} icon={<CheckCircle className="h-4 w-4 text-emerald-400" />} color="emerald" />
                <KpiCard label="Não Atingidos" value={kpis.missed} icon={<XCircle className="h-4 w-4 text-rose-400" />} color="rose" />
            </div>

            {/* Objectives List */}
            <Card className="glass border-slate-800/50">
                <CardHeader>
                    <CardTitle>Painel de Objetivos</CardTitle>
                    <CardDescription>
                        Acompanhamento do progresso em tempo real.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {objectives.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            Nenhum objetivo definido. Crie o primeiro objetivo para começar.
                        </div>
                    ) : (
                        objectives.map((obj: any) => (
                            <ObjectiveCard key={obj.id} objective={obj} />
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function KpiCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color?: string }) {
    const colorClass = color === 'emerald' ? 'text-emerald-400' : color === 'amber' ? 'text-amber-400' : color === 'rose' ? 'text-rose-400' : 'text-slate-400';
    return (
        <Card className="glass border-slate-800/50">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
                    <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/50">{icon}</div>
            </CardContent>
        </Card>
    );
}

function ObjectiveCard({ objective }: { objective: any }) {
    const progress = objective.target_value > 0
        ? Math.min(100, Math.round((objective.current_value / objective.target_value) * 100))
        : 0;

    return (
        <div className="p-5 rounded-xl glass border border-slate-800/50 hover:border-emerald-500/20 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(objective.status)}>
                            {getStatusLabel(objective.status)}
                        </Badge>
                        <Badge variant="outline" className="border-slate-700 text-slate-400">
                            {getCategoryLabel(objective.category)}
                        </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100">{objective.title}</h3>
                    {objective.description && (
                        <p className="text-sm text-slate-500 line-clamp-2">{objective.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                        {objective.target_date && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(objective.target_date), "dd MMM yyyy", { locale: pt })}
                            </span>
                        )}
                        {objective.owner && (
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {objective.owner.full_name}
                            </span>
                        )}
                    </div>
                </div>

                <div className="w-full md:w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Progresso</span>
                        <span className="font-mono text-slate-200">{objective.current_value} / {objective.target_value} {objective.unit}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">{progress}% concluído</span>
                        <UpdateProgressDialog objectiveId={objective.id} currentValue={objective.current_value} currentStatus={objective.status} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'on_track': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'at_risk': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'achieved': return 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30';
        case 'missed': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        default: return 'bg-slate-500/10 text-slate-400';
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'on_track': return 'Em Progresso';
        case 'at_risk': return 'Em Risco';
        case 'achieved': return 'Atingido';
        case 'missed': return 'Não Atingido';
        default: return status;
    }
}

function getCategoryLabel(category: string) {
    switch (category) {
        case 'process': return 'Processo';
        case 'customer': return 'Cliente';
        case 'product': return 'Produto';
        case 'compliance': return 'Conformidade';
        case 'financial': return 'Financeiro';
        case 'people': return 'Pessoas';
        default: return category;
    }
}
