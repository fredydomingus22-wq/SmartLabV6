"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface LogoutButtonProps {
    variant?: "default" | "menu";
}

export function LogoutButton({ variant = "default" }: LogoutButtonProps) {
    if (variant === "menu") {
        return (
            <form action={logoutAction} className="w-full">
                <DropdownMenuItem
                    asChild
                    className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                >
                    <button type="submit" className="w-full flex items-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair do Sistema</span>
                    </button>
                </DropdownMenuItem>
            </form>
        );
    }

    return (
        <form action={logoutAction}>
            <Button type="submit" variant="outline" className="w-full justify-start gap-3 border-slate-700 text-slate-300 hover:text-slate-100 hover:bg-slate-900 shadow-sm font-semibold">
                <LogOut className="h-4 w-4" />
                Terminar Sessão
            </Button>
        </form>
    );
}

