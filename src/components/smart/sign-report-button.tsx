"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenTool, Loader2, CheckCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { signReportAction } from "@/app/actions/reports";
import { toast } from "sonner";

interface SignReportButtonProps {
    reportId: string;
    reportNumber: string;
    isSigned?: boolean;
}

export function SignReportButton({ reportId, reportNumber, isSigned }: SignReportButtonProps) {
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSign = () => {
        if (!password) {
            toast.error("Password required for electronic signature");
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.set("report_id", reportId);
            formData.set("password", password);

            const result = await signReportAction(formData);

            if (result.success) {
                toast.success(result.message);
                setOpen(false);
                setPassword("");
            } else {
                toast.error(result.message);
            }
        });
    };

    if (isSigned) {
        return (
            <Button variant="outline" disabled className="text-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                Signed
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PenTool className="h-4 w-4 mr-2" />
                    Sign Report
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Electronic Signature</DialogTitle>
                    <DialogDescription>
                        Sign report {reportNumber} with your credentials.
                        This action is recorded per 21 CFR Part 11.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password to sign"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        By signing, you confirm that the information in this report is accurate
                        and complete to the best of your knowledge.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSign} disabled={isPending || !password}>
                        {isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <PenTool className="h-4 w-4 mr-2" />
                        )}
                        Sign Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
