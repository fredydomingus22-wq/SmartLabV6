import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Beaker,
    ArrowLeft,
    Clock,
    Wrench,
    History,
    Calendar,
    User
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ParameterDialog } from "../parameter-dialog";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ParameterDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch parameter
    const { data: parameter, error } = await supabase
        .from("qa_parameters")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !parameter) {
        notFound();
    }

    // Fetch version history
    const { data: history } = await supabase
        .from("qa_parameter_history")
        .select(`
            *,
            changed_by_user:changed_by(email)
        `)
        .eq("parameter_id", id)
        .order("version", { ascending: false });

    // Fetch specifications using this parameter
    const { data: specifications } = await supabase
        .from("product_specifications")
        .select(`
            id,
            min_value,
            max_value,
            target_value,
            is_critical,
            product:products(id, name, sku)
        `)
        .eq("qa_parameter_id", id);

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
            physico_chemical: "Físico-Químico",
            microbiological: "Microbiológico",
            sensory: "Sensorial",
            other: "Outro"
        };
        return labels[cat] || cat;
    };

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            physico_chemical: "bg-blue-100 text-blue-700",
            microbiological: "bg-green-100 text-green-700",
            sensory: "bg-purple-100 text-purple-700",
            other: "bg-gray-100 text-gray-700"
        };
        return colors[cat] || "bg-gray-100 text-gray-700";
    };

    return (
        <div className="container py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/quality/parameters">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Beaker className="h-8 w-8 text-blue-500" />
                            {parameter.name}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <span className="font-mono">{parameter.code}</span>
                            <Badge variant="outline" className="font-mono">v{parameter.version || 1}</Badge>
                            <Badge className={getCategoryColor(parameter.category)}>
                                {getCategoryLabel(parameter.category)}
                            </Badge>
                        </p>
                    </div>
                </div>
                <ParameterDialog mode="edit" parameter={parameter} />
            </div>

            {/* Details Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Parameter Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Unit</p>
                                <p className="font-medium">{parameter.unit || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Precision</p>
                                <p className="font-medium">{parameter.precision ?? 2} decimals</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Analysis Time</p>
                                <p className="font-medium flex items-center gap-1">
                                    {parameter.analysis_time_minutes ? (
                                        <>
                                            <Clock className="h-4 w-4" />
                                            {parameter.analysis_time_minutes} minutes
                                        </>
                                    ) : "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant={parameter.status === "active" ? "default" : "secondary"}>
                                    {parameter.status}
                                </Badge>
                            </div>
                        </div>

                        {parameter.method && (
                            <div>
                                <p className="text-sm text-muted-foreground">Analysis Method</p>
                                <p className="font-medium">{parameter.method}</p>
                            </div>
                        )}

                        {parameter.equipment_required && (
                            <div>
                                <p className="text-sm text-muted-foreground">Equipment Required</p>
                                <p className="font-medium flex items-center gap-1">
                                    <Wrench className="h-4 w-4" />
                                    {parameter.equipment_required}
                                </p>
                            </div>
                        )}

                        {parameter.description && (
                            <div>
                                <p className="text-sm text-muted-foreground">Description</p>
                                <p className="font-medium">{parameter.description}</p>
                            </div>
                        )}

                        <div className="pt-4 border-t">
                            <p className="text-xs text-muted-foreground">
                                Effective since: {parameter.effective_date || "N/A"}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Usage in Specifications */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Used in Products</CardTitle>
                        <CardDescription>
                            {specifications?.length || 0} products use this parameter
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!specifications || specifications.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Not used in any product specifications yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {specifications.map((spec: any) => (
                                    <Link
                                        key={spec.id}
                                        href={`/quality/specifications?product=${spec.product?.id}`}
                                        className="block p-3 rounded-lg border hover:bg-muted/50 transition"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{spec.product?.name}</p>
                                                <p className="text-xs text-muted-foreground">{spec.product?.sku}</p>
                                            </div>
                                            <div className="text-right text-sm font-mono">
                                                {spec.min_value ?? "-"} / {spec.target_value ?? "-"} / {spec.max_value ?? "-"}
                                            </div>
                                        </div>
                                        {spec.is_critical && (
                                            <Badge variant="destructive" className="mt-1">Critical</Badge>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Version History */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Version History
                    </CardTitle>
                    <CardDescription>
                        Track all changes made to this parameter
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!history || history.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">
                            No version history yet. History is recorded when the parameter is updated.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {history.map((h) => (
                                <div key={h.id} className="p-4 border rounded-lg bg-muted/30">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="font-mono">
                                            Version {h.version}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(h.superseded_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Name:</span> {h.name}
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Unit:</span> {h.unit || "-"}
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Method:</span> {h.method || "-"}
                                        </div>
                                    </div>
                                    {h.change_reason && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Reason: {h.change_reason}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        Changed by: {h.changed_by_user?.email || "Unknown"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
