import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Beaker,
    Plus,
    ArrowLeft,
    Search,
    Upload,
    Clock,
    Wrench
} from "lucide-react";
import Link from "next/link";
import { ParameterDialog } from "./parameter-dialog";
import { BulkImportDialog } from "./bulk-import-dialog";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ status?: string; category?: string; search?: string }>;
}

export default async function ParametersPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const supabase = await createClient();

    // Build query with filters
    let query = supabase
        .from("qa_parameters")
        .select("*")
        .order("name");

    if (params.status) {
        query = query.eq("status", params.status);
    }

    if (params.category) {
        query = query.eq("category", params.category);
    }

    if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,code.ilike.%${params.search}%`);
    }

    const { data: parameters } = await query;

    // Get category counts
    const { data: categoryCounts } = await supabase
        .from("qa_parameters")
        .select("category")
        .eq("status", "active");

    const categories = (categoryCounts || []).reduce((acc, p) => {
        const cat = p.category || "other";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

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
                    <Link href="/quality">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Beaker className="h-8 w-8 text-blue-500" />
                            QA Parameters
                        </h1>
                        <p className="text-muted-foreground">
                            Manage analysis parameters for quality control
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <BulkImportDialog />
                    <ParameterDialog mode="create" />
                </div>
            </div>

            {/* Category Filter Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Link href="/quality/parameters">
                    <Card className={`glass cursor-pointer hover:border-primary ${!params.category ? 'border-primary' : ''}`}>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{parameters?.length || 0}</div>
                            <p className="text-sm text-muted-foreground">All Parameters</p>
                        </CardContent>
                    </Card>
                </Link>
                {Object.entries(categories).map(([cat, count]) => (
                    <Link key={cat} href={`/quality/parameters?category=${cat}`}>
                        <Card className={`glass cursor-pointer hover:border-primary ${params.category === cat ? 'border-primary' : ''}`}>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">{count}</div>
                                <p className="text-sm text-muted-foreground">{getCategoryLabel(cat)}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Search & Filters */}
            <Card className="glass">
                <CardContent className="pt-6">
                    <form className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                name="search"
                                placeholder="Search by name or code..."
                                defaultValue={params.search}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                            />
                        </div>
                        <select
                            name="status"
                            defaultValue={params.status || ""}
                            className="px-4 py-2 border rounded-lg bg-background"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <Button type="submit">Filter</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Parameters Table */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Parameters List</CardTitle>
                    <CardDescription>
                        {parameters?.length || 0} parameters found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!parameters || parameters.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Beaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No parameters found.</p>
                            <p className="text-sm">Create your first parameter or import from CSV.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-2">Code</th>
                                        <th className="text-left py-3 px-2">Name</th>
                                        <th className="text-left py-3 px-2">Unit</th>
                                        <th className="text-left py-3 px-2">Category</th>
                                        <th className="text-left py-3 px-2">Method</th>
                                        <th className="text-center py-3 px-2">Version</th>
                                        <th className="text-center py-3 px-2">Time</th>
                                        <th className="text-left py-3 px-2">Status</th>
                                        <th className="text-right py-3 px-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parameters.map((param) => (
                                        <tr key={param.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-2 font-mono font-medium">{param.code}</td>
                                            <td className="py-3 px-2">
                                                <Link
                                                    href={`/quality/parameters/${param.id}`}
                                                    className="hover:underline hover:text-primary font-medium"
                                                >
                                                    {param.name}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-2">{param.unit || "-"}</td>
                                            <td className="py-3 px-2">
                                                <Badge className={getCategoryColor(param.category)}>
                                                    {getCategoryLabel(param.category)}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-2 text-muted-foreground">
                                                {param.method || "-"}
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <Badge variant="outline" className="font-mono">
                                                    v{param.version || 1}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                {param.analysis_time_minutes ? (
                                                    <span className="flex items-center justify-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {param.analysis_time_minutes}m
                                                    </span>
                                                ) : "-"}
                                            </td>
                                            <td className="py-3 px-2">
                                                <Badge variant={param.status === "active" ? "default" : "secondary"}>
                                                    {param.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <ParameterDialog mode="edit" parameter={param} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
