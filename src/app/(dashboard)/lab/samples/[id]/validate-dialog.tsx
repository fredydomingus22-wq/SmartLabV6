"use client";

import { useState } from "react";
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
import { Loader2, CheckCircle } from "lucide-react";
import { validateSampleAction } from "@/app/actions/lab";

interface ValidateDialogProps {
    sampleId: string;
    sampleCode: string;
}

export function ValidateDialog({ sampleId, sampleCode }: ValidateDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleValidate = async () => {
        setLoading(true);
        const result = await validateSampleAction(sampleId);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validate Sample
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Validate Sample Results</DialogTitle>
                    <DialogDescription>
                        You are about to validate all results for sample <strong>{sampleCode}</strong>.
                        This action confirms that you have verified all analysis results.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Technician Confirmation</h4>
                    <p className="text-sm text-yellow-700">
                        By validating, you confirm that:
                    </p>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                        <li>All results have been entered correctly</li>
                        <li>Analysis methods were followed properly</li>
                        <li>Equipment was calibrated and functioning</li>
                    </ul>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleValidate}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Validation
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
