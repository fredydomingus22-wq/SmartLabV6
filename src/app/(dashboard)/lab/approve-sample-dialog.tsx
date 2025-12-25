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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { approveSampleWithPasswordAction } from "@/app/actions/lab";

interface ApproveSampleDialogProps {
    sample: {
        id: string;
        code: string;
    };
    action: "approve" | "reject";
}

export function ApproveSampleDialog({ sample, action }: ApproveSampleDialogProps) {
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [reason, setReason] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!password) {
            toast.error("Password required for electronic signature");
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.set("sample_id", sample.id);
            formData.set("status", action === "approve" ? "approved" : "rejected");
            formData.set("password", password);
            if (reason) formData.set("reason", reason);

            const result = await approveSampleWithPasswordAction(formData);

            if (result.success) {
                toast.success(result.message);
                setOpen(false);
                setPassword("");
                setReason("");
                router.refresh();
            } else {
                toast.error(result.message);
            }
        });
    };

    const isApprove = action === "approve";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant={isApprove ? "default" : "destructive"}
                    className={isApprove ? "bg-green-600 hover:bg-green-700" : ""}
                >
                    {isApprove ? (
                        <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                        </>
                    ) : (
                        <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className={`h-5 w-5 ${isApprove ? "text-green-500" : "text-red-500"}`} />
                        {isApprove ? "Approve Sample" : "Reject Sample"}
                    </DialogTitle>
                    <DialogDescription>
                        Sample: <strong>{sample.code}</strong>
                        <br />
                        Enter your password to confirm this action (21 CFR Part 11).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {!isApprove && (
                        <div className="grid gap-2">
                            <Label htmlFor="reason">Reason for Rejection</Label>
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Explain why this sample is being rejected..."
                                rows={3}
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            variant={isApprove ? "default" : "destructive"}
                            className={isApprove ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isApprove ? "Approve" : "Reject"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
