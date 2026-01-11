"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { ArrowLeft, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import Link from "next/link";
import { exportDataAction } from "@/app/actions/reports";
import { toast } from "sonner";

export default function ExportPage() {
    const [dataType, setDataType] = useState("samples");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        if (!startDate || !endDate) {
            toast.error("Please select date range");
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            toast.error("End date cannot be before start date");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.set("data_type", dataType);
            formData.set("start_date", startDate);
            formData.set("end_date", endDate);

            const result = await exportDataAction(formData);

            if (result.success && result.data) {
                // Convert to CSV
                const data = result.data as any[];
                if (data.length === 0) {
                    toast.error("No data found for selected range");
                    return;
                }

                const headers = Object.keys(data[0]);
                const csvContent = [
                    headers.join(","),
                    ...data.map(row =>
                        headers.map(h => {
                            const val = row[h];
                            if (typeof val === "string" && val.includes(",")) {
                                return `"${val}"`;
                            }
                            return val ?? "";
                        }).join(",")
                    ),
                ].join("\n");

                // Download
                const blob = new Blob([csvContent], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = result.filename || "export.csv";
                a.click();
                URL.revokeObjectURL(url);

                toast.success(`Exported ${data.length} records`);
            } else {
                toast.error("Export failed");
            }
        } catch (error) {
            toast.error("Export error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/reports">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <FileSpreadsheet className="h-8 w-8 text-orange-500" />
                        Data Export
                    </h1>
                    <p className="text-muted-foreground">
                        Export data to CSV / Excel
                    </p>
                </div>
            </div>

            {/* Export Form */}
            <Card className="glass max-w-xl">
                <CardHeader>
                    <CardTitle>Export Options</CardTitle>
                    <CardDescription>
                        Select data type and date range
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label>Data Type</Label>
                        <SearchableSelect
                            value={dataType}
                            onValueChange={setDataType}
                            options={[
                                { value: "samples", label: "Samples" },
                                { value: "batches", label: "Production Batches" },
                                { value: "ncs", label: "Nonconformities" },
                                { value: "capas", label: "CAPA Actions" },
                                { value: "analysis", label: "Lab Analysis Results" },
                                { value: "pcc_logs", label: "HACCP PCC Logs" },
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button onClick={handleExport} disabled={loading} className="w-full">
                        {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        Export to CSV
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
