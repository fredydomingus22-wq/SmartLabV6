import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    User,
    ShieldCheck,
    History,
    Calendar,
    Award,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Plus,
    ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { getEmployeeById, getQAParameters } from "@/lib/queries/training";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddQualificationDialog } from "../_components/add-qualification-dialog";
import { AddTrainingRecordDialog } from "../_components/add-training-record-dialog";
import { EvaluateTrainingDialog } from "../_components/evaluate-training-dialog";


export default async function EmployeeDetailsPage({ params }: { params: { id: string } }) {
    const { employee, error } = await getEmployeeById(params.id);
    const { data: parameters } = await getQAParameters();

    if (!employee) return <div className="p-10">Funcionário não encontrado.</div>;

    return (
        <div className="p-6 space-y-6">
            <Link href="/quality/training" className="flex items-center gap-2 text-slate-500 hover:text-slate-200 transition-colors w-fit group mb-4">
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Voltar para o Painel de Formação
            </Link>
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex gap-4 items-start">
                    <div className="p-4 rounded-2xl bg-slate-800 text-emerald-400">
                        <User className="h-8 w-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold text-slate-100">{employee.full_name}</h1>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-none uppercase text-[10px] tracking-widest">
                                {employee.status}
                            </Badge>
                        </div>
                        <p className="text-slate-500 flex items-center gap-2 mt-1">
                            {employee.employee_id} • {employee.position} • {employee.department}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="border-slate-800">
                        Editar Perfil
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="qualifications" className="w-full">
                        <TabsList className="bg-slate-900/50 border-slate-800">
                            <TabsTrigger value="qualifications">Matriz de Competências</TabsTrigger>
                            <TabsTrigger value="training">Historico de Formação</TabsTrigger>
                            <TabsTrigger value="attendance">Assiduidade</TabsTrigger>
                        </TabsList>

                        <TabsContent value="qualifications" className="mt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-slate-200">Qualificações Analíticas</h3>
                                <AddQualificationDialog employeeId={employee.id} parameters={parameters} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {employee.qualifications?.map((q: any) => (
                                    <Card key={q.id} className="glass border-slate-800">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-xs text-slate-500 font-mono">{q.parameter?.code}</p>
                                                    <h4 className="font-bold text-slate-100">{q.parameter?.name}</h4>
                                                </div>
                                                <Badge className={
                                                    q.status === 'expert' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                                        q.status === 'qualified' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                            "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                }>
                                                    {q.status}
                                                </Badge>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Válido até: {q.valid_until ? format(new Date(q.valid_until), "dd/MM/yyyy") : "N/D"}
                                                </span>
                                                {q.status === 'qualified' && (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {(!employee.qualifications || employee.qualifications.length === 0) && (
                                    <div className="col-span-full p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                                        Nenhuma qualificação registada para este funcionário.
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="training" className="mt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-slate-200">Histórico de Formação</h3>
                                <AddTrainingRecordDialog employeeId={employee.id} employeeName={employee.full_name} />
                            </div>
                            <Card className="glass border-slate-800">
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-800/50">
                                        {employee.training?.map((t: any) => (
                                            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                                        <Award className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-100">{t.title}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {t.category} • {format(new Date(t.completion_date), "dd MMM yyyy", { locale: ptBR })}
                                                        </p>
                                                        {t.effectiveness_result ? (
                                                            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Eficácia confirmada em {format(new Date(t.effectiveness_evaluated_at), "dd/MM/yyyy")}
                                                            </p>
                                                        ) : (
                                                            <p className="text-[10px] text-amber-400 mt-1 italic">Eficácia pendente de avaliação</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!t.effectiveness_result && (
                                                        <EvaluateTrainingDialog recordId={t.id} trainingTitle={t.title} />
                                                    )}
                                                    {t.certificate_url && (
                                                        <Badge variant="outline" className="border-slate-800 text-slate-400">
                                                            Certificado
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                        ))}
                                        {(!employee.training || employee.training.length === 0) && (
                                            <div className="p-12 text-center text-slate-500">Sem registos de formação.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="attendance" className="mt-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="glass border-slate-800">
                                        <CardContent className="p-4 flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Presenças (Este Mês)</p>
                                                <p className="text-xl font-bold text-slate-100">18 dias</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="glass border-slate-800">
                                        <CardContent className="p-4 flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                                                <Clock className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Atrasos</p>
                                                <p className="text-xl font-bold text-slate-100">2</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card className="glass border-slate-800">
                                    <CardHeader>
                                        <CardTitle className="text-sm">Logs de Assiduidade</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-slate-800/50">
                                            {employee.attendance?.map((log: any) => (
                                                <div key={log.id} className="p-3 flex justify-between items-center text-sm">
                                                    <span className="text-slate-300 font-medium">
                                                        {format(new Date(log.check_in), "dd/MM/yyyy")}
                                                    </span>
                                                    <div className="flex gap-4 items-center">
                                                        <span className="text-slate-500">In: {format(new Date(log.check_in), "HH:mm")}</span>
                                                        <span className="text-slate-500">Out: {log.check_out ? format(new Date(log.check_out), "HH:mm") : "--:--"}</span>
                                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-none h-5">{log.status}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-6">
                    <Card className="glass border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                Status de Competência
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                <div>
                                    <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Resultado LIMS</p>
                                    <p className="text-sm text-slate-200 mt-1">Autorizado a assinar resultados analíticos.</p>
                                </div>
                                <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                            </div>

                            <div className="p-4 space-y-3">
                                <h4 className="text-xs font-medium text-slate-500 uppercase">Resumo da Equipa</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Equipa:</span>
                                        <span className="text-slate-200">{employee.team?.name || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Supervisor:</span>
                                        <span className="text-slate-200">{employee.team?.supervisor?.full_name || "N/A"}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                                Alertas de Formação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-slate-500">Nenhum alerta crítico para este funcionário.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
