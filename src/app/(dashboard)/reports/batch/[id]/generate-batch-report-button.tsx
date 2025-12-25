"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { generateBatchReportAction } from "@/app/actions/reports";
import { toast } from "sonner";

interface GenerateBatchReportButtonProps {
    batchId: string;
    batchNumber: string;
}

export function GenerateBatchReportButton({ batchId, batchNumber }: GenerateBatchReportButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleGenerate = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.set("batch_id", batchId);

            const result = await generateBatchReportAction(formData);

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
            Generate Report
        </Button>
    );
}
