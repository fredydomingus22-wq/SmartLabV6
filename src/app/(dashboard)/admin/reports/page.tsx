"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileJson } from "lucide-react";

export default function AdminReportsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Relatórios de Sistema</h1>
                <p className="text-muted-foreground">
                    Auditoria global e relatórios de conformidade.
                </p>
            </div>

            <div className="grid gap-4">
                <Card className="glass opacity-60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileJson className="h-5 w-5" />
                            Em Construção
                        </CardTitle>
                        <CardDescription>
                            Este módulo de relatórios avançados está a ser preparado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        Funcionalidade em desenvolvimento para Sprint 6.
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
