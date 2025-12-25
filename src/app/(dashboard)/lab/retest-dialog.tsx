"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { requestRetestAction } from "@/app/actions/lab";

interface RetestDialogProps {
    resultId: string;
    parameterName: string;
    sampleCode: string;
    currentValue: number | string;
    isConforming: boolean;
}

export function RetestDialog({
    resultId,
    parameterName,
    sampleCode,
    currentValue,
    isConforming
}: RetestDialogProps) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (reason.length < 5) {
            toast.error("Reason must be at least 5 characters");
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.set("original_result_id", resultId);
            formData.set("reason", reason);

            const result = await requestRetestAction(formData);

            if (result.success) {
                toast.success(result.message);
                setOpen(false);
                setReason("");
                router.refresh();
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant={isConforming ? "outline" : "destructive"}
                    className="gap-1"
                >
                    <RefreshCw className="h-3 w-3" />
                    Retest
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-orange-500" />
                        Request Retest
                    </DialogTitle>
                    <DialogDescription>
                        This will invalidate the current result and allow re-analysis.
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg bg-muted/50 p-4 mb-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-muted-foreground">Sample:</span>
                            <p className="font-medium">{sampleCode}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Parameter:</span>
                            <p className="font-medium">{parameterName}</p>
                        </div>
                        <div className="col-span-2">
                            <span className="text-muted-foreground">Current Value:</span>
                            <p className={`font-medium ${!isConforming ? 'text-red-500' : ''}`}>
                                {currentValue}
                                {!isConforming && (
                                    <span className="inline-flex items-center gap-1 ml-2">
                                        <AlertTriangle className="h-3 w-3" />
                                        Non-conforming
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="reason">Reason for Retest *</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Suspected sample contamination, equipment malfunction..."
                            rows={3}
                            required
                            minLength={5}
                        />
                        <p className="text-xs text-muted-foreground">
                            Minimum 5 characters. This will be recorded in the audit trail.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending || reason.length < 5}
                            variant="destructive"
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Invalidate & Request Retest
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
