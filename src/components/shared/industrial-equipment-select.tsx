"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Search, AlertTriangle, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

// Interface compatible with both tables
export interface Equipment {
    id: string;
    name: string;
    code: string;
    status: string; // 'active' | 'maintenance' | 'calibration_due'
    next_calibration_date?: string | null;
}

interface IndustrialEquipmentSelectProps {
    value?: string;
    onChange: (value: string, equipment?: Equipment) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    table?: "equipments" | "lab_assets"; // Explicit table selection
}

export function IndustrialEquipmentSelect({
    value,
    onChange,
    placeholder = "Selecione o equipamento...",
    className,
    disabled = false,
    table = "equipments" // Default to generic equipments (Production)
}: IndustrialEquipmentSelectProps) {
    const [open, setOpen] = useState(false);
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(false);

    // Explicitly derive effective table to ensure no "undefined" table is used
    const effectiveTable = table || "equipments";

    useEffect(() => {
        const fetchEquipments = async () => {
            setLoading(true);
            const supabase = createClient();

            // Query dynamically based on the table prop
            const { data, error } = await supabase
                .from(effectiveTable)
                .select('id, name, code, status, next_calibration_date')
                .eq('status', 'active') // Both tables share 'status' = 'active'
                .order('name');

            if (!error && data) {
                setEquipments(data);
            }
            setLoading(false);
        };

        fetchEquipments();
    }, [effectiveTable]);

    const selectedEquipment = equipments.find((eq) => eq.id === value);

    const getStatusColor = (status: string, nextCalDate?: string | null) => {
        if (status !== 'active') return "bg-red-500/10 text-red-500 border-red-500/20";

        // Check calibration
        if (nextCalDate) {
            const daysUntil = Math.ceil((new Date(nextCalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntil < 0) return "bg-red-500/10 text-red-500 border-red-500/20"; // Expired
            if (daysUntil < 30) return "bg-amber-500/10 text-amber-500 border-amber-500/20"; // Warning
        }

        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn("w-full justify-between bg-slate-950/50 border-slate-800 text-slate-200 hover:bg-slate-900", className)}
                >
                    {selectedEquipment ? (
                        <div className="flex items-center gap-2">
                            <MonitorSmartphone className="h-4 w-4 text-slate-500" />
                            <span className="font-bold">{selectedEquipment.code}</span>
                            <span className="text-muted-foreground hidden sm:inline">| {selectedEquipment.name}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground flex items-center gap-2">
                            <MonitorSmartphone className="h-4 w-4" /> {placeholder}
                        </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-slate-950 border-slate-800 shadow-2xl">
                <Command className="bg-transparent">
                    <CommandInput placeholder="Procurar equipamento (Nome ou Código)..." className="text-white" />
                    <CommandList>
                        <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                            Nenhum equipamento encontrado.
                        </CommandEmpty>
                        <CommandGroup heading="Equipamentos Disponíveis">
                            {equipments.map((eq) => (
                                <CommandItem
                                    key={eq.id}
                                    value={`${eq.code} ${eq.name}`}
                                    onSelect={() => {
                                        onChange(eq.id, eq);
                                        setOpen(false);
                                    }}
                                    className="flex items-center justify-between py-3 cursor-pointer aria-selected:bg-blue-600/20"
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white">{eq.code}</span>
                                            {selectedEquipment?.id === eq.id && (
                                                <Check className="h-3 w-3 text-blue-400" />
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-400">{eq.name}</span>
                                    </div>

                                    <Badge variant="outline" className={cn("text-[10px] uppercase", getStatusColor(eq.status, eq.next_calibration_date))}>
                                        {eq.status === 'active' ? 'Operacional' : eq.status}
                                    </Badge>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
