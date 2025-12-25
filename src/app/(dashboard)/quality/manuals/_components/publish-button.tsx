"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { publishDocumentVersionAction } from "@/app/actions/dms";
import { toast } from "sonner";

interface PublishButtonProps {
    versionId: string;
}

export function PublishButton({ versionId }: PublishButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handlePublish = () => {
        startTransition(async () => {
            const result = await publishDocumentVersionAction(versionId);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <Button
            onClick={handlePublish}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
        >
            {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Publicar Versão
        </Button>
    );
}
