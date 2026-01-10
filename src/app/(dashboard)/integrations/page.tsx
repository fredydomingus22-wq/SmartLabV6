"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plug } from "lucide-react";

export default function IntegrationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Integrações de Sistema</h1>
                <p className="text-muted-foreground">
                    Gerir conexões com ERP, IoT e sistemas externos.
                </p>
            </div>

            <div className="grid gap-4">
                <Card className="glass opacity-60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plug className="h-5 w-5" />
                            Hub de Integração
                        </CardTitle>
                        <CardDescription>
                            Gestão centralizada de APIs e Webhooks.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        Em breve: Conectores para SAP, PHC e Equipamentos de Lab IoT.
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
