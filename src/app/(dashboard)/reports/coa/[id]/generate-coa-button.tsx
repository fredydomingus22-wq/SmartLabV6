"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { generateCoAAction } from "@/app/actions/reports";
import { toast } from "sonner";

interface GenerateCoAButtonProps {
    sampleId: string;
    sampleCode: string;
}

export function GenerateCoAButton({ sampleId, sampleCode }: GenerateCoAButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleGenerate = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.set("sample_id", sampleId);

            const result = await generateCoAAction(formData);

            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <Download className="h-4 w-4 mr-2" />
            )}
            Generate CoA
        </Button>
    );
}
