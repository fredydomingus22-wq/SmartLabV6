import { getShiftReportData } from "@/lib/queries/shift-report";
import { getShifts } from "@/lib/queries/training";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Clock, Factory, Beaker, FlaskConical, Droplets,
    AlertTriangle, TrendingUp, Package
} from "lucide-react";
import Link from "next/link";
import { ShiftSelector } from "./shift-selector";
import { GenerateShiftReportButton } from "./generate-shift-report-button";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ date?: string; shift?: string }>;
}

export default async function ShiftReportPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const today = new Date().toISOString().split("T")[0];
    const selectedDate = params.date || today;

    // 1. Get available shifts
    const { data: shifts = [] } = await getShifts();

    // Default to first shift if not selected
    const selectedShiftId = params.shift || (shifts && shifts.length > 0 ? shifts[0].id : "");

    // 2. Get report data
    let data = null;
    let error = null;

    if (selectedShiftId) {
        const result = await getShiftReportData(selectedDate, selectedShiftId);
        data = result.data;
        error = result.error;
    }
    const currentShift = shifts?.find((s: any) => s.id === selectedShiftId);

    return (
        <div className="space-y-8 print:space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/reports">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Clock className="h-8 w-8 text-indigo-500" />
                            Relatório de Turno
                        </h1>
                        <p className="text-muted-foreground">
                            Resumo completo das atividades do turno
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <GenerateShiftReportButton
                        date={selectedDate}
                        shiftId={selectedShiftId}
                        disabled={!currentShift || !data}
                    />
                </div>
            </div>

            {/* Shift Selector */}
            <ShiftSelector
                currentDate={selectedDate}
                currentShiftId={selectedShiftId}
                availableShifts={shifts || []}
            />

            {/* Print Header */}
            <div className="hidden print:block border-b pb-4 mb-4">
                <h1 className="text-2xl font-bold">RELATÓRIO DE TURNO</h1>
                <p className="text-lg">
                    {new Date(data ? data.shiftInfo.queryStartDate : selectedDate).toLocaleString("pt-PT", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                    {" até "}
                    {new Date(data ? data.shiftInfo.queryEndDate : selectedDate).toLocaleString("pt-PT", {
                        hour: "2-digit", minute: "2-digit"
                    })}
                </p>
                <p className="font-semibold">
                    Turno: {currentShift ? `${currentShift.name} (${currentShift.start_time.substring(0, 5)} - ${currentShift.end_time.substring(0, 5)})` : "N/A"}
                </p>
            </div>

            {error ? (
                <Card className="glass">
                    <CardContent className="pt-6">
                        <div className="text-center text-red-500">
                            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                            <p>Erro ao carregar dados: {error}</p>
                        </div>
                    </CardContent>
                </Card>
            ) : data ? (
                <div className="space-y-6 print:space-y-4">
                    {/* KPI Summary */}
                    <div className="grid gap-4 md:grid-cols-5 print:grid-cols-5">
                        <Card className="glass print:shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Factory className="h-4 w-4" />
                                    Linhas Ativas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{data.production.linesActive}</p>
                            </CardContent>
                        </Card>

                        <Card className="glass print:shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Lotes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{data.production.batchesCompleted}/{data.production.batchesStarted}</p>
                                <p className="text-xs text-muted-foreground">completos / iniciados</p>
                            </CardContent>
                        </Card>

                        <Card className="glass print:shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <FlaskConical className="h-4 w-4" />
                                    Amostras
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{data.quality.samplesAnalyzed}</p>
                                <p className="text-xs text-muted-foreground">de {data.quality.samplesCollected} colhidas</p>
                            </CardContent>
                        </Card>

                        <Card className={`glass print:shadow-none ${data.quality.conformityRate < 95 ? "border-orange-500" : ""}`}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Conformidade
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className={`text-3xl font-bold ${data.quality.conformityRate >= 95 ? "text-green-600" : "text-orange-500"}`}>
                                    {data.quality.conformityRate}%
                                </p>
                                <p className="text-xs text-muted-foreground">{data.quality.oosCount} OOS</p>
                            </CardContent>
                        </Card>

                        <Card className="glass print:shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Droplets className="h-4 w-4" />
                                    CIP
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{data.cip.cyclesCompleted}</p>
                                <p className="text-xs text-muted-foreground">{data.cip.equipmentCleaned} equipamentos</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Production & Tanks */}
                    <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
                        <Card className="glass print:shadow-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Factory className="h-5 w-5" />
                                    Produção
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Linhas Ativas</span>
                                        <span className="font-semibold">{data.production.linesActive}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Lotes Iniciados</span>
                                        <span className="font-semibold">{data.production.batchesStarted}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Lotes Concluídos</span>
                                        <span className="font-semibold">{data.production.batchesCompleted}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-muted-foreground">Quantidade Total</span>
                                        <span className="font-bold">{data.production.totalQuantityProduced.toLocaleString()} un</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass print:shadow-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Beaker className="h-5 w-5" />
                                    Tanques / Intermediários
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Liberados</span>
                                        <Badge variant="default" className="bg-green-500">{data.tanks.released}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Bloqueados</span>
                                        <Badge variant="destructive">{data.tanks.blocked}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Em Progresso</span>
                                        <Badge variant="secondary">{data.tanks.inProgress}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Active Batch Details */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Beaker className="h-6 w-6 text-indigo-500" />
                            Detalhes dos Lotes Ativos
                        </h2>

                        {data.production.activeBatches?.length === 0 ? (
                            <Card className="glass">
                                <CardContent className="pt-6 text-center text-muted-foreground">
                                    Nenhum lote ativo neste turno.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {data.production.activeBatches?.map((batch, idx) => (
                                    <Card key={idx} className="glass print:shadow-none hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                        {batch.batchCode}
                                                        <Badge variant={batch.status === 'released' ? 'default' : 'secondary'} className={batch.status === 'released' ? 'bg-green-500 hover:bg-green-600' : ''}>
                                                            {batch.status}
                                                        </Badge>
                                                    </CardTitle>
                                                    <CardDescription>{batch.productName}</CardDescription>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-2xl font-bold ${batch.conformityRate >= 95 ? 'text-green-600' : 'text-orange-500'}`}>
                                                        {batch.conformityRate}%
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Conformidade</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Metrics Grid */}
                                            <div className="grid grid-cols-3 gap-2 text-center py-2 bg-muted/30 rounded-lg">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Amostras</p>
                                                    <p className="font-bold">{batch.samplesAnalyzed}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Tanques</p>
                                                    <p className="font-bold">{batch.tanksPrepared}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">OOS</p>
                                                    <p className={`font-bold ${(batch.oosBreakdown?.length || 0) > 0 ? 'text-red-500' : ''}`}>
                                                        {batch.oosBreakdown?.reduce((acc, curr) => acc + curr.count, 0) || 0}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* AI Insight */}
                                            <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-md border-l-4 border-blue-500">
                                                <p className="text-sm italic text-blue-700 dark:text-blue-300">
                                                    "{batch.observations}"
                                                </p>
                                                <p className="text-[10px] text-right text-blue-400 mt-1 uppercase font-bold tracking-wider">
                                                    🤖 AI Observation
                                                </p>
                                            </div>

                                            {/* OOS Breakdown */}
                                            {(batch.oosBreakdown?.length || 0) > 0 && (
                                                <div className="border-t pt-3">
                                                    <p className="text-xs font-semibold mb-2">Non-Conformities:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {batch.oosBreakdown.map((oos, i) => (
                                                            <Badge key={i} variant="destructive" className="text-xs">
                                                                {oos.parameter}: {oos.count}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CIP & Blocks */}
                    <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
                        <Card className="glass print:shadow-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Droplets className="h-5 w-5" />
                                    CIP - Limpeza
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Ciclos Completos</span>
                                        <Badge className="bg-green-500">{data.cip.cyclesCompleted}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Equipamentos Limpos</span>
                                        <span className="font-semibold">{data.cip.equipmentCleaned}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Ciclos Falhados</span>
                                        <Badge variant={data.cip.cyclesFailed > 0 ? "destructive" : "secondary"}>
                                            {data.cip.cyclesFailed}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`glass print:shadow-none ${data.blocks.palletsBlocked > 0 || data.blocks.ncsRaised > 0 ? "border-orange-500" : ""}`}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Bloqueios & NCs
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Paletes Bloqueadas</span>
                                        <Badge variant={data.blocks.palletsBlocked > 0 ? "destructive" : "secondary"}>
                                            {data.blocks.palletsBlocked}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">NCs Abertas</span>
                                        <Badge variant={data.blocks.ncsRaised > 0 ? "destructive" : "secondary"}>
                                            {data.blocks.ncsRaised}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Footer */}
                    <div className="border-t pt-4 text-sm text-muted-foreground print:text-xs">
                        <p>Relatório gerado automaticamente pelo SmartLab LIMS.</p>
                        <p>Data de geração: {new Date().toLocaleString("pt-PT")}</p>
                    </div>
                </div>
            ) : (
                <Card className="glass">
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Selecione um turno para visualizar o relatório</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
