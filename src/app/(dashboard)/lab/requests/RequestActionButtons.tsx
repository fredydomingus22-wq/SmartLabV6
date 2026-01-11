"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateSampleDialog } from "../create-sample-dialog";
import { FlaskConical, XCircle } from "lucide-react";
import { toast } from "sonner";

interface RequestActionButtonsProps {
    requestId: string;
    batchId?: string;
    productName?: string;
    batchCode?: string;

    // Supplementary data for Dialog
    sampleTypes?: any[];
    tanks?: any[];
    samplingPoints?: any[];
    plantId?: string;
    users?: any[];

    // Plan Context for pre-fill
    plan: {
        sample_type_id: string;
        event_anchor?: string;
    };
}

export function RequestActionButtons({
    requestId,
    batchId,
    productName,
    batchCode,
    sampleTypes,
    tanks,
    samplingPoints,
    plantId,
    users,
    plan
}: RequestActionButtonsProps) {

    const handleReject = () => {
        toast.info("Funcionalidade de rejeição ainda não implementada.");
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleReject}
                className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
            >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
            </Button>

            <div className="relative">
                <CreateSampleDialog
                    sampleTypes={sampleTypes || []}
                    tanks={tanks || []}
                    samplingPoints={samplingPoints || []}
                    plantId={plantId || ""}
                    users={users || []}
                    requestId={requestId}
                    prefilledData={{
                        sample_type_id: plan.sample_type_id,
                        production_batch_id: batchId,
                        // If we knew the intermediate product ID from the batch, we could pre-fill it too.
                        // For now user selects the tank/IP associated with the batch.
                    }}
                />
            </div>
        </div>
    );
}
