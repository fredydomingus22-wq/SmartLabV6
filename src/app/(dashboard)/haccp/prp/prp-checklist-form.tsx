"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Check,
    X,
    AlertTriangle,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { submitPRPChecklistAction } from "@/app/actions/haccp";
import { toast } from "sonner";

interface PRPItem {
    id: string;
    item_text: string;
    item_type: string;
    is_required: boolean;
}

interface PRPChecklistFormProps {
    template: { id: string; name: string };
    items: PRPItem[];
}

export function PRPChecklistForm({ template, items }: PRPChecklistFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [answers, setAnswers] = useState<Record<string, { value: string; observation: string }>>(
        items.reduce((acc, item) => ({
            ...acc,
            [item.id]: { value: "", observation: "" }
        }), {})
    );

    const handleValueChange = (itemId: string, value: string) => {
        setAnswers(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], value }
        }));
    };

    const handleObservationChange = (itemId: string, observation: string) => {
        setAnswers(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], observation }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        const missing = items.filter(i => i.is_required && !answers[i.id].value);
        if (missing.length > 0) {
            toast.error(`Please complete all required items: ${missing.length} remaining.`);
            return;
        }

        setLoading(true);
        const formattedAnswers = Object.entries(answers).map(([itemId, data]) => ({
            itemId,
            value: data.value,
            observation: data.observation
        }));

        const res = await submitPRPChecklistAction(template.id, formattedAnswers);

        if (res.success) {
            toast.success("Checklist submitted successfully!");
            router.push("/haccp/prp");
            router.refresh();
        } else {
            toast.error(res.message);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
            <Card className="glass border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        {template.name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    {items.map((item, index) => (
                        <div key={item.id} className="space-y-4 border-b pb-6 last:border-0">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                    <Label className="text-base font-semibold">
                                        {index + 1}. {item.item_text}
                                        {item.is_required && <span className="text-destructive ml-1">*</span>}
                                    </Label>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        type="button"
                                        variant={answers[item.id].value === "PASS" ? "default" : "outline"}
                                        className={answers[item.id].value === "PASS" ? "bg-green-600 hover:bg-green-700" : ""}
                                        onClick={() => handleValueChange(item.id, "PASS")}
                                    >
                                        <Check className="h-4 w-4 mr-1" />
                                        Pass
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={answers[item.id].value === "FAIL" ? "destructive" : "outline"}
                                        onClick={() => handleValueChange(item.id, "FAIL")}
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Fail
                                    </Button>
                                </div>
                            </div>

                            <div className="pl-4 border-l-2 border-muted transition-all focus-within:border-primary">
                                <Textarea
                                    placeholder="Add observations or non-conformity details..."
                                    className="resize-none h-20 bg-transparent border-none focus-visible:ring-0 p-0"
                                    value={answers[item.id].observation}
                                    onChange={(e) => handleObservationChange(item.id, e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="px-8 font-bold">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Finalize Checklist
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}

// Internal icon for internal use only since ClipboardCheck isn't in scope for the client component until build
function ClipboardCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="m9 14 2 2 4-4" />
        </svg>
    )
}
