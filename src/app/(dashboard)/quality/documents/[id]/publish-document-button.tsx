
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
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Rocket, Loader2 } from "lucide-react";
import { publishDocumentVersionAction } from "@/app/actions/dms";
import { toast } from "sonner";

interface PublishDocumentButtonProps {
    versionId: string;
}

export function PublishDocumentButton({ versionId }: PublishDocumentButtonProps) {
    const [loading, setLoading] = useState(false);

    const handlePublish = async () => {
        setLoading(true);
        const result = await publishDocumentVersionAction(versionId);

        if (result.success) {
            toast.success("Documento publicado com sucesso!");
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <Rocket className="mr-2 h-4 w-4" />
                    Publicar Versão
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass border-slate-800 bg-slate-950/80 backdrop-blur-xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Publicação</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                        Esta ação tornará esta versão **Efetiva** e marcará a versão anterior como **Obsoleta**.
                        Todos os colaboradores com requisitos de formação serão notificados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-white/5 border-white/10 text-slate-300">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handlePublish}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sim, Publicar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
