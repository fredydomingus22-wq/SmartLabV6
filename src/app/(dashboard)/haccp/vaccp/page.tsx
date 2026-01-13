import { Suspense } from "react";
import { getVACCPByOrganization } from "@/lib/queries/compliance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, SearchCode, ShieldCheck, AlertCircle, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
    title: "Fraude Alimentar (VACCP) | SmartLab",
    description: "Avaliação de vulnerabilidade a fraudes e plano de mitigação.",
};

export default async function VACCPPage() {
    const vulnerabilities = await getVACCPByOrganization();

    return (
        <div className="space-y-10">
            <PageHeader
                variant="blue"
                icon={<ShoppingCart className="h-4 w-4" />}
                overline="Supply Chain Integrity • Food Fraud"
                title="Fraude Alimentar (VACCP)"
                description="Avaliação sistemática de vulnerabilidades a fraudes em matérias-primas e serviços."
                backHref="/haccp"
                actions={
                    <Button className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-xl text-[10px] font-black uppercase tracking-widest px-4 transition-all">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Análise de Vulnerabilidade
                    </Button>
                }
            />

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {vulnerabilities.length === 0 ? (
                    <Card className="col-span-full border-dashed">
                        <CardContent className="h-[200px] flex flex-col items-center justify-center space-y-4">
                            <SearchCode className="h-12 w-12 text-muted-foreground/50" />
                            <p className="text-muted-foreground text-center">
                                Nenhuma análise de fraude realizada.<br />
                                Avalie seus ingredientes com base no histórico de fraude e motivação econômica.
                            </p>
                            <Button variant="outline">Avaliar Ingrediente</Button>
                        </CardContent>
                    </Card>
                ) : (
                    vulnerabilities.map((v) => (
                        <Card key={v.id} className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {v.material?.name || "Material Desconhecido"}
                                </CardTitle>
                                <Badge variant={v.vulnerability_score > 60 ? "destructive" : v.vulnerability_score > 30 ? "warning" : "default"}>
                                    Vulnerabilidade: {v.vulnerability_score}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 mt-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Histórico de Fraude:</span>
                                        <span>{v.fraud_history_score}/5</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Ganho Econômico:</span>
                                        <span>{v.economic_gain_potential}/5</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Facilidade de Detecção:</span>
                                        <span>{v.detection_ease_score}/5</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t">
                                    <h4 className="text-xs font-semibold mb-2 flex items-center">
                                        <ShieldCheck className="mr-1 h-3 w-3" /> ESTRATÉGIA DE MITIGAÇÃO
                                    </h4>
                                    <p className="text-xs italic text-muted-foreground line-clamp-2">
                                        {v.mitigation_strategy || "Nenhuma estratégia definida."}
                                    </p>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <Button variant="ghost" size="sm">Histórico</Button>
                                    <Button variant="ghost" size="sm">Editar</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
