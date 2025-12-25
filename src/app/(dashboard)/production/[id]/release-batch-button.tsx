"use client";

import { Button } from "@/components/ui/button";
import { CheckCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { releaseBatchAction } from "@/app/actions/production";
import { useRouter } from "next/navigation";

interface ReleaseBatchButtonProps {
    batchId: string;
    status: string;
}

export function ReleaseBatchButton({ batchId, status }: ReleaseBatchButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    if (status === "closed") return null;

    const handleRelease = async () => {
        if (!confirm("Are you sure you want to release this batch? This will close all operations and validate all intermediate approvals.")) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("batch_id", batchId);

        const result = await releaseBatchAction(formData);

        if (result.success) {
            toast.success(result.message);
            router.refresh();
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    return (
        <Button
            onClick={handleRelease}
            disabled={loading}
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50"
        >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
            Release Batch
        </Button>
    );
}
