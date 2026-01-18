import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Zap, Building, Building2, ShieldCheck, ChevronLeft, Home, Layers, CreditCard } from "lucide-react";
import Link from "next/link";

export default function PlansPage() {
    const plans = [
        {
            name: "Trial",
            price: "€0",
            description: "Para pequenas equipas iniciarem a digitalização.",
            features: ["1 Unidade (Planta)", "Até 5 Utilizadores", "Sensores Básicos", "Suporte Comunitário"],
            icon: Building,
            color: "amber"
        },
        {
            name: "Pro",
            price: "€399/mês",
            description: "Ideal para operações industriais em crescimento.",
            features: ["Até 3 Unidades (Plantas)", "Até 15 Utilizadores", "Alertas SPC Avançados", "Suporte 24/7"],
            icon: Zap,
            color: "purple",
            popular: true
        },
        {
            name: "Business",
            price: "€599/mês",
            description: "Solução robusta para gestão multi-planta avançada.",
            features: ["Até 10 Unidades (Plantas)", "Utilizadores Ilimitados", "API Access", "Custom Dashboards"],
            icon: Building2,
            color: "indigo"
        },
        {
            name: "Enterprise",
            price: "Custom",
            description: "Solução completa para grandes grupos globais.",
            features: ["Unidades Ilimitadas", "Custom ISO Workflows", "SLA Garantido", "Account Manager Dedicado"],
            icon: ShieldCheck,
            color: "blue"
        }
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* Futuristic Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 text-[10px] font-mono tracking-tighter uppercase font-bold">
                            Monetization Engine
                        </Badge>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <Layers className="h-8 w-8 text-indigo-500" />
                        Planos & Tiers
                    </h1>
                    <p className="text-slate-400 text-sm italic opacity-80 leading-relaxed max-w-2xl">
                        Configuração de quotas, limites de plantas e níveis de serviço para as organizações do ecossistema SmartLab.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-11 px-5" asChild>
                        <Link href="/saas/billing">
                            <CreditCard className="mr-2 h-4 w-4 text-slate-400" /> Ver Faturação
                        </Link>
                    </Button>
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-11 px-5" asChild>
                        <Link href="/saas">
                            <ChevronLeft className="mr-2 h-4 w-4 text-slate-400" /> Voltar à Consola
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <Card key={plan.name} className={`bg-slate-900/40 border-slate-800 relative overflow-hidden transition-all duration-300 hover:border-${plan.color}-500/50 ${plan.popular ? `ring-2 ring-${plan.color}-500/20` : ''}`}>
                        {plan.popular && (
                            <div className={`absolute top-0 right-0 bg-${plan.color}-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-tighter`}>
                                Popular
                            </div>
                        )}
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg bg-${plan.color}-500/10`}>
                                    <plan.icon className={`h-5 w-5 text-${plan.color}-500`} />
                                </div>
                                <CardTitle className="text-xl text-slate-100">{plan.name}</CardTitle>
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl font-bold text-slate-50">{plan.price}</span>
                                {plan.price !== 'Custom' && <span className="text-slate-500 text-sm">/unidade</span>}
                            </div>
                            <CardDescription className="text-slate-400">{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                                        <Check className={`h-4 w-4 text-${plan.color}-500 shrink-0`} />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6">
                                <Badge variant="outline" className={`w-full justify-center py-2 border-dashed border-slate-700 text-slate-500 cursor-not-allowed`}>
                                    Configuração via Stripe
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-slate-950/40 border-slate-800/60 p-6">
                <h3 className="text-slate-200 font-semibold mb-2">Nota Informativa</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                    Estes tiers são aplicados ao nível da **Organização**. Os limites de **Plantas (Unidades)** e utilizadores são verificados em tempo real pelo proxy de autorização e pelas políticas de RLS.
                </p>
            </Card>
        </div>
    );
}
