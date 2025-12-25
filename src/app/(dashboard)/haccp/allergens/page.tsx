import { Suspense } from "react";
import { getAllergens } from "@/lib/queries/compliance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    Plus,
    FlaskConical,
    ShieldAlert,
    TestTube2,
    Settings2
} from "lucide-react";

export const metadata = {
    title: "Gestão de Alérgenos | SmartLab",
    description: "Matriz de riscos de alérgenos e controle de contaminação cruzada.",
};

export default async function AllergensPage() {
    const allergens = await getAllergens();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </span>
                        Gestão de <span className="text-amber-600">Alérgenos</span>
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Controle de ingredientes alergênicos e prevenção de contaminação cruzada em linha.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                        <Settings2 className="mr-2 h-4 w-4" />
                        Configurações
                    </Button>
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Alérgeno
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    <Card className="shadow-xl border-amber-100/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Catálogo de Alérgenos</CardTitle>
                                <CardDescription>Principais substâncias monitoradas no site.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {allergens.length === 0 ? (
                                    <p className="col-span-full text-center py-10 text-muted-foreground italic">Nenhum alérgeno cadastrado.</p>
                                ) : (
                                    allergens.map((allergen) => (
                                        <div key={allergen.id} className="flex items-center p-3 border rounded-lg hover:border-amber-400 transition-colors group">
                                            <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center mr-3">
                                                <FlaskConical className="h-5 w-5 text-amber-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800">{allergen.name}</h4>
                                                <div className="flex gap-1 mt-1">
                                                    <Badge variant="outline" className="text-[10px] scale-90 origin-left">RISCO {allergen.risk_category || 'MEDIO'}</Badge>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Ver</Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xl bg-slate-50 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-amber-600" />
                                Matriz de Lavagem & Troca
                            </CardTitle>
                            <CardDescription>Procedimentos de higienização necessários entre mudanças de produto.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground italic">
                            Configuração de matriz de contaminação cruzada por linha de produção vindo em breve.
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="shadow-md bg-gradient-to-br from-amber-600 to-orange-700 text-white border-none">
                        <CardHeader>
                            <CardTitle className="text-white">Alertas de Rotulagem</CardTitle>
                            <CardDescription className="text-amber-100">Itens com rotulagem pendente de revisão.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 italic text-sm">
                            <div className="p-3 bg-white/10 rounded-md">
                                "Contém Glúten" deve ser revisado em 3 produtos (Linha B).
                            </div>
                            <div className="p-3 bg-white/10 rounded-md opacity-50">
                                Sem alertas urgentes detectados nas últimas 24h.
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md overflow-hidden">
                        <CardHeader className="bg-slate-50">
                            <CardTitle className="text-sm font-bold uppercase tracking-tight">Validação de Limpeza</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 divide-y">
                            <div className="p-4 flex justify-between items-center bg-emerald-50/20">
                                <div className="flex items-center gap-2">
                                    <TestTube2 className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm font-medium">Linha 01 - Swab Alérgeno</span>
                                </div>
                                <Badge className="bg-emerald-500">APROVADO</Badge>
                            </div>
                            <div className="p-4 flex justify-between items-center opacity-70">
                                <div className="flex items-center gap-2">
                                    <TestTube2 className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm">Linha 04 - Swab Alérgeno</span>
                                </div>
                                <Badge variant="outline">24/12/2025</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
