"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifySignature } from "@/app/actions/quality/training-authoring";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

interface ESignatureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVerified: () => void;
    actionName: string; // e.g. "Training Completion"
}

export function ESignatureModal({ open, onOpenChange, onVerified, actionName }: ESignatureModalProps) {
    const [password, setPassword] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSign = () => {
        if (!password) {
            toast.error("Password is required for electronic signature.");
            return;
        }

        startTransition(async () => {
            const result = await verifySignature(password);

            if (result.error) {
                toast.error(result.error);
                setPassword(""); // Clear for security
            } else {
                toast.success("Signature Verified");
                onVerified(); // Proceed with parent action
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] bg-black/90 border-white/10 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-emerald-400">
                        <ShieldCheck className="w-5 h-5" /> Electronic Signature
                    </DialogTitle>
                    <DialogDescription>
                        21 CFR Part 11 Compliance Check
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="p-3 bg-white/5 rounded-lg text-sm text-muted-foreground">
                        <p><strong>Meaning of Signature:</strong></p>
                        <p>I certify that I have read and understood the content of <strong>{actionName}</strong>.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Re-enter Password</Label>
                        <Input
                            type="password"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-white/5 border-white/10"
                        />
                    </div>

                    <Button
                        onClick={handleSign}
                        disabled={isPending}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                        {isPending ? "Verifying..." : "Sign & Complete"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
