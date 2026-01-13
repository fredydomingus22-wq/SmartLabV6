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
import Link from "next/link";
import { ParameterDialog } from "./parameter-dialog";
import { BulkImportDialog } from "./bulk-import-dialog";
import { PageHeader } from "@/components/layout/page-header";
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
        <div className="container py-8 space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Engenharia de Qualidade"
                overline="Quality Management"
                description="Configuração técnica de parâmetros, especificações e infraestrutura industrial para conformidade normativa."
                icon={<Activity className="h-4 w-4" />}
                variant="blue"
                actions={
                    <div className="flex flex-wrap gap-3">
                        <BulkImportDialog />
                        <ParameterDialog mode="create" />
                    </div>
                }
            />

            <Tabs defaultValue="parameters" className="space-y-8">
                <TabsList className="glass border-white/5 p-1 w-full md:w-auto h-auto grid grid-cols-2 md:grid-cols-4 gap-1">
                    <TabsTrigger value="parameters" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 py-2.5 px-6 rounded-xl font-bold transition-all">
                        Parâmetros
                    </TabsTrigger>
                    <TabsTrigger value="specs" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 py-2.5 px-6 rounded-xl font-bold transition-all">
                        Especificações
                    </TabsTrigger>
                    <TabsTrigger value="products" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 py-2.5 px-6 rounded-xl font-bold transition-all">
                        Produtos
                    </TabsTrigger>
                    <TabsTrigger value="points" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 py-2.5 px-6 rounded-xl font-bold transition-all">
                        Pontos de Recolha
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="parameters" className="space-y-8 mt-0 outline-none">
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Link href="/quality/parameters">
                            <div className={cn(
                                "relative overflow-hidden rounded-2xl border border-white/5 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 active:scale-95 group",
                                "bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl",
                                !params.category ? "ring-1 ring-blue-500/50" : ""
                            )}>
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Activity className="h-16 w-16" />
                                </div>
                                <div className="relative">
                                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total de Parâmetros</p>
                                    <h3 className="text-4xl font-black text-white mt-2 tracking-tight">
                                        {parameters?.length || 0}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-4 text-xs font-medium text-slate-500">
                                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                        Todos os registros
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {Object.entries(categories).map(([cat, count]) => {
                            const style = getCategoryStyle(cat);
                            const Icon = style.icon;
                            const isActive = params.category === cat;

                            return (
                                <Link key={cat} href={`/quality/parameters?category=${cat}`}>
                                    <div className={cn(
                                        "relative overflow-hidden rounded-2xl border border-white/5 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-95 group",
                                        "bg-gradient-to-br backdrop-blur-xl",
                                        style.gradient,
                                        isActive ? `ring-1 ring-white/20` : ""
                                    )}>
                                        <div className={cn("absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity", style.color)}>
                                            <Icon className="h-16 w-16" />
                                        </div>
                                        <div className="relative">
                                            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{style.label}</p>
                                            <h3 className="text-4xl font-black text-white mt-2 tracking-tight">
                                                {count}
                                            </h3>
                                            <div className={cn("flex items-center gap-2 mt-4 text-xs font-bold", style.color)}>
                                                Visualizar categoria &rarr;
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Main Content Area */}
                    <div className="space-y-4">
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl glass border border-white/5 items-center justify-between">
                            <form className="flex-1 w-full md:w-auto flex gap-3">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        name="search"
                                        placeholder="Buscar por nome ou código..."
                                        defaultValue={params.search}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/20 text-sm md:text-base text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500 transition-all font-medium"
                                    />
                                </div>
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <select
                                        name="status"
                                        defaultValue={params.status || ""}
                                        className="pl-10 pr-8 py-2.5 rounded-xl border border-white/10 bg-black/20 text-sm md:text-base text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none font-medium cursor-pointer hover:bg-black/30 transition-all"
                                    >
                                        <option value="" className="bg-slate-900">Todos os Status</option>
                                        <option value="active" className="bg-slate-900">Ativos</option>
                                        <option value="inactive" className="bg-slate-900">Inativos</option>
                                    </select>
                                </div>
                                <Button type="submit" size="default" className="rounded-xl px-6 font-bold bg-white/5 hover:bg-white/10 border border-white/10">
                                    Filtrar
                                </Button>
                            </form>

                            <div className="text-sm font-medium text-slate-400">
                                Mostrando <span className="text-white font-bold">{parameters?.length || 0}</span> resultados
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="rounded-2xl border border-white/5 bg-black/20 backdrop-blur-sm overflow-hidden shadow-2xl">
                            {!parameters || parameters.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="p-6 rounded-full bg-white/5 mb-4">
                                        <Beaker className="h-12 w-12 text-slate-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-300">Nenhum parâmetro encontrado</h3>
                                    <p className="text-slate-500 max-w-sm mt-2">
                                        Tente ajustar seus filtros ou crie um novo parâmetro para começar.
                                    </p>
                                    <div className="mt-6">
                                        <ParameterDialog mode="create" />
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-white/5 text-slate-400 uppercase tracking-wider text-xs font-bold border-b border-white/5">
                                            <tr>
                                                <th className="text-left py-4 px-6">Código</th>
                                                <th className="text-left py-4 px-6">Nome do Parâmetro</th>
                                                <th className="text-left py-4 px-6">Unidade</th>
                                                <th className="text-left py-4 px-6">Categoria</th>
                                                <th className="text-left py-4 px-6">Método</th>
                                                <th className="text-center py-4 px-6">Tempo</th>
                                                <th className="text-center py-4 px-6">Versão</th>
                                                <th className="text-center py-4 px-6">Status</th>
                                                <th className="text-right py-4 px-6 w-[100px]">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {parameters.map((param) => {
                                                const style = getCategoryStyle(param.category || "other");

                                                return (
                                                    <tr key={param.id} className="group hover:bg-white/[0.02] transition-colors">
                                                        <td className="py-4 px-6 font-mono text-slate-400 font-medium group-hover:text-white transition-colors">
                                                            {param.code}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                                                                    {param.name}
                                                                </span>
                                                                {param.description && (
                                                                    <span className="text-xs text-slate-500 truncate max-w-[200px]">
                                                                        {param.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 text-slate-400 font-medium">{param.unit || "-"}</td>
                                                        <td className="py-4 px-6">
                                                            <Badge variant="outline" className={cn(
                                                                "bg-transparent border font-bold capitalize shadow-none",
                                                                style.color.replace("text-", "border-").replace("400", "500/30"),
                                                                style.color
                                                            )}>
                                                                {style.label}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-4 px-6 text-slate-400">{param.method || "-"}</td>
                                                        <td className="py-4 px-6 text-center">
                                                            {param.analysis_time_minutes ? (
                                                                <Badge variant="secondary" className="bg-slate-800 text-slate-400 font-mono text-xs border border-white/5">
                                                                    <Clock className="h-3 w-3 mr-1.5" />
                                                                    {param.analysis_time_minutes}m
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-slate-600">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <Badge variant="outline" className="bg-slate-900/50 border-slate-700 text-slate-400 font-mono text-[10px]">
                                                                v{param.version || 1}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <div className={cn(
                                                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border",
                                                                param.status === "active"
                                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                                                    : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                                            )}>
                                                                <span className={cn(
                                                                    "mr-1.5 h-1.5 w-1.5 rounded-full",
                                                                    param.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                                                                )} />
                                                                {param.status === "active" ? "Ativo" : "Inativo"}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <ParameterDialog mode="edit" parameter={param} />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="specs" className="mt-0 outline-none">
                    <div className="glass p-12 rounded-3xl border-none shadow-xl text-center space-y-4">
                        <div className="h-20 w-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
                            <Beaker className="h-10 w-10 text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold">Especificações de Produto</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Defina limites de qualidade e frequências de análise para cada produto ou modo global.
                        </p>
                        <Link href="/quality/specifications">
                            <Button className="bg-purple-600 hover:bg-purple-500 mt-4">
                                Abrir Especificações
                            </Button>
                        </Link>
                    </div>
                </TabsContent>

                <TabsContent value="products" className="mt-0 outline-none">
                    <div className="glass p-12 rounded-3xl border-none shadow-xl text-center space-y-4">
                        <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                            <FlaskConical className="h-10 w-10 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold">Gestão de Catálogo de Produtos</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Configure os produtos produzidos na unidade, SKUs e atributos principais.
                        </p>
                        <Link href="/quality/products">
                            <Button className="bg-emerald-600 hover:bg-emerald-500 mt-4">
                                Abrir Produtos
                            </Button>
                        </Link>
                    </div>
                </TabsContent>

                <TabsContent value="points" className="mt-0 outline-none">
                    <div className="glass p-12 rounded-3xl border-none shadow-xl text-center space-y-4">
                        <div className="h-20 w-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                            <Activity className="h-10 w-10 text-amber-400" />
                        </div>
                        <h2 className="text-2xl font-bold">Infraestrutura e Pontos de Recolha</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Mapeie os pontos de amostragem físicos na linha de produção e armazéns.
                        </p>
                        <Link href="/quality/sampling-points">
                            <Button className="bg-amber-600 hover:bg-amber-500 mt-4">
                                Abrir Pontos de Recolha
                            </Button>
                        </Link>
                    </div>
                </TabsContent>
            </Tabs >
        </div >
    );
}
