"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
    Area,
    AreaChart,
} from "recharts";
import {
    TrendingUp,
    BarChart3,
    PieChartIcon,
    Target,
    Eye,
    EyeOff,
    Calendar,
    Filter,
    Settings2,
    ChevronDown,
    ChevronUp,
    GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendDataItem {
    month: number;
    monthName: string;
    complianceRate: number;
    total: number;
}

interface NCsByProcessItem {
    name: string;
    count: number;
}

interface AuditsByTypeItem {
    name: string;
    value: number;
}

interface ComplianceByStandardItem {
    standard: string;
    complianceRate: number;
    total: number;
}

interface AuditDashboardChartsProps {
    trendData: TrendDataItem[];
    ncsByProcess: NCsByProcessItem[];
    auditsByType: AuditsByTypeItem[];
    complianceByStandard: ComplianceByStandardItem[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const CHART_CONFIG = {
    trend: { key: "trend", label: "Evolução da Conformidade", icon: TrendingUp, color: "emerald" },
    ncs: { key: "ncs", label: "NCs por Processo", icon: BarChart3, color: "rose" },
    types: { key: "types", label: "Auditorias por Tipo", icon: PieChartIcon, color: "blue" },
    standards: { key: "standards", label: "Conformidade por Norma", icon: Target, color: "amber" },
};

export function AuditDashboardCharts({
    trendData,
    ncsByProcess,
    auditsByType,
    complianceByStandard,
}: AuditDashboardChartsProps) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [showFilters, setShowFilters] = useState(false);
    const [visibleCharts, setVisibleCharts] = useState<Record<string, boolean>>({
        trend: true,
        ncs: true,
        types: true,
        standards: true,
    });

    const toggleChart = (key: string) => {
        setVisibleCharts((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const visibleCount = Object.values(visibleCharts).filter(Boolean).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass border-none shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                        <Filter className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Controlos do Dashboard</p>
                        <p className="text-[10px] text-slate-500">{visibleCount} de 4 gráficos visíveis</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Year Selector */}
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[120px] glass border-slate-800 text-sm">
                            <Calendar className="h-3 w-3 mr-2 text-slate-400" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass border-slate-800">
                            {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Toggle Visibility Panel */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="border-slate-800 text-slate-300"
                    >
                        <Settings2 className="h-4 w-4 mr-2" />
                        Métricas
                        {showFilters ? <ChevronUp className="h-3 w-3 ml-2" /> : <ChevronDown className="h-3 w-3 ml-2" />}
                    </Button>
                </div>
            </div>

            {/* Visibility Toggles Panel */}
            {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl glass border-none shadow-md animate-in slide-in-from-top-2 duration-300">
                    {Object.entries(CHART_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        const isVisible = visibleCharts[key];
                        return (
                            <button
                                key={key}
                                onClick={() => toggleChart(key)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                    isVisible
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                        : "bg-slate-900/50 border-slate-800 text-slate-500 opacity-60"
                                )}
                            >
                                {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                <Icon className="h-4 w-4" />
                                <span className="text-xs font-medium truncate">{config.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart - Full Width */}
                {visibleCharts.trend && (
                    <ChartCard
                        title="Evolução da Taxa de Conformidade"
                        subtitle="Tendência mensal de conformidade"
                        icon={TrendingUp}
                        iconColor="text-emerald-400"
                        iconBg="bg-emerald-500/10"
                        className="lg:col-span-2"
                        chartHeight={280}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="monthName" stroke="#64748b" fontSize={11} />
                                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#0f172a",
                                        border: "1px solid #334155",
                                        borderRadius: "12px",
                                        boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.5)",
                                    }}
                                    labelStyle={{ color: "#e2e8f0", fontWeight: "bold" }}
                                    formatter={(value) => [`${value ?? 0}%`, "Conformidade"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="complianceRate"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fill="url(#complianceGradient)"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="complianceRate"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: "#0f172a" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                )}

                {/* NCs by Process (Pareto) */}
                {visibleCharts.ncs && (
                    <ChartCard
                        title="Não Conformidades por Processo"
                        subtitle="Análise Pareto das áreas críticas"
                        icon={BarChart3}
                        iconColor="text-rose-400"
                        iconBg="bg-rose-500/10"
                        chartHeight={280}
                        isEmpty={ncsByProcess.length === 0}
                        emptyMessage="Sem não conformidades registadas"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ncsByProcess} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" stroke="#64748b" fontSize={11} />
                                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#0f172a",
                                        border: "1px solid #334155",
                                        borderRadius: "12px",
                                    }}
                                    labelStyle={{ color: "#e2e8f0" }}
                                />
                                <Bar dataKey="count" fill="#f43f5e" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                )}

                {/* Audits by Type (Pie) */}
                {visibleCharts.types && (
                    <ChartCard
                        title="Auditorias por Tipo"
                        subtitle="Distribuição por categoria"
                        icon={PieChartIcon}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                        chartHeight={280}
                        isEmpty={auditsByType.length === 0}
                        emptyMessage="Sem auditorias registadas"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={auditsByType}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={4}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    labelLine={{ stroke: "#64748b" }}
                                >
                                    {auditsByType.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#0f172a",
                                        border: "1px solid #334155",
                                        borderRadius: "12px",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                )}

                {/* Compliance by Standard - Full Width */}
                {visibleCharts.standards && (
                    <ChartCard
                        title="Conformidade por Norma/Certificação"
                        subtitle="Comparativo de desempenho"
                        icon={Target}
                        iconColor="text-amber-400"
                        iconBg="bg-amber-500/10"
                        className="lg:col-span-2"
                        chartHeight={220}
                        isEmpty={complianceByStandard.length === 0}
                        emptyMessage="Nenhuma norma associada às auditorias"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={complianceByStandard} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="standard" stroke="#64748b" fontSize={11} />
                                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#0f172a",
                                        border: "1px solid #334155",
                                        borderRadius: "12px",
                                    }}
                                    labelStyle={{ color: "#e2e8f0" }}
                                    formatter={(value) => [`${value ?? 0}%`, "Conformidade"]}
                                />
                                <Bar dataKey="complianceRate" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                )}
            </div>
        </div>
    );
}

interface ChartCardProps {
    title: string;
    subtitle?: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    className?: string;
    chartHeight: number;
    isEmpty?: boolean;
    emptyMessage?: string;
    children: React.ReactNode;
}

function ChartCard({
    title,
    subtitle,
    icon: Icon,
    iconColor,
    iconBg,
    className,
    chartHeight,
    isEmpty,
    emptyMessage,
    children,
}: ChartCardProps) {
    return (
        <Card className={cn("glass border-none shadow-xl hover:shadow-2xl transition-all duration-300", className)}>
            <CardHeader className="pb-3 border-b border-slate-800/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl", iconBg)}>
                            <Icon className={cn("h-4 w-4", iconColor)} />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold text-slate-200">{title}</CardTitle>
                            {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div style={{ height: chartHeight }}>
                    {isEmpty ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 italic gap-3">
                            <div className={cn("p-4 rounded-2xl", iconBg, "opacity-50")}>
                                <Icon className={cn("h-8 w-8", iconColor, "opacity-50")} />
                            </div>
                            <p className="text-sm">{emptyMessage}</p>
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
