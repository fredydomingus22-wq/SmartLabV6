"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Factory, Box, Truck, ArrowDown, User, Calendar, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeProps {
    title: string;
    subtitle?: string;
    status?: string;
    icon: React.ReactNode;
    details?: { label: string; value: string | number }[];
    highlight?: boolean;
    className?: string;
}

const TraceNode = ({ title, subtitle, status, icon, details, highlight, className }: NodeProps) => (
    <div className={cn("relative flex flex-col items-center", className)}>
        <div className={cn(
            "z-10 w-full max-w-sm rounded-xl border p-4 transition-all duration-300",
            highlight
                ? "bg-primary/10 border-primary shadow-lg shadow-primary/20 scale-105"
                : "bg-background/60 backdrop-blur-md border-border hover:border-primary/50"
        )}>
            <div className="flex items-start gap-3">
                <div className={cn(
                    "p-2 rounded-lg",
                    highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold truncate text-sm">{title}</h3>
                        {status && <Badge variant={highlight ? "default" : "secondary"} className="text-[10px] h-4 uppercase">{status}</Badge>}
                    </div>
                    {subtitle && <p className="text-xs text-muted-foreground truncate italic">{subtitle}</p>}

                    {details && details.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/50 pt-2">
                            {details.map((d, i) => (
                                <div key={i} className="flex flex-col">
                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{d.label}</span>
                                    <span className="text-xs font-medium truncate">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
);

const Connector = ({ className }: { className?: string }) => (
    <div className={cn("flex flex-col items-center py-2 h-16", className)}>
        <div className="w-px h-full bg-gradient-to-b from-primary/50 via-primary to-transparent" />
        <ArrowDown className="h-4 w-4 -mt-2 text-primary animate-bounce-slow" />
    </div>
);

interface TraceabilityGraphProps {
    batch: any;
    intermediates: any[];
    materials: any[];
    type: "backward" | "forward";
}

export function TraceabilityGraph({ batch, intermediates, materials, type }: TraceabilityGraphProps) {
    if (type === "backward") {
        return (
            <div className="flex flex-col items-center space-y-0 py-8">
                {/* Level 1: Final Product / Batch */}
                <TraceNode
                    title={batch.code}
                    subtitle={batch.product?.name}
                    status={batch.status}
                    icon={<Factory className="h-5 w-5" />}
                    highlight
                    details={[
                        { label: "Data Início", value: batch.start_date || "N/A" },
                        { label: "Linha", value: batch.production_line?.name || "N/A" }
                    ]}
                />

                <Connector />

                {/* Level 2: Intermediates (Tanks) */}
                <div className="w-full flex justify-center flex-wrap gap-8 items-start relative px-10">
                    {/* SVG Connections for Intermediates would go here for multi-node fans, 
                        but for simplicity and clean UI, we stack them or link centrally */}
                    {intermediates.map((int) => (
                        <div key={int.id} className="flex flex-col items-center">
                            <TraceNode
                                title={int.code}
                                subtitle="Produto Intermédio"
                                status={int.status}
                                icon={<Box className="h-5 w-5 text-blue-400" />}
                                details={[
                                    { label: "Volume", value: `${int.volume} ${int.unit}` }
                                ]}
                            />

                            <Connector />

                            {/* Level 3: Raw Materials for this Intermediate */}
                            <div className="flex flex-col gap-4">
                                {materials
                                    .filter(m => m.usages.some((u: any) => u.intermediateCode === int.code))
                                    .map((m, idx) => (
                                        <TraceNode
                                            key={`${int.id}-${idx}`}
                                            title={m.material.name}
                                            subtitle={`Lote: ${m.lot.code}`}
                                            status={m.lot.status}
                                            icon={<Truck className="h-4 w-4 text-emerald-400" />}
                                            details={[
                                                { label: "Fornecedor", value: m.supplier?.name || "N/A" },
                                                { label: "Quant. Usada", value: `${m.usages.find((u: any) => u.intermediateCode === int.code)?.quantity} ${m.usages[0]?.unit}` }
                                            ]}
                                        />
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === "forward") {
        return (
            <div className="flex flex-col items-center space-y-0 py-8">
                {/* Level 1: Raw Material Lot */}
                <TraceNode
                    title={batch.lot_code}
                    subtitle={batch.raw_material?.name}
                    status={batch.status}
                    icon={<Truck className="h-5 w-5 text-emerald-400" />}
                    highlight
                    details={[
                        { label: "Fornecedor", value: batch.supplier?.name || "N/A" },
                        { label: "Qtd. Inicial", value: `${batch.quantity_received} ${batch.unit}` }
                    ]}
                />

                <Connector />

                {/* Level 2: Intermediates & Batches */}
                <div className="w-full flex justify-center flex-wrap gap-8 items-start relative px-10">
                    {/* In Forward Trace, 'intermediates' are the connection points */}
                    {intermediates.map((int: any) => (
                        <div key={int.id} className="flex flex-col items-center">
                            <TraceNode
                                title={int.code}
                                subtitle="Consumido em Tanque"
                                status={int.status}
                                icon={<Box className="h-5 w-5 text-blue-400" />}
                                details={[
                                    { label: "Volume", value: `${int.volume} ${int.unit}` }
                                ]}
                            />

                            <Connector />

                            {/* Level 3: Final Batches that used this intermediate */}
                            <div className="flex flex-col gap-4">
                                {batch.batches_using_this
                                    .filter((b: any) => b.intermediates.some((bi: any) => bi.code === int.code))
                                    .map((b: any, idx: number) => (
                                        <TraceNode
                                            key={`${int.id}-${idx}`}
                                            title={b.code}
                                            subtitle={b.product?.name}
                                            status={b.status}
                                            icon={<Factory className="h-4 w-4 text-primary" />}
                                            details={[
                                                { label: "Data", value: b.start_date || "N/A" },
                                                { label: "Qtd Usada", value: `${b.intermediates.find((bi: any) => bi.code === int.code)?.quantityUsed} ${int.unit}` }
                                            ]}
                                        />
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
