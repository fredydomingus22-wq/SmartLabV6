import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { SamplingPointDialog } from "./sampling-point-dialog";
import { PageHeader } from "@/components/layout/page-header";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
        <div className="space-y-6 px-6 pb-20">
            <PageHeader
                variant="amber"
                icon={<MapPin className="h-4 w-4" />}
                overline="Infraestrutura da Qualidade"
                title="Locais de Amostragem"
                description="Gestão de locações técnicas de amostragem operacional e logística."
                backHref="/quality"
                actions={<SamplingPointDialog mode="create" />}
            />

            {/* Filter */}
            <Card className="glass border-none shadow-xl bg-white/40 dark:bg-slate-900/40">
                <CardContent className="p-4">
                    <div className="flex gap-2">
                        <Link href="/quality/sampling-points">
                            <Button
                                variant={!params.status ? "default" : "outline"}
                                size="sm"
                                className={!params.status ? "bg-amber-600 hover:bg-amber-500 text-white border-none px-6 font-black uppercase tracking-[0.2em] text-[10px] italic shadow-lg shadow-amber-500/20" : "border-slate-200 dark:border-slate-800 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] italic"}
                            >
                                Volume Total
                            </Button>
                        </Link>
                        <Link href="/quality/sampling-points?status=active">
                            <Button
                                variant={params.status === "active" ? "default" : "outline"}
                                size="sm"
                                className={params.status === "active" ? "bg-emerald-600 hover:bg-emerald-500 text-white border-none px-6 font-black uppercase tracking-[0.2em] text-[10px] italic shadow-lg shadow-emerald-500/20" : "border-slate-200 dark:border-slate-800 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] italic"}
                            >
                                Status: Ativo
                            </Button>
                        </Link>
                        <Link href="/quality/sampling-points?status=inactive">
                            <Button
                                variant={params.status === "inactive" ? "default" : "outline"}
                                size="sm"
                                className={params.status === "inactive" ? "bg-rose-600 hover:bg-rose-500 text-white border-none px-6 font-black uppercase tracking-[0.2em] text-[10px] italic shadow-lg shadow-rose-500/20" : "border-slate-200 dark:border-slate-800 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] italic"}
                            >
                                Status: Inativo
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Points Table */}
            <Card className="glass border-none shadow-2xl overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-slate-950/40">
                <CardHeader className="border-b border-white/10 pb-4 bg-white/20 dark:bg-slate-900/20">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white flex items-center gap-2">
                        LOCAIS DE AMOSTRAGEM ({points?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {!points || points.length === 0 ? (
                        <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 m-6 rounded-2xl bg-white/50 dark:bg-slate-950/20">
                            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50 text-amber-500" />
                            <p className="font-black uppercase tracking-widest text-xs">Sem pontos de recolha definidos.</p>
                            <p className="text-[10px] mt-2 font-bold uppercase tracking-widest">Crie um novo ponto para começar a monitorização.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-white/10 dark:bg-slate-900/40">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Ref. Técnica</TableHead>
                                    <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Denominação</TableHead>
                                    <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Espaço Físico</TableHead>
                                    <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Estado</TableHead>
                                    <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-right px-8">Operações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {points.map((point) => (
                                    <TableRow key={point.id} className="group hover:bg-white/10 dark:hover:bg-slate-900/40 transition-all border-b border-white/5 last:border-0 h-16">
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] font-black">
                                                    {point.code}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-black text-slate-700 dark:text-white italic text-center uppercase tracking-tight">
                                                {point.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                                                {point.location || "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={`text-[9px] uppercase font-black tracking-widest px-3 py-0.5 rounded-full ${point.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                                {point.status === 'active' ? 'ATIVO' : 'INATIVO'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <div className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                                                <SamplingPointDialog mode="edit" point={point} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
