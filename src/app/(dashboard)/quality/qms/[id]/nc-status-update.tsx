"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";
import { updateNCStatusAction } from "@/app/actions/qms";
import { toast } from "sonner";

interface NCStatusUpdateProps {
    ncId: string;
    currentStatus: string;
}

const statuses = [
    { value: "open", label: "Aberta" },
    { value: "under_investigation", label: "Em Investigação" },
    { value: "containment", label: "Contenção" },
    { value: "corrective_action", label: "Ação Corretiva" },
    { value: "verification", label: "Verificação" },
    { value: "closed", label: "Fechada" },
];


export function NCStatusUpdate({ ncId, currentStatus }: NCStatusUpdateProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleStatusChange = (newStatus: string) => {
        const formData = new FormData();
        formData.set("id", ncId);
        formData.set("status", newStatus);

        startTransition(async () => {
            const result = await updateNCStatusAction(formData);
            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isPending} className="glass">
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Atualizar Status
                    <ChevronDown className="h-4 w-4 ml-2" />
                </Button>

            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-slate-800">
                <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                {statuses.map((status) => (
                    <DropdownMenuItem
                        key={status.value}
                        onClick={() => handleStatusChange(status.value)}
                        disabled={status.value === currentStatus}
                        className={status.value === currentStatus ? "font-bold bg-muted/50" : "hover:bg-slate-800/50 cursor-pointer"}
                    >
                        {status.label}
                        {status.value === currentStatus && " (atual)"}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>

        </DropdownMenu>
    );
}
