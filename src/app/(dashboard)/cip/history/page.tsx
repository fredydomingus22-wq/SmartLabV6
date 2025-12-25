import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'completed':
            return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Concluído</Badge>;
        case 'aborted':
            return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Abortado</Badge>;
        case 'failed':
            return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Falhou</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

export default async function CIPHistoryPage() {
    const supabase = await createClient();

    // Fetch archived executions
    const { data: executions, error } = await supabase
        .from("cip_executions")
        .select(`
            *,
            program:cip_programs(name),
            performer:user_profiles(full_name)
        `)
        .in("status", ["completed", "failed", "aborted"])
        .order("end_time", { ascending: false });

    if (error) {
        console.error("CIP History Error:", error);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <History className="h-8 w-8 text-primary" />
                        Histórico de CIP
                    </h1>
                    <p className="text-muted-foreground">Registo histórico de todos os ciclos de limpeza executados.</p>
                </div>
                <Link href="/cip/monitor">
                    <Button variant="outline">Voltar ao Monitor</Button>
                </Link>
            </div>

            <Card className="glass">
                <CardHeader>
                    <CardTitle>Execuções Passadas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Programa</TableHead>
                                <TableHead>Equipamento</TableHead>
                                <TableHead>Operador</TableHead>
                                <TableHead>Duração</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {executions?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhum registo encontrado no histórico.
                                    </TableCell>
                                </TableRow>
                            )}
                            {executions?.map((exec) => {
                                const start = new Date(exec.created_at);
                                const end = exec.end_time ? new Date(exec.end_time) : null;
                                const duration = end
                                    ? Math.round((end.getTime() - start.getTime()) / 60000)
                                    : null;

                                return (
                                    <TableRow key={exec.id}>
                                        <TableCell className="font-medium">
                                            {format(start, "PPp", { locale: ptBR })}
                                        </TableCell>
                                        <TableCell>{exec.program?.name || "N/A"}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono">
                                                {exec.equipment_id}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{exec.performer?.full_name || "N/A"}</TableCell>
                                        <TableCell>
                                            {duration !== null ? `${duration} min` : "--"}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={exec.status} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
