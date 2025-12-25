"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, CheckCircle2, FileText, ExternalLink } from "lucide-react";
import { promoteFindingToNCAction } from "@/app/actions/audits";
import { toast } from "sonner";
import Link from "next/link";

interface AuditFindingsListProps {
    findings: any[];
    auditId: string;
}

export function AuditFindingsList({ findings, auditId }: AuditFindingsListProps) {
    const [promotingId, setPromotingId] = useState<string | null>(null);

    const handlePromote = async (findingId: string) => {
        setPromotingId(findingId);
        try {
            const res = await promoteFindingToNCAction(findingId);
            if (res.success) {
                toast.success(res.message);
            } else {
                toast.error(res.message);
            }
        } finally {
            setPromotingId(null);
        }
    };

    if (findings.length === 0) {
        return (
            <Card className="glass border-slate-800/50">
                <CardContent className="p-8 text-center text-slate-500 italic">
                    Nenhuma constatação (NC ou Observação) registada para esta auditoria.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {findings.map((finding) => (
                <Card key={finding.id} className="glass border-slate-800/50 hover:border-slate-700 transition-all">
                    <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge className={getClassificationColor(finding.classification)}>
                                        {getClassificationLabel(finding.classification)}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] uppercase font-mono border-slate-700 text-slate-500">
                                        ID: {finding.id.split('-')[0]}
                                    </Badge>
                                </div>
                                <p className="text-slate-200 text-sm leading-relaxed">
                                    {finding.description}
                                </p>
                            </div>

                            <div className="flex flex-col justify-center gap-2 min-w-[180px]">
                                {finding.nonconformity_id ? (
                                    <Link href={`/quality/qms/${finding.nonconformity_id}`}>
                                        <Button variant="outline" size="sm" className="w-full border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">
                                            <ExternalLink className="h-3 w-3 mr-2" />
                                            {finding.linked_nc?.nc_number || "Ver NC"}
                                        </Button>
                                    </Link>
                                ) : (
                                    finding.classification.includes('nc') && (
                                        <Button
                                            size="sm"
                                            className="w-full bg-rose-600 hover:bg-rose-500 text-white"
                                            onClick={() => handlePromote(finding.id)}
                                            disabled={promotingId === finding.id}
                                        >
                                            {promotingId === finding.id ? "A criar NC..." : "Promover a NC"}
                                            <ArrowRight className="h-3 w-3 ml-2" />
                                        </Button>
                                    )
                                )}

                                <div className="text-[10px] text-slate-500 text-right italic pt-2">
                                    Estado: {finding.status}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function getClassificationColor(cls: string) {
    switch (cls) {
        case 'major_nc': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        case 'minor_nc': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'observation': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'ofi': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        default: return 'bg-slate-500/10 text-slate-400';
    }
}

function getClassificationLabel(cls: string) {
    switch (cls) {
        case 'major_nc': return 'NC Maior';
        case 'minor_nc': return 'NC Menor';
        case 'observation': return 'Observação';
        case 'ofi': return 'Oportunidade Melhoria';
        default: return cls;
    }
}
