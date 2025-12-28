"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface Shift {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
}

interface ShiftSelectorProps {
    currentDate: string;
    currentShiftId?: string;
    availableShifts: Shift[];
}

export function ShiftSelector({ currentDate, currentShiftId, availableShifts }: ShiftSelectorProps) {
    const router = useRouter();

    const handleChange = (date?: string, shiftId?: string) => {
        const newDate = date || currentDate;
        const newShiftId = shiftId || currentShiftId;
        router.push(`/reports/shift?date=${newDate}&shift=${newShiftId}`);
    };

    return (
        <div className="flex flex-wrap items-center gap-4 print:hidden">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Data:</label>
                <input
                    type="date"
                    value={currentDate}
                    onChange={(e) => handleChange(e.target.value)}
                    className="p-2 border rounded-lg bg-background"
                />
            </div>

            <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Turno:</label>
                <div className="flex gap-1 flex-wrap">
                    {availableShifts.map((shift) => (
                        <Button
                            key={shift.id}
                            variant={currentShiftId === shift.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleChange(undefined, shift.id)}
                            className="gap-1"
                        >
                            <Clock className="h-4 w-4" />
                            {shift.name} ({shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)})
                        </Button>
                    ))}
                    {availableShifts.length === 0 && (
                        <span className="text-sm text-muted-foreground p-2 border border-dashed rounded bg-muted/50">
                            Nenhum turno configurado
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
