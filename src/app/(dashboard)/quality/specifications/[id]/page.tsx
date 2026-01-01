import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ClipboardList,
    ArrowLeft,
    History,
    Calendar,
    User,
    AlertTriangle,
    Target
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpecDialog } from "../spec-dialog";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function SpecificationDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch specification with related data
    const { data: spec, error } = await supabase
        .from("product_specifications")
        .select(`
            *,
            product:products(id, name, sku),
            haccp_hazard_id,
            haccp_hazard:haccp_hazards(id, is_pcc, hazard_description, hazard_category),
            parameter:qa_parameters(id, name, code, unit, category)
        `)
        .eq("id", id)
        .single();

    if (error || !spec) {
        notFound();
    }

    // Fetch version history
    const { data: history } = await supabase
        .from("specification_history")
        .select(`
            *,
            changed_by_user:changed_by(email)
        `)
        .eq("specification_id", id)
        .order("version", { ascending: false });

    const getFrequencyLabel = (freq: string) => {
        const labels: Record<string, string> = {
            per_batch: "Por Lote",
            hourly: "Horária",
            per_shift: "Por Turno",
            daily: "Diária",
            weekly: "Semanal"
        };
        return labels[freq] || freq;
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
                    <Link href={`/quality/specifications?product=${spec.product?.id}`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Target className="h-8 w-8 text-purple-500" />
                            {spec.parameter?.name}
                        </h1>
                        <div className="text-muted-foreground flex items-center gap-2">
                            <span>{spec.product?.name}</span>
                            <Badge variant="outline" className="font-mono">v{spec.version || 1}</Badge>
                            {spec.is_critical && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Critical
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <SpecDialog
                    mode="edit"
                    productId={spec.product_id}
                    specification={spec}
                    availableParameters={[]}
                    sampleTypes={[]}
                />
            </div>

            {/* Details Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Limits Card */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Specification Limits</CardTitle>
                        <CardDescription>
                            Min / Target / Max values
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center gap-4 py-8">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">Minimum (LSL)</p>
                                <p className="text-3xl font-bold font-mono text-red-500">
                                    {spec.min_value ?? "-"}
                                </p>
                            </div>
                            <div className="text-4xl text-muted-foreground">/</div>
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">Target</p>
                                <p className="text-4xl font-bold font-mono text-green-500">
                                    {spec.target_value ?? "-"}
                                </p>
                            </div>
                            <div className="text-4xl text-muted-foreground">/</div>
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">Maximum (USL)</p>
                                <p className="text-3xl font-bold font-mono text-red-500">
                                    {spec.max_value ?? "-"}
                                </p>
                            </div>
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            Unit: {spec.parameter?.unit || "N/A"}
                        </p>
                    </CardContent>
                </Card>

                {/* Details Card */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Specification Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Product</p>
                                <Link
                                    href={`/quality/specifications?product=${spec.product?.id}`}
                                    className="font-medium hover:underline"
                                >
                                    {spec.product?.name}
                                </Link>
                                <p className="text-xs text-muted-foreground">{spec.product?.sku}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Parameter</p>
                                <Link
                                    href={`/quality/parameters/${spec.parameter?.id}`}
                                    className="font-medium hover:underline"
                                >
                                    {spec.parameter?.name}
                                </Link>
                                <p className="text-xs text-muted-foreground font-mono">{spec.parameter?.code}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Category</p>
                                <Badge className={getCategoryColor(spec.parameter?.category)}>
                                    {spec.parameter?.category?.replace("_", "-")}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Sampling Frequency</p>
                                <Badge variant="outline">
                                    {getFrequencyLabel(spec.sampling_frequency)}
                                </Badge>
                            </div>
                        </div>

                        {spec.text_value_expected && (
                            <div>
                                <p className="text-sm text-muted-foreground">Expected Text Value</p>
                                <p className="font-medium">{spec.text_value_expected}</p>
                            </div>
                        )}

                        {spec.test_method_override && (
                            <div>
                                <p className="text-sm text-muted-foreground">Method Override</p>
                                <p className="font-medium">{spec.test_method_override}</p>
                            </div>
                        )}

                        <div className="pt-4 border-t">
                            <p className="text-xs text-muted-foreground">
                                Status: <Badge variant={spec.status === "active" ? "default" : "secondary"}>
                                    {spec.status || "active"}
                                </Badge>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Effective since: {spec.effective_date || "N/A"}
                            </p>
                        </div>
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
                        Track all limit changes for this specification
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!history || history.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">
                            No version history yet. History is recorded when the specification is updated.
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
                                    <div className="flex items-center gap-4 text-sm font-mono">
                                        <span className="text-red-500">Min: {h.min_value ?? "-"}</span>
                                        <span className="text-green-500">Target: {h.target_value ?? "-"}</span>
                                        <span className="text-red-500">Max: {h.max_value ?? "-"}</span>
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
