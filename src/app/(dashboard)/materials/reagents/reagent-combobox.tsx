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
                        className="w-full justify-between"
                    >
                        {value
                            ? (() => {
                                const r = reagents.find((reagent) => reagent.id === value)
                                return r ? `${r.name} (${r.unit})` : "Select reagent..."
                            })()
                            : "Select reagent..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput placeholder="Search reagent..." />
                        <CommandList>
                            <CommandEmpty>Nenhum reagente encontrado.</CommandEmpty>
                            <CommandGroup>
                                {reagents.map((reagent) => (
                                    <CommandItem
                                        key={reagent.id}
                                        value={reagent.name}
                                        onSelect={(currentValue) => {
                                            // We want to store ID, but cmdk works with values (names usually).
                                            // workaround: match the name back to ID
                                            setValue(reagent.id)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === reagent.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {reagent.name} <span className="text-muted-foreground ml-1">({reagent.unit})</span>
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
