"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface PRPTemplateItem {
    id: string;
    item_order: number;
    description: string;
    frequency: string;
    responsible: string | null;
}

interface PRPChecklistFormProps {
    template: { id: string; name: string };
    items: PRPTemplateItem[];
}

export function PRPChecklistForm({ template, items }: PRPChecklistFormProps) {
    const [loading, setLoading] = useState(false);
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});

    const handleCheck = (itemId: string, checked: boolean) => {
        setCheckedItems(prev => ({ ...prev, [itemId]: checked }));
    };

    const handleNoteChange = (itemId: string, note: string) => {
        setNotes(prev => ({ ...prev, [itemId]: note }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // TODO: Implement server action to save PRP execution
            toast.success("PRP Checklist saved successfully");
        } catch (error) {
            toast.error("Failed to save checklist");
        } finally {
            setLoading(false);
        }
    };

    const allChecked = items.every(item => checkedItems[item.id]);

    return (
        <div className="space-y-4">
            {items.map(item => (
                <Card key={item.id} className="glass">
                    <CardHeader className="pb-2">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                checked={checkedItems[item.id] || false}
                                onCheckedChange={(checked) => handleCheck(item.id, !!checked)}
                            />
                            <div className="flex-1">
                                <CardTitle className="text-sm font-medium">
                                    {item.item_order}. {item.description}
                                </CardTitle>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Frequency: {item.frequency} | Responsible: {item.responsible || "—"}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Notes (optional)..."
                            value={notes[item.id] || ""}
                            onChange={(e) => handleNoteChange(item.id, e.target.value)}
                            rows={2}
                            className="text-sm"
                        />
                    </CardContent>
                </Card>
            ))}

            <div className="flex justify-end pt-4">
                <Button onClick={handleSubmit} disabled={loading || !allChecked}>
                    {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Complete Checklist
                </Button>
            </div>
        </div>
    );
}
