"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Globe, Box } from "lucide-react";
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

interface Product {
    id: string;
    name: string;
    sku: string;
    status: string;
}

const GLOBAL_SPECS_ID = "global";

interface ProductSelectorProps {
    products: Product[];
    selectedProductId?: string;
}

export function ProductSelector({ products, selectedProductId }: ProductSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    const currentProduct = React.useMemo(() => {
        if (selectedProductId === GLOBAL_SPECS_ID) {
            return { id: GLOBAL_SPECS_ID, name: "Global / Monitorização" };
        }
        return products.find((p) => p.id === selectedProductId);
    }, [selectedProductId, products]);

    const handleSelect = (productId: string) => {
        setOpen(false);
        router.push(`/quality/specifications?product=${productId}`);
    };

    const isGlobal = selectedProductId === GLOBAL_SPECS_ID;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-11 bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700 rounded-xl text-left font-medium"
                >
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-1.5 rounded-lg",
                            isGlobal ? "bg-emerald-500/10" : "bg-blue-500/10"
                        )}>
                            {isGlobal ? (
                                <Globe className="h-4 w-4 text-emerald-400" />
                            ) : (
                                <Box className="h-4 w-4 text-blue-400" />
                            )}
                        </div>
                        <span className={cn(
                            "text-sm",
                            currentProduct ? "text-white" : "text-slate-500"
                        )}>
                            {currentProduct
                                ? (isGlobal ? "Global / Monitorização" : `${currentProduct.name} [${(currentProduct as Product).sku}]`)
                                : "Selecione o alvo das especificações..."}
                        </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-500" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-slate-950 border-slate-800 rounded-xl shadow-2xl" align="start">
                <Command className="bg-transparent">
                    <CommandInput
                        placeholder="Pesquisar produto ou SKU..."
                        className="h-10 text-sm border-0 focus:ring-0"
                    />
                    <CommandList className="max-h-[280px]">
                        <CommandEmpty className="py-4 text-center text-slate-500 text-sm">
                            Nenhum produto encontrado.
                        </CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value={GLOBAL_SPECS_ID}
                                onSelect={() => handleSelect(GLOBAL_SPECS_ID)}
                                className="py-2.5 cursor-pointer"
                            >
                                <Globe className="mr-2 h-4 w-4 text-emerald-400" />
                                <span className="text-emerald-400 font-medium">Global / Monitorização</span>
                                <Check
                                    className={cn(
                                        "ml-auto h-4 w-4 text-emerald-400",
                                        selectedProductId === GLOBAL_SPECS_ID ? "opacity-100" : "opacity-0"
                                    )}
                                />
                            </CommandItem>
                            <div className="h-px bg-slate-800 my-1" />
                            {products.map((product) => (
                                <CommandItem
                                    key={product.id}
                                    value={`${product.name} ${product.sku}`}
                                    onSelect={() => handleSelect(product.id)}
                                    className="py-2.5 cursor-pointer"
                                >
                                    <Box className="mr-2 h-4 w-4 text-blue-400" />
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">{product.name}</span>
                                        <span className="text-slate-500 text-xs font-mono">SKU: {product.sku}</span>
                                    </div>
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4 text-blue-400",
                                            selectedProductId === product.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
