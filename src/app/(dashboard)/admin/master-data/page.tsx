"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, FlaskConical, Ruler, Tags } from "lucide-react";
import Link from "next/link";

export default function MasterDataPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Master Data</h1>
                <p className="text-muted-foreground">
                    Gerir dados mestres do sistema: Produtos, Especificações e Parâmetros.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="glass hover:bg-slate-900/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FlaskConical className="h-5 w-5 text-indigo-400" />
                            Tipos de Amostra
                        </CardTitle>
                        <CardDescription>
                            Configuração global de tipos de amostra.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/lab/sample-types">
                                Gerir Tipos <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass hover:bg-slate-900/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tags className="h-5 w-5 text-pink-400" />
                            Produtos
                        </CardTitle>
                        <CardDescription>
                            Catálogo de produtos acabados e matérias-primas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/products">
                                Gerir Produtos <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass hover:bg-slate-900/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Ruler className="h-5 w-5 text-emerald-400" />
                            Especificações
                        </CardTitle>
                        <CardDescription>
                            Limites e parâmetros de qualidade.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/quality/specifications">
                                Gerir Specs <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
