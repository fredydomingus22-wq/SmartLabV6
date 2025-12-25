"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, MapPin, Calendar } from "lucide-react";
import { SamplingPointRow } from "@/app/(dashboard)/quality/environmental/_components/sampling-point-row";
import { ZoneDialog } from "@/app/(dashboard)/quality/environmental/_components/zone-dialog";
import { PointDialog } from "@/app/(dashboard)/quality/environmental/_components/point-dialog";

interface ZoneCardProps {
    zone: any;
}

export function ZoneCard({ zone }: ZoneCardProps) {
    const riskColors: Record<number, string> = {
        1: "bg-red-500",
        2: "bg-orange-500",
        3: "bg-yellow-500",
        4: "bg-green-500",
    };

    return (
        <Card className="glass overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${riskColors[zone.risk_level] || "bg-slate-500"}`} />
                    <div>
                        <CardTitle>{zone.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{zone.description || "Sem descrição"}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <ZoneDialog mode="edit" zone={zone} />
                    <PointDialog mode="create" zoneId={zone.id} />
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-2">
                    {zone.sampling_points && zone.sampling_points.length > 0 ? (
                        zone.sampling_points.map((point: any) => (
                            <SamplingPointRow key={point.id} point={point} />
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4 italic">
                            Nenhum ponto de amostragem definido para esta zona.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
