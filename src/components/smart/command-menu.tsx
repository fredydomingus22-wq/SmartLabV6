"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Settings,
    Search,
    LayoutDashboard,
    Package,
    Beaker,
} from "lucide-react";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { menuItems } from "@/config/navigation";
import { globalSearchAction } from "@/app/actions/search";

interface CommandMenuProps {
    user: {
        role: string;
    };
}

export function CommandMenu({ user }: CommandMenuProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [results, setResults] = React.useState<{ samples: any[]; batches: any[] }>({
        samples: [],
        batches: [],
    });
    const [loading, setLoading] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    React.useEffect(() => {
        if (!search || search.length < 2) {
            setResults({ samples: [], batches: [] });
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            const res = await globalSearchAction(search);
            if (res.success && res.data) {
                setResults(res.data);
            }
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    // Flatten menu items for easy access, filtering by role
    const accessibleItems = menuItems.flatMap((item) => {
        if (item.allowedRoles && !item.allowedRoles.includes(user.role)) return [];

        const items = [];
        if (item.href) {
            items.push({ label: item.label, href: item.href, icon: item.icon });
        }

        if (item.children) {
            item.children.forEach((child) => {
                items.push({ label: `${item.label} > ${child.label}`, href: child.href, icon: item.icon });
            });
        }

        return items;
    });

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Digite para pesquisar amostras, lotes ou comandos..."
                value={search}
                onValueChange={setSearch}
            />
            <CommandList className="glass">
                <CommandEmpty>
                    {loading ? "A pesquisar..." : "Nenhum resultado encontrado."}
                </CommandEmpty>

                {results.samples.length > 0 && (
                    <CommandGroup heading="Amostras">
                        {results.samples.map((s: any) => (
                            <CommandItem
                                key={s.id}
                                onSelect={() => runCommand(() => router.push(`/lab/samples/${s.id}`))}
                            >
                                <Beaker className="mr-2 h-4 w-4 text-blue-400" />
                                <span>{s.code}</span>
                                <span className="ml-2 text-xs text-muted-foreground">({s.sample_type?.name})</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {results.batches.length > 0 && (
                    <CommandGroup heading="Lotes de Produção">
                        {results.batches.map((b: any) => (
                            <CommandItem
                                key={b.id}
                                onSelect={() => runCommand(() => router.push(`/production/${b.id}`))}
                            >
                                <Package className="mr-2 h-4 w-4 text-emerald-400" />
                                <span>{b.batch_code}</span>
                                <span className="ml-2 text-xs text-muted-foreground">({b.product?.name})</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                <CommandGroup heading="Atalhos de Navegação">
                    <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Ir para Dashboard</span>
                    </CommandItem>
                    {accessibleItems.map((item: any) => (
                        <CommandItem
                            key={item.href}
                            onSelect={() => runCommand(() => router.push(item.href))}
                        >
                            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                            <span>{item.label}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Configurações">
                    <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Minhas Configurações</span>
                        <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
