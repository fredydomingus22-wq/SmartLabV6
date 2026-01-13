import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { SamplingPointDialog } from "./sampling-point-dialog";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ status?: string }>;
}

export default async function SamplingPointsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const supabase = await createClient();

    let query = supabase
        .from("sampling_points")
        .select("*")
        .order("name");

    if (params.status) {
        query = query.eq("status", params.status);
    }

    const { data: points } = await query;

    return (
        <div className="space-y-10 pb-20">
            <PageHeader
                variant="amber"
                icon={<MapPin className="h-4 w-4" />}
                overline="Quality Infrastructure"
                title="Pontos de Recolha"
                description="Gestão de locais físicos de amostragem na planta e armazéns."
                backHref="/quality"
                actions={<SamplingPointDialog mode="create" />}
            />

            {/* Filter */}
            <Card className="bg-card border-slate-800 shadow-lg">
                <CardContent className="p-4">
                    <div className="flex gap-2">
                        <Link href="/quality/sampling-points">
                            <Button variant={!params.status ? "default" : "outline"} size="sm" className={!params.status ? "bg-amber-600 hover:bg-amber-500 text-white border-none px-6 font-bold uppercase tracking-widest text-[10px]" : "border-slate-800 text-slate-400 font-bold uppercase tracking-widest text-[10px]"}>
                                Todos
                            </Button>
                        </Link>
                        <Link href="/quality/sampling-points?status=active">
                            <Button variant={params.status === "active" ? "default" : "outline"} size="sm" className={params.status === "active" ? "bg-emerald-600 hover:bg-emerald-500 text-white border-none px-6 font-bold uppercase tracking-widest text-[10px]" : "border-slate-800 text-slate-400 font-bold uppercase tracking-widest text-[10px]"}>
                                Ativos
                            </Button>
                        </Link>
                        <Link href="/quality/sampling-points?status=inactive">
                            <Button variant={params.status === "inactive" ? "default" : "outline"} size="sm" className={params.status === "inactive" ? "bg-rose-600 hover:bg-rose-500 text-white border-none px-6 font-bold uppercase tracking-widest text-[10px]" : "border-slate-800 text-slate-400 font-bold uppercase tracking-widest text-[10px]"}>
                                Inativos
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Points Table */}
            <Card className="bg-card border-slate-800 shadow-xl overflow-hidden">
                <CardHeader className="border-b border-slate-800 pb-4 bg-slate-900/50">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        LOCAIS DE AMOSTRAGEM ({points?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {!points || points.length === 0 ? (
                        <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-800 m-6 rounded-2xl bg-slate-950/20">
                            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-black uppercase tracking-widest text-xs">Sem pontos de recolha definidos.</p>
                            <p className="text-[10px] mt-2 font-bold uppercase tracking-widest">Crie um novo ponto para começar a monitorização.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/40">
                                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Código</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Designação</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Localização</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Estado</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right px-8">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {points.map((point) => (
                                        <tr key={point.id} className="group hover:bg-slate-900/40 transition-all border-b border-slate-800/20 last:border-0">
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono text-[10px] font-bold">
                                                        {point.code}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-black text-white italic text-center uppercase tracking-tight">
                                                    {point.name}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                                                    {point.location || "N/A"}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge className={`text-[9px] uppercase font-bold ${point.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                                    {point.status === 'active' ? 'ATIVO' : 'INATIVO'}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right px-8">
                                                <div className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                                                    <SamplingPointDialog mode="edit" point={point} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
