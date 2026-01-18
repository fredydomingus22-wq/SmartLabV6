import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ClipboardCheck, AlertTriangle, CheckCircle, Factory, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getAuditData() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get audits
    const { data: audits } = await supabase
        .from("audits")
        .select(`
            *,
            lead_auditor:user_profiles!audits_lead_auditor_fkey(full_name)
        `)
        .eq("organization_id", user.organization_id)
        .order("scheduled_start", { ascending: false })
        .limit(50);

    return { audits: audits || [] };
}

export default async function AuditReportPage() {
    const { audits } = await getAuditData();

    const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        completed: "default",
        in_progress: "secondary",
        scheduled: "outline",
        cancelled: "destructive",
    };

    return (
        <div className="space-y-10 px-6 pb-20">
            <PageHeader
                title="Relatórios de Auditoria"
                overline="Compliance & Governance"
                description="Consulte os resultados de auditorias internas, externas e acompanhamento de CAPA."
                icon={<ShieldCheck className="h-4 w-4" />}
                backHref="/reports"
                variant="purple"
            />

            {/* Audits List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 italic">
                        <Factory className="h-3 w-3" />
                        Histórico de Auditorias ({audits.length})
                    </h2>
                    <Badge variant="outline" className="border-slate-800 text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 bg-slate-900/50">
                        CONTROLO DE QUALIDADE
                    </Badge>
                </div>

                {audits.length === 0 ? (
                    <div className="rounded-[2rem] border border-slate-800 bg-card p-16 text-center space-y-4 shadow-xl border-dashed">
                        <ShieldCheck className="h-12 w-12 mx-auto text-slate-800 opacity-50" />
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Nenhuma auditoria registada.</p>
                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em]">Inicie o processo de auditoria no módulo QMS.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {audits.map((audit: any) => (
                            <Link href={`/reports/audit/${audit.id}`} key={audit.id}>
                                <div className="group flex items-center justify-between p-4 bg-card border border-slate-800 rounded-2xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-purple-500/30 transition-colors">
                                            <ClipboardCheck className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="font-mono font-black text-sm text-white italic tracking-tighter leading-tight">
                                                {audit.title}
                                            </p>
                                            <p className="text-[10px] font-black uppercase tracking-tight text-slate-500">
                                                {audit.audit_type} &bull; Auditor: {audit.lead_auditor?.full_name || "-"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden md:block text-right">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Agendamento</p>
                                            <p className="text-xs font-bold text-slate-400">
                                                {audit.scheduled_start
                                                    ? new Date(audit.scheduled_start).toLocaleDateString()
                                                    : "-"}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "font-black uppercase tracking-tighter text-[9px] border shadow-inner italic px-3 py-1",
                                                audit.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    audit.status === 'in_progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                        'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                            )}
                                        >
                                            {audit.status === 'completed' ? 'Finalizada' :
                                                audit.status === 'in_progress' ? 'Em Curso' :
                                                    audit.status === 'scheduled' ? 'Agendada' : audit.status}
                                        </Badge>
                                        <Button size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-[0.2em] bg-purple-600 hover:bg-purple-700 text-white border-purple-500 shadow-lg group-hover:scale-105 transition-transform">
                                            Gerar Relatório
                                        </Button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
