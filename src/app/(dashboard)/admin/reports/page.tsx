"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileJson } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";


export default function AdminReportsPage() {
    return (
        <div className="space-y-6 px-6">
            <PageHeader
                title="Relatórios de Sistema"
                description="Auditoria global e relatórios de conformidade."
                icon={<FileJson className="h-6 w-6 text-slate-400" />}
                variant="slate"
            />


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
