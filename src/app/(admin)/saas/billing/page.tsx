import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, TrendingUp, BarChart3, ChevronLeft, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function BillingPage() {
    return (
        <div className="space-y-8">
            {/* Futuristic Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 text-[10px] font-mono tracking-tighter uppercase font-bold">
                            Financial Governance
                        </Badge>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-emerald-500" />
                        Faturação Global
                    </h1>
                    <p className="text-slate-400 text-sm italic opacity-80 leading-relaxed max-w-2xl">
                        Monitorização consolidada de subscrições, usage de API e projeção de receitas do ecossistema SaaS.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-11 px-5" asChild>
                        <Link href="/saas/plans">
                            <RefreshCw className="mr-2 h-4 w-4 text-slate-400" /> Ver Planos
                        </Link>
                    </Button>
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-11 px-5" asChild>
                        <Link href="/saas">
                            <ChevronLeft className="mr-2 h-4 w-4 text-slate-400" /> Voltar à Consola
                        </Link>
                    </Button>
                </div>
            </div>

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
