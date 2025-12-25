import { Suspense } from "react";
import { getTACCPByOrganization } from "@/lib/queries/compliance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ShieldAlert, Lock, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const metadata = {
    title: "Defesa Alimentar (TACCP) | SmartLab",
    description: "Avaliação de ameaças e plano de defesa alimentar.",
};

export default async function TACCPPage() {
    const assessments = await getTACCPByOrganization();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Defesa Alimentar (TACCP)</h2>
                    <p className="text-muted-foreground">
                        Gestão de ameaças intencionais e avaliação de riscos de mitigação.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Avaliação
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {assessments.length === 0 ? (
                    <Card className="col-span-full border-dashed">
                        <CardContent className="h-[200px] flex flex-col items-center justify-center space-y-4">
                            <Lock className="h-12 w-12 text-muted-foreground/50" />
                            <p className="text-muted-foreground text-center">
                                Nenhuma avaliação de ameaça registrada.<br />
                                Comece identificando as vulnerabilidades de segurança física ou cibernética.
                            </p>
                            <Button variant="outline">Documentar Primeira Ameaça</Button>
                        </CardContent>
                    </Card>
                ) : (
                    assessments.map((assessment) => (
                        <Card key={assessment.id} className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {assessment.area_name}
                                </CardTitle>
                                <Badge
                                    variant={assessment.risk_score > 15 ? "destructive" : "secondary"}
                                    className={assessment.risk_score > 8 && assessment.risk_score <= 15 ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : ""}
                                >
                                    Risco: {assessment.risk_score}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground mb-4">
                                    Tipo: <span className="capitalize">{assessment.threat_type.replace('_', ' ')}</span>
                                </div>
                                <p className="text-sm line-clamp-2 mb-4">
                                    {assessment.threat_description}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center text-muted-foreground">
                                        <User className="mr-1 h-3 w-3" />
                                        Responsável
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                        <Calendar className="mr-1 h-3 w-3" />
                                        {format(new Date(assessment.created_at), "dd MMM yyyy", { locale: ptBR })}
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button variant="ghost" size="sm">Ver Detalhes</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
