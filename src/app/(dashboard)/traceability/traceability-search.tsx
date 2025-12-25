"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

export function TraceabilitySearch() {
    const [searchQuery, setSearchQuery] = useState("");
    const [entityType, setEntityType] = useState<"lot" | "batch">("lot");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSearch = () => {
        if (!searchQuery.trim()) return;

        startTransition(() => {
            if (entityType === "lot") {
                router.push(`/traceability/forward?q=${encodeURIComponent(searchQuery)}`);
            } else {
                router.push(`/traceability/backward?q=${encodeURIComponent(searchQuery)}`);
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <Card className="glass">
            <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Entity Type Selection */}
                    <div className="space-y-2">
                        <Label>Trace Type</Label>
                        <RadioGroup
                            value={entityType}
                            onValueChange={(v) => setEntityType(v as "lot" | "batch")}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="lot" id="lot" />
                                <Label htmlFor="lot" className="flex items-center gap-1 cursor-pointer">
                                    <ArrowRight className="h-4 w-4 text-green-500" />
                                    Forward (Lot → Product)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="batch" id="batch" />
                                <Label htmlFor="batch" className="flex items-center gap-1 cursor-pointer">
                                    <ArrowLeft className="h-4 w-4 text-blue-500" />
                                    Backward (Batch → Materials)
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Search Input */}
                    <div className="flex-1 space-y-2">
                        <Label>
                            {entityType === "lot" ? "Lot Code" : "Batch Code"}
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder={entityType === "lot" ? "e.g., L00965567" : "e.g., PB-2025-101"}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1"
                            />
                            <Button onClick={handleSearch} disabled={isPending || !searchQuery.trim()}>
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Search className="h-4 w-4 mr-2" />
                                        Trace
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
