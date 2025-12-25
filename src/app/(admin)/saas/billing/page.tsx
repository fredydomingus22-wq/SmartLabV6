import { PageHeader } from "@/components/smart/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, TrendingUp, BarChart3 } from "lucide-react";

export default function BillingPage() {
    return (
        <div className="space-y-8">
            <PageHeader
                title="Faturação Global"
                description="Monitorização de usage e receitas do ecossistema SaaS."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-emerald-500" />
                            MRR Atual
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">€0.00</div>
                        <p className="text-xs text-slate-500 mt-1">Estimativa mensal antes de impostos</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            Crescimento (30d)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">0%</div>
                        <p className="text-xs text-slate-500 mt-1">Novas subscrições vs cancelamentos</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-indigo-500" />
                            Usage de API
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">0 reqs</div>
                        <p className="text-xs text-slate-500 mt-1">Consumo total da plataforma</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-950/40 border-slate-800 border-dashed">
                <CardContent className="py-20 text-center">
                    <div className="bg-slate-900 inline-flex p-4 rounded-full mb-4">
                        <CreditCard className="h-8 w-8 text-slate-600" />
                    </div>
                    <h3 className="text-slate-300 font-semibold text-lg">Módulo de Faturação em Desenvolvimento</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2 italic">
                        A integração com Stripe Connect para gestão automática de subscrições está planeada para o próximo Sprint.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
