"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

// Generic Result Type for Actions
interface ActionResult {
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
}

interface ActionFormProps {
    action: (formData: FormData) => Promise<ActionResult>;
    children: ReactNode;
    submitText?: string;
    onSuccess?: (data: any) => void;
    className?: string;
    showFooter?: boolean;
}

export function ActionForm({
    action,
    children,
    submitText = "Save",
    onSuccess,
    className,
    showFooter = true,
}: ActionFormProps) {
    const [state, formAction, isPending] = useActionState(async (_prev: any, formData: FormData) => {
        const result = await action(formData);
        if (result.success) {
            toast.success(result.message || "Operation successful");
            onSuccess?.(result.data);
        } else {
            toast.error(result.message || result.error || "Something went wrong");
        }
        return result;
    }, null);

    return (
        <form action={formAction} className={className}>
            <div className="space-y-4">
                {children}
            </div>

            {showFooter && (
                <div className="mt-6 flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitText}
                    </Button>
                </div>
            )}
        </form>
    );
}

