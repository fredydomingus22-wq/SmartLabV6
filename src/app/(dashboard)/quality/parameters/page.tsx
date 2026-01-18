import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    Beaker,
    Plus,
    ArrowLeft,
    Search,
    Clock,
    Filter,
    FlaskConical,
    Activity,
    Eye,
    MoreHorizontal,
    Settings2,
    ShieldCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ParameterDialog } from "./parameter-dialog";
import { BulkImportDialog } from "./bulk-import-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { ActionTooltip } from "@/components/ui/action-tooltip";
import { ParametersToolbar } from "./_components/parameters-toolbar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ status?: string; category?: string; search?: string }>;
}

export default async function ParametersPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const supabase = await createClient();

    // 1. Build Query
    let query = supabase
        .from("qa_parameters")
        .select("*")
        .order("name");

    if (params.status) {
        query = query.eq("status", params.status);
    }

    if (params.category) {
        query = query.eq("category", params.category);
    }

    if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,code.ilike.%${params.search}%`);
    }

    const { data: parameters } = await query;

    // 2. Statistics
    const { data: categoryCounts } = await supabase
        .from("qa_parameters")
        .select("category")
        .eq("status", "active");

    const categories = (categoryCounts || []).reduce((acc, p) => {
        const cat = p.category || "other";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Configuration & Helpers
    const categoryConfig: Record<string, { label: string; color: string; icon: any; gradient: string }> = {
        physico_chemical: {
            label: "Físico-Químico",
            color: "text-blue-400",
            icon: Beaker,
            gradient: "from-blue-500/20 to-cyan-500/5 hover:to-cyan-500/10"
        },
        microbiological: {
            label: "Microbiológico",
            color: "text-emerald-400",
            icon: FlaskConical,
            gradient: "from-emerald-500/20 to-teal-500/5 hover:to-teal-500/10"
        },
        sensory: {
            label: "Sensorial",
            color: "text-purple-400",
            icon: Eye,
            gradient: "from-purple-500/20 to-pink-500/5 hover:to-pink-500/10"
        },
        other: {
            label: "Outros",
            color: "text-slate-400",
            icon: Activity,
            gradient: "from-slate-500/20 to-gray-500/5 hover:to-gray-500/10"
        },
        process: {
            label: "Processo / Engenharia",
            color: "text-amber-400",
            icon: Settings2,
            gradient: "from-amber-500/20 to-yellow-500/5 hover:to-yellow-500/10"
        }
    };

    const getCategoryStyle = (cat: string) => categoryConfig[cat] || categoryConfig["other"];

    return (
        <div className="space-y-6 px-6 pb-20">
            <PageHeader
                title="GQ • Engenharia de Processos"
                description="Configuração técnica de parâmetros, limiares de segurança e infraestrutura para conformidade normativa."
                icon={<Activity className="h-4 w-4 text-primary" />}
                variant="blue"
                actions={
                    <div className="flex flex-wrap gap-3">
                        <BulkImportDialog />
                        <ParameterDialog mode="create" />
                    </div>
                }
            />

            <Tabs defaultValue="parameters" className="space-y-6">
                <TabsList className="p-1 w-full md:w-auto h-auto grid grid-cols-2 md:grid-cols-4 gap-1 bg-slate-900/50 border border-slate-800">
                    <TabsTrigger value="parameters" className="py-2.5 px-6 rounded-lg font-bold transition-all data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        Parâmetros
                    </TabsTrigger>
                    <TabsTrigger value="specs" className="py-2.5 px-6 rounded-lg font-bold transition-all data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        Especificações
                    </TabsTrigger>
                    <TabsTrigger value="products" className="py-2.5 px-6 rounded-lg font-bold transition-all data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        Produtos
                    </TabsTrigger>
                    <TabsTrigger value="points" className="py-2.5 px-6 rounded-lg font-bold transition-all data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        Pontos de Recolha
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="parameters" className="space-y-6 mt-0 outline-none">
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className={cn(
                            "relative overflow-hidden p-6 transition-all duration-300 hover:border-primary/50 group cursor-pointer",
                            !params.category ? "border-primary/50 bg-primary/5" : "bg-slate-900/50"
                        )}>
                            <Link href="/quality/parameters" className="absolute inset-0 z-10" />
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Activity className="h-16 w-16" />
                            </div>
                            <div className="relative space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Volume de Parâmetros</p>
                                <h3 className="text-3xl font-black text-white tracking-tighter">
                                    {parameters?.length || 0}
                                </h3>
                                <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                    Registos em sistema
                                </div>
                            </div>
                        </Card>

                        {Object.entries(categories).map(([cat, count]) => {
                            const style = getCategoryStyle(cat);
                            const Icon = style.icon;
                            const isActive = params.category === cat;

                            return (
                                <Card key={cat} className={cn(
                                    "relative overflow-hidden p-6 transition-all duration-300 hover:border-primary/50 group cursor-pointer",
                                    isActive ? "border-primary/50 bg-primary/5" : "bg-slate-900/50"
                                )}>
                                    <Link key={cat} href={`/quality/parameters?category=${cat}`} className="absolute inset-0 z-10" />
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Icon className="h-16 w-16" />
                                    </div>
                                    <div className="relative space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">{style.label}</p>
                                        <h3 className="text-3xl font-black text-white tracking-tighter">
                                            {count}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-primary uppercase tracking-widest italic">
                                            Filtro Ativo &rarr;
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Toolbar */}
                    <ParametersToolbar totalResults={parameters?.length || 0} />

                    {/* Data Table */}
                    <Card className="glass border-none shadow-2xl overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-slate-950/40">
                        {!parameters || parameters.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-4">
                                    <Beaker className="h-10 w-10 text-slate-400 dark:text-muted-foreground transition-transform hover:scale-110" />
                                </div>
                                <h3 className="text-lg font-black text-white dark:text-slate-300 uppercase tracking-tight italic">Status: Pesquisa Sem Resultados</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest max-w-sm mt-2 italic leading-relaxed">
                                    Refine os critérios de pesquisa ou crie um novo parâmetro técnico para iniciar a monitorização.
                                </p>
                                <div className="mt-8">
                                    <ParameterDialog mode="create" />
                                </div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-900/50">
                                    <TableRow className="border-b border-slate-800 hover:bg-transparent">
                                        <TableHead className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Ref. Técnica</TableHead>
                                        <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Parâmetro GQ</TableHead>
                                        <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Unidade</TableHead>
                                        <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Categoria / Validação</TableHead>
                                        <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Média Análise</TableHead>
                                        <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Estado</TableHead>
                                        <TableHead className="py-4 px-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Operações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parameters.map((param) => {
                                        const style = getCategoryStyle(param.category || "other");

                                        return (
                                            <TableRow key={param.id} className="group hover:bg-slate-900/40 transition-all border-b border-slate-800/30 last:border-0 border-x-0">
                                                <TableCell className="py-3 px-6">
                                                    <span className="font-mono font-black text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded-md border border-indigo-500/10 text-[11px]">
                                                        {param.code}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <div className="max-w-[240px]">
                                                        <p className="font-black text-white italic tracking-tight text-sm line-clamp-1">{param.name}</p>
                                                        {param.description && (
                                                            <p className="text-[9px] text-slate-500 uppercase tracking-[0.1em] font-black mt-0.5 truncate">
                                                                {param.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span className="font-mono text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                                        {param.unit || "-"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <Badge variant="outline" className={cn("px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter text-[9px] border border-slate-800 bg-slate-900/50 w-fit", style.color)}>
                                                            {style.label}
                                                        </Badge>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mt-0.5 italic">{param.method || "Sem Método"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    {param.analysis_time_minutes ? (
                                                        <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                                                            <Clock className="h-3 w-3 opacity-50" />
                                                            {param.analysis_time_minutes}M
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-800 font-black">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <Badge className={cn(
                                                        "px-3 py-1 rounded-xl font-black uppercase tracking-tighter text-[10px] border shadow-inner italic",
                                                        param.status === "active"
                                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                    )}>
                                                        {param.status === "active" ? "ATIVO" : "INATIVO"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-3 px-6 text-right">
                                                    <div className="opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                                                        <ParameterDialog mode="edit" parameter={param} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="specs" className="mt-0 outline-none">
                    <Card className="p-12 text-center space-y-6">
                        <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                            <Beaker className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-black uppercase tracking-tight italic text-white">Especificações de Produto</h2>
                            <p className="text-[10px] text-slate-500 max-w-md mx-auto font-black uppercase tracking-widest leading-relaxed italic">
                                Configuração de limiares técnicos e frequências de amostragem por família de produto.
                            </p>
                        </div>
                        <Link href="/quality/specifications" className="block">
                            <Button variant="default" className="px-8 font-bold uppercase tracking-widest text-xs h-11">
                                Abrir Especificações
                            </Button>
                        </Link>
                    </Card>
                </TabsContent>

                <TabsContent value="products" className="mt-0 outline-none">
                    <Card className="p-12 text-center space-y-6">
                        <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center mx-auto">
                            <FlaskConical className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-black uppercase tracking-tight italic text-white">Mestre de Produtos</h2>
                            <p className="text-[10px] text-slate-500 max-w-md mx-auto font-black uppercase tracking-widest leading-relaxed italic">
                                Gestão centralizada do catálogo de produção, SKUs e atributos técnicos de qualidade.
                            </p>
                        </div>
                        <Link href="/quality/products" className="block">
                            <Button variant="default" className="px-8 font-bold uppercase tracking-widest text-xs h-11">
                                Abrir Catálogo
                            </Button>
                        </Link>
                    </Card>
                </TabsContent>

                <TabsContent value="points" className="mt-0 outline-none">
                    <Card className="p-12 text-center space-y-6">
                        <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center mx-auto">
                            <Activity className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-black uppercase tracking-tight italic text-white">Logística de Amostragem</h2>
                            <p className="text-[10px] text-slate-500 max-w-md mx-auto font-black uppercase tracking-widest leading-relaxed italic">
                                Mapeamento técnico de locações físicas na linha de produção e armazéns.
                            </p>
                        </div>
                        <Link href="/quality/sampling-points" className="block">
                            <Button variant="default" className="px-8 font-bold uppercase tracking-widest text-xs h-11">
                                Abrir Pontos de Recolha
                            </Button>
                        </Link>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>

    );
}
