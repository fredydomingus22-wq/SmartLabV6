import { getPRPTemplates } from "@/lib/queries/haccp";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { ClipboardCheck, History, AlertCircle, CheckCircle2, Play, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function PRPDashboard() {
    const templates = await getPRPTemplates();

    return (
        <div className="space-y-10">
            <PageHeader
                variant="blue"
                icon={<ShieldCheck className="h-4 w-4" />}
                overline="Operational Hygiene • PRP"
                title="PRP Monitoring"
                description="Pre-requisite Programs: Hygiene and Operational verification."
                backHref="/haccp"
                actions={
                    <Button variant="outline" className="h-9 bg-slate-900/50 border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest px-4 transition-all">
                        <History className="mr-2 h-4 w-4" />
                        Log History
                    </Button>
                }
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => {
                    const isDoneToday = template.latest_execution &&
                        format(new Date(template.latest_execution.completed_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                    return (
                        <Card key={template.id} className="bg-card border-slate-800 hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl">{template.name}</CardTitle>
                                    <CardDescription>{template.frequency} check</CardDescription>
                                </div>
                                <div className={`p-2 rounded-full ${isDoneToday ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                    <ClipboardCheck className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-4 mt-2">
                                    <p className="text-sm text-muted-foreground">
                                        {template.description || "Digital verification checklist for process safety."}
                                    </p>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-1 font-medium">
                                            {isDoneToday ? (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    Done Today
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                                    Pending Today
                                                </>
                                            )}
                                        </span>
                                        {template.latest_execution && (
                                            <span className="text-xs text-muted-foreground">
                                                Last: {format(new Date(template.latest_execution.completed_at), 'HH:mm')}
                                            </span>
                                        )}
                                    </div>

                                    <Button asChild className="w-full" variant={isDoneToday ? "outline" : "default"}>
                                        <Link href={`/haccp/prp/${template.id}/execute`}>
                                            <Play className="mr-2 h-3 w-3" />
                                            {isDoneToday ? "Verify Again" : "Start Checklist"}
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {templates.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-card border border-dashed border-slate-800 rounded-xl">
                        <ClipboardCheck className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                        <h3 className="text-lg font-medium">No PRP Templates Found</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Templates must be configured in settings to use the checklist engine.
                        </p>
                        <Button variant="outline">Configure PRP</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
