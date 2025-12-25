"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { useState, useEffect } from "react"; // Added useEffect
import { updateUser } from "@/app/actions/users";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    role: z.string().min(1, "Role is required"),
    employee_id: z.string().optional(),
});

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: any | null; // Pass user for editing
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            full_name: "",
            role: "technician", // Default
            employee_id: "",
        },
    });

    // Reset form values when user changes, effectively functioning as useEffect
    useEffect(() => {
        if (user) {
            form.reset({
                full_name: user.full_name || "",
                role: user.role || "technician",
                employee_id: user.employee_id || "",
            });
        } else {
            form.reset({
                full_name: "",
                role: "technician", // Default
                employee_id: "",
            });
        }
    }, [user, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user) return; // Edit mode only for now

        setLoading(true);
        const formData = new FormData();
        formData.append("full_name", values.full_name);
        formData.append("role", values.role);
        if (values.employee_id) formData.append("employee_id", values.employee_id);

        const result = await updateUser(user.id, formData);

        if (result.success) {
            toast.success("User updated successfully");
            onOpenChange(false);
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] glass">
                <DialogHeader>
                    <DialogTitle>{user ? "Edit User" : "User Details"}</DialogTitle>
                    <DialogDescription>
                        Make changes to the user profile here.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="employee_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Employee ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="EMP-001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <FormControl>
                                        <SearchableSelect
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            options={[
                                                { value: "admin", label: "Administrator" },
                                                { value: "manager", label: "Manager" },
                                                { value: "technician", label: "Technician" },
                                                { value: "viewer", label: "Viewer" },
                                            ]}
                                            placeholder="Select a role"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
