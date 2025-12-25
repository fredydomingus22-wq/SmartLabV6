import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Settings,
    History,
    Plus,
    CheckCircle,
    FileSearch,
    Wrench
} from "lucide-react";

export const metadata = {
    title: "Gestão de Ativos & Design Higiênico | SmartLab",
    description: "Controle de mudanças em equipamentos e verificação de critérios higiênicos.",
};

export default function EquipmentCompliancePage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <Wrench className="h-6 w-6" />
                        </div>
                        Design Higiênico <span className="text-indigo-600">& Ativos</span>
                    </h2>
                    <p className="text-muted-foreground italic">Especificações de compra e controle de mudanças (FSSC v6 Requirement).</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="gap-2">
                        <History className="h-4 w-4" />
                        Histórico de Manutenção
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">
                        <Plus className="mr-2 h-4 w-4" />
                        Solicitar Mudança
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-indigo-50/50 to-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSearch className="h-5 w-5 text-indigo-600" />
                            Docs de Compra
                        </CardTitle>
                        <CardDescription>Critérios técnicos e sanitários exigidos para novos ativos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-3 border rounded-md bg-white hover:bg-indigo-50 transition-colors cursor-pointer">
                                <p className="text-sm font-bold">Manual de Requisitos Higiênicos (Standard)</p>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">PDF • 2MB</span>
                            </div>
                            <div className="p-3 border rounded-md bg-white hover:bg-indigo-50 transition-colors cursor-pointer">
                                <p className="text-sm font-bold">Template: Checklist de Comissionamento</p>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">XLSX • 45KB</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-indigo-100">
                    <CardHeader>
                        <CardTitle className="text-lg">Controle de Mudanças Ativos</CardTitle>
                        <CardDescription>Fluxo de aprovação para modificações em equipamentos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            <div className="flex-1">
                                <p className="text-xs font-bold">Modificação Linha 2: Troca de Vedação</p>
                                <p className="text-[10px] text-muted-foreground">Aguardando Aprovação Qualidade</p>
                            </div>
                            <Badge variant="outline" className="text-[9px]">PENDENTE</Badge>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg opacity-80">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            <div className="flex-1">
                                <p className="text-xs font-bold font-mono text-emerald-800">C-049: Upgrade do Bico Injetor</p>
                                <p className="text-[10px] text-muted-foreground">Validado pós-limpeza em 20/12</p>
                            </div>
                            <Badge className="bg-emerald-600 text-[10px]">OK</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-indigo-600 text-white border-none shadow-xl flex flex-col justify-between">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                            Status de Ativos
                            <Settings className="h-5 w-5 opacity-50" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="text-4xl font-black">94.8%</div>
                        <p className="text-indigo-100 text-xs mt-2 uppercase tracking-tighter">Conformidade com o plano de manutenção preventiva</p>
                    </CardContent>
                    <CardContent className="pt-0">
                        <div className="h-1 bg-white/20 rounded-full w-full">
                            <div className="h-1 bg-white rounded-full transition-all duration-1000" style={{ width: '94.8%' }}></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
