import { Suspense } from "react";
import { getCultureKPIs, getCultureSurveys } from "@/lib/queries/compliance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Heart,
    Users,
    MessageSquare,
    Goal,
    TrendingUp,
    Plus,
    ClipboardList,
    CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const metadata = {
    title: "Cultura de Segurança Alimentar | SmartLab",
    description: "Indicadores de cultura, compromisso da gestão e engajamento dos colaboradores.",
};

export default async function FoodSafetyCulturePage() {
    const kpis = await getCultureKPIs();
    const surveys = await getCultureSurveys();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 uppercase italic">
                        Cultura de <span className="text-rose-600 font-black">Segurança</span>
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                        Medindo o compromisso e o engajamento humano na garantia da inocuidade.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Registro de Cultura
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-rose-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5">
                        <Users className="h-24 w-24 text-rose-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Engajamento</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">84%</div>
                        <p className="text-xs text-muted-foreground">+2.1% desde o último trimestre</p>
                    </CardContent>
                </Card>
                <Card className="border-rose-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5">
                        <MessageSquare className="h-24 w-24 text-rose-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Comunicação</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4.2/5</div>
                        <p className="text-xs text-muted-foreground">Média das pesquisas de satisfação</p>
                    </CardContent>
                </Card>
                <Card className="border-rose-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5">
                        <TrendingUp className="h-24 w-24 text-rose-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Treinamento</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">96%</div>
                        <p className="text-xs text-muted-foreground">Taxa de conclusão de programas</p>
                    </CardContent>
                </Card>
                <Card className="border-rose-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5">
                        <Goal className="h-24 w-24 text-rose-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Objetivos Batidos</CardTitle>
                        <Goal className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12/15</div>
                        <p className="text-xs text-muted-foreground">KPIs de segurança alimentar no alvo</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-lg">
                    <CardHeader className="bg-slate-50/50">
                        <div className="flex justify-between items-center text-slate-800">
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-rose-600" />
                                Pesquisas de Opinião Recentes
                            </CardTitle>
                            <Button variant="outline" size="sm">Ver Todas</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {surveys.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground italic">Nenhuma pesquisa realizada recentemente.</div>
                            ) : (
                                surveys.map((survey) => (
                                    <div key={survey.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-slate-700 group-hover:text-rose-600">{survey.title}</h4>
                                                <p className="text-xs text-muted-foreground mb-2">{survey.description}</p>
                                                <Badge variant="outline" className="text-[10px] uppercase">{survey.status}</Badge>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-rose-600">{survey.responses?.[0]?.count || 0}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase">Respostas</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader className="bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2 text-slate-800">
                            <TrendingUp className="h-5 w-5 text-rose-600" />
                            Meta-Indicadores FSSC v6
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            {kpis.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic text-center py-10">
                                    Nenhum KPI de cultura configurado.<br />
                                    Defina metas para feedback, envolvimento de liderança e eficácia de comunicação.
                                </p>
                            ) : (
                                kpis.map((kpi) => (
                                    <div key={kpi.id} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-medium">{kpi.kpi_name}</span>
                                            <span className="text-xs font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded">{kpi.actual_value}% / meta {kpi.target_value}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div
                                                className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${(Number(kpi.actual_value) / Number(kpi.target_value)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            )}

                            <div className="pt-4 border-t space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compromisso da Gestão</h4>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span className="text-sm">Revisão de gestão Q4 assinada e comunicada aos sites.</span>
                                </div>
                                <div className="flex items-center gap-3 opacity-60">
                                    <CheckCircle2 className="h-4 w-4 text-slate-300" />
                                    <span className="text-sm italic text-muted-foreground">Próximo townhall agendado para Janeiro.</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
