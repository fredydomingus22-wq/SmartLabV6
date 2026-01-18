"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface ReagentComboboxProps {
    reagents: { id: string; name: string; unit: string }[]
    name?: string
    required?: boolean
}

export function ReagentCombobox({ reagents, name = "reagent_id", required = false }: ReagentComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")

    return (
        <>
            <input type="hidden" name={name} value={value} required={required} />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between bg-slate-900/50 border-slate-800 hover:bg-slate-900 transition-all rounded-xl h-11 text-slate-200"
                    >
                        {value
                            ? (() => {
                                const r = reagents.find((reagent) => reagent.id === value)
                                return r ? `${r.name} (${r.unit})` : "Selecione a entidade..."
                            })()
                            : "Selecione a entidade..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 stroke-[1.5px]" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-slate-800 bg-slate-950 shadow-2xl">
                    <Command className="bg-transparent">
                        <CommandInput placeholder="Procurar reagente/consumível..." className="h-11 border-none focus:ring-0 text-[11px] font-bold uppercase tracking-widest text-white placeholder:text-slate-600" />
                        <CommandList className="max-h-[300px]">
                            <CommandEmpty className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-600 italic">Nenhum registo encontrado.</CommandEmpty>
                            <CommandGroup>
                                {reagents.map((reagent) => (
                                    <CommandItem
                                        key={reagent.id}
                                        value={reagent.name}
                                        onSelect={() => {
                                            setValue(reagent.id)
                                            setOpen(false)
                                        }}
                                        className="py-3 px-4 aria-selected:bg-blue-600/20 aria-selected:text-blue-400 transition-colors cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 stroke-[2px]",
                                                value === reagent.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black uppercase tracking-tight italic">{reagent.name}</span>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Unidade: {reagent.unit}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </>
    )
}
