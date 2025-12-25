"use client";

import { useState } from "react";
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
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { receiveStockAction, consumeStockAction } from "@/app/actions/inventory";
import { toast } from "sonner";
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ReagentCombobox } from "./reagent-combobox";

interface StockMovementDialogProps {
    reagents: { id: string; name: string; unit: string }[];
}

export function StockMovementDialog({ reagents }: StockMovementDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleReceive(formData: FormData) {
        setLoading(true);
        const res = await receiveStockAction(formData);
        setLoading(false);
        if (res.success) {
            toast.success(res.message);
            setOpen(false);
        } else {
            toast.error(res.message);
        }
    }

    async function handleConsume(formData: FormData) {
        setLoading(true);
        const res = await consumeStockAction(formData);
        setLoading(false);
        if (res.success) {
            toast.success(res.message);
            setOpen(false);
        } else {
            toast.error(res.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Register Movement
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Stock Movement</DialogTitle>
                    <DialogDescription>
                        Register entry or exit of reagents from the inventory.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="receive" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="receive">
                            <ArrowDownLeft className="mr-2 h-4 w-4" />
                            Receive (IN)
                        </TabsTrigger>
                        <TabsTrigger value="consume">
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            Consume (OUT)
                        </TabsTrigger>
                    </TabsList>

                    {/* RECEIVE TAB */}
                    <TabsContent value="receive">
                        <form action={handleReceive} className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="reagent-in">Reagent</Label>
                                <ReagentCombobox reagents={reagents} name="reagent_id" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="quantity-in">Quantity</Label>
                                    <Input id="quantity-in" name="quantity" type="number" step="0.01" min="0" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="batch">Batch Number</Label>
                                    <Input id="batch" name="batch_number" placeholder="Optional" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="expiry">Expiry Date</Label>
                                    <Input id="expiry" name="expiry_date" type="date" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="supplier">Supplier Name</Label>
                                    <Input id="supplier" name="external_supplier" placeholder="e.g. Sigma-Aldrich" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes-in">Notes</Label>
                                <Textarea id="notes-in" name="notes" placeholder="Delivery details..." />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Registering..." : "Confirm Receipt"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    {/* CONSUME TAB */}
                    <TabsContent value="consume">
                        <form action={handleConsume} className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="reagent-out">Reagent</Label>
                                <ReagentCombobox reagents={reagents} name="reagent_id" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="quantity-out">Quantity</Label>
                                <Input id="quantity-out" name="quantity" type="number" step="0.01" min="0" required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="destination">Destination</Label>
                                    <SearchableSelect
                                        name="destination"
                                        options={[
                                            { value: "Microbiology Lab", label: "Microbiology Lab" },
                                            { value: "Physico-Chemical Lab", label: "Physico-Chemical Lab" },
                                            { value: "Production Line 01", label: "Production Line 01" },
                                            { value: "Waste Disposal", label: "Waste Disposal" },
                                            { value: "Other", label: "Other" },
                                        ]}
                                        placeholder="Select Lab/Dept"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="purpose">Purpose</Label>
                                    <Input id="purpose" name="purpose" placeholder="e.g. Daily Analysis" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="requester">Requested By</Label>
                                <Input id="requester" name="requested_by" placeholder="Name of requester..." />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes-out">Notes</Label>
                                <Textarea id="notes-out" name="notes" placeholder="Additional details..." />
                            </div>
                            <DialogFooter>
                                <Button type="submit" variant="destructive" disabled={loading}>
                                    {loading ? "Registering..." : "Confirm Consumption"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
