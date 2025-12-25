import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Users,
    UserPlus,
    GraduationCap,
    Calendar,
    ShieldCheck,
    Clock,
    Search,
    Filter,
    ArrowUpRight,
    UserCheck,
    AlertCircle
} from "lucide-react";
import { getEmployees, getTeams, getShifts, getCompetencyMatrix, getQAParameters, getExpiringQualifications } from "@/lib/queries/training";
import { getApprovers, getPlants } from "@/lib/queries/dms";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { CreateEmployeeDialog } from "./_components/create-employee-dialog";
import { CreateTeamDialog } from "./_components/create-team-dialog";
import { CreateShiftDialog } from "./_components/create-shift-dialog";
import { SkillMatrix } from "./_components/skill-matrix";
import { Plus } from "lucide-react";

export default async function TrainingDashboardPage() {
    const { data: employees } = await getEmployees();
    const { data: teams } = await getTeams();
    const { data: shifts } = await getShifts();
    const { data: matrix } = await getCompetencyMatrix();
    const { data: users } = await getApprovers();
    const { data: plants } = await getPlants();
    const { data: parameters } = await getQAParameters();
    const { data: alerts } = await getExpiringQualifications();

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                        <GraduationCap className="h-8 w-8 text-emerald-400" />
                        Centro de Formação e Competências
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Gestão de pessoal, qualificações analíticas e controlo de assiduidade.
                    </p>
                </div>
                <div className="flex gap-2">
                    <CreateEmployeeDialog teams={teams} users={users} plants={plants} />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                    label="Total Funcionários"
                    value={employees.length.toString()}
                    icon={<Users className="h-4 w-4" />}
                />
                <KPICard
                    label="Analistas Qualificados"
                    value={Array.from(new Set(matrix.filter(m => m.status === 'qualified' || m.status === 'expert').map(m => m.employee_id))).length.toString()}
                    icon={<UserCheck className="h-4 w-4 text-emerald-400" />}
                />
                <KPICard
                    label="Turnos Activos"
                    value={shifts.length.toString()}
                    icon={<Clock className="h-4 w-4 text-amber-400" />}
                />
                <KPICard
                    label="Qualificações a Expirar"
                    value={alerts.length.toString()}
                    icon={<AlertCircle className="h-4 w-4 text-rose-400" />}
                    urgent={alerts.length > 0}
                />
            </div>

            {alerts.length > 0 && (
                <Card className="border-rose-500/20 bg-rose-500/5 glass animate-pulse-subtle">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-rose-500/20 text-rose-400">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-100">Atenção: Qualificações a Expirar</h4>
                                <p className="text-xs text-slate-400">
                                    {alerts.length} analista(s) têm qualificações que expiram nos próximos 30 dias.
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                            Ver Detalhes
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="employees" className="w-full">
                <TabsList className="bg-slate-900/50 border-slate-800">
                    <TabsTrigger value="employees" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Funcionários
                    </TabsTrigger>
                    <TabsTrigger value="matrix" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Matriz de Competências
                    </TabsTrigger>
                    <TabsTrigger value="structure" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Estrutura & Turnos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="employees" className="mt-6 space-y-4">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input placeholder="Pesquisar funcionário..." className="pl-10 glass border-slate-800" />
                        </div>
                        <Button variant="outline" className="border-slate-800">
                            <Filter className="h-4 w-4 mr-2" />
                            Filtros
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {employees.map((emp) => (
                            <Link key={emp.id} href={`/quality/training/${emp.id}`}>
                                <Card className="glass border-slate-800/50 hover:border-emerald-500/30 transition-all cursor-pointer group h-full">
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="p-3 rounded-2xl bg-slate-800 text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                                                <Users className="h-6 w-6" />
                                            </div>
                                            <Badge className={emp.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-none" : "bg-slate-500/10 text-slate-400"}>
                                                {emp.status}
                                            </Badge>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">{emp.full_name}</h3>
                                            <p className="text-xs text-slate-500">{emp.employee_id} • {emp.position}</p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center text-xs text-slate-400">
                                            <span>{emp.department} • {emp.team?.name || "Sem Equipa"}</span>
                                            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="matrix" className="mt-6">
                    <SkillMatrix employees={employees} parameters={parameters} qualifications={matrix} />
                </TabsContent>

                <TabsContent value="structure" className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="glass border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-emerald-400" />
                                Equipas Operacionais
                            </CardTitle>
                            <CreateTeamDialog users={users} plants={plants} />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {teams.map(team => (
                                <div key={team.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-slate-100">{team.name}</p>
                                        <p className="text-xs text-slate-500">Supervisor: {team.supervisor?.full_name || "N/A"}</p>
                                    </div>
                                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/20">
                                        {team.employee_count?.[0]?.count || 0} Membros
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="glass border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-amber-400" />
                                Gestão de Turnos
                            </CardTitle>
                            <CreateShiftDialog plants={plants} />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {shifts.map(shift => (
                                <div key={shift.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex justify-between items-center">
                                    <div className="flex gap-4">
                                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-100">{shift.name}</p>
                                            <p className="text-xs text-slate-500">{shift.start_time} - {shift.end_time}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                        Editar
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function KPICard({ label, value, icon, urgent }: { label: string, value: string, icon: any, urgent?: boolean }) {
    return (
        <Card className={`glass border-slate-800/50 ${urgent ? 'border-rose-500/20 bg-rose-500/5' : ''}`}>
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className={`text-2xl font-bold ${urgent ? 'text-rose-400' : 'text-slate-100'}`}>{value}</p>
                </div>
                <div className={`p-2 rounded-xl ${urgent ? 'bg-rose-500/10' : 'bg-slate-800/50'}`}>
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}


