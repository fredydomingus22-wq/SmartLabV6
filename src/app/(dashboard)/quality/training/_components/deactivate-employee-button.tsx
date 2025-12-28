"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserMinus, Loader2 } from "lucide-react";
import { deactivateEmployeeAction } from "@/app/actions/training";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeactivateEmployeeButtonProps {
    employeeId: string;
    employeeName: string;
}

export function DeactivateEmployeeButton({ employeeId, employeeName }: DeactivateEmployeeButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDeactivate = async () => {
        setLoading(true);
        const result = await deactivateEmployeeAction(employeeId);
        if (result.success) {
            toast.success(result.message);
            router.push("/quality/training");
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                    <UserMinus className="mr-2 h-4 w-4" />
                    Desativar Funcionário
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass border-slate-800">
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Desativação</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem a certeza que deseja desativar <strong>{employeeName}</strong>?
                        Este colaborador deixará de aparecer nas listas de assiduidade e equipas ativas.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-800 border-none">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDeactivate();
                        }}
                        disabled={loading}
                        className="bg-rose-600 hover:bg-rose-500 text-white"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Confirmar Desativação
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
