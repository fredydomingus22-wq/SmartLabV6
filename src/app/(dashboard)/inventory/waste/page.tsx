import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Trash2,
    Plus,
    HandHelping,
    BarChart3,
    AlertTriangle,
    ArrowDownToLine
} from "lucide-react";

export const metadata = {
    title: "Perdas e Desperdício | SmartLab",
    description: "Monitoramento de desperdício alimentar e gestão de doações.",
};

export default function FoodWastePage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-rose-100 rounded-lg">
                            <Trash2 className="h-6 w-6 text-rose-600" />
                        </div>
                        Gestão de <span className="text-rose-600">Desperdício</span>
                    </h2>
                    <p className="text-muted-foreground italic">FSSC 22000 v6 Requirement: Monitoring food loss and waste.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="gap-2">
                        <HandHelping className="h-4 w-4" />
                        Registrar Doação
                    </Button>
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg font-bold">
                        <Plus className="mr-2 h-4 w-4" />
                        Log de Perda
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="shadow-lg border-l-4 border-l-rose-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Desperdiçado (Mês)</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">142.5 kg</div>
                        <p className="text-xs text-rose-600">+12% em relação ao mês anterior</p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recuperado/Doado</CardTitle>
                        <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">850 kg</div>
                        <p className="text-xs text-emerald-600">Economia estimada: R$ 4.250</p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertas de Expirando</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8 itens</div>
                        <p className="text-xs text-muted-foreground">Lotes próximos ao vencimento - Ação necessária</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Descartes & Re-trabalho</CardTitle>
                        <CardDescription>Causas principais e destinos dos produtos não conformes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground italic border rounded-lg bg-slate-50/30">
                            Integração com dashboard de re-trabalho vindo em breve.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
