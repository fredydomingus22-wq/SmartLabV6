"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { ClientOnly } from "@/components/client-only"

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

interface Option {
    label: string;
    value: string;
}

interface SearchableSelectProps {
    options: Option[];
    placeholder?: string;
    emptyMessage?: string;
    name?: string; // For form submission
    defaultValue?: string;
    className?: string;
    required?: boolean;
    onValueChange?: (value: string) => void;
    value?: string;
    disabled?: boolean;
}

export function SearchableSelect({
    options,
    placeholder = "Select...",
    emptyMessage = "No item found.",
    name,
    defaultValue = "",
    className,
    required = false,
    onValueChange,
    value: controlledValue,
    disabled = false
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(defaultValue)

    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;

    const handleSelect = (currentValue: string) => {
        // currentValue is now the ID (option.value)
        const newValue = currentValue;

        if (!isControlled) {
            setInternalValue(newValue);
        }
        if (onValueChange) {
            onValueChange(newValue);
        }
        setOpen(false)
    }

    return (
        <ClientOnly>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
                        disabled={disabled}
                    >
                        {value
                            ? options.find((option) => option.value === value)?.label
                            : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
                        <CommandList>
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value} // Use ID as value for definitive mapping
                                        onSelect={() => handleSelect(option.value)}
                                        keywords={[option.label]} // Still allow searching by label
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {option.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
                {name && <input type="hidden" name={name} value={value} required={required} />}
            </Popover>
        </ClientOnly>
    )
}

