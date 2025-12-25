"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Microscope, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { PointDialog } from "@/app/(dashboard)/quality/environmental/_components/point-dialog";
import Link from "next/link";

interface SamplingPointRowProps {
    point: any;
}

export function SamplingPointRow({ point }: SamplingPointRowProps) {
    const isOverdue = false; // logic would go here: check last_swabbed_at vs frequency

    return (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-full">
                    <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                    <h4 className="text-sm font-medium">{point.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                            Frequência: {point.frequency}
                        </span>
                        <span className="text-muted-foreground mx-1 text-xs">•</span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                            Última Amostra: {point.last_swabbed_at ? formatDistanceToNow(new Date(point.last_swabbed_at), { addSuffix: true, locale: pt }) : "Nunca"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Quick Link to Micro Module for registration */}
                <Link href={`/micro/samples/new?sampling_point_id=${point.id}&name=${encodeURIComponent(point.name)}`}>
                    <Button variant="outline" size="sm" className="h-8 gap-2 border-blue-500/50 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Microscope className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Registar Zaragatoa</span>
                    </Button>
                </Link>

                <PointDialog mode="edit" point={point} />
            </div>
        </div>
    );
}
