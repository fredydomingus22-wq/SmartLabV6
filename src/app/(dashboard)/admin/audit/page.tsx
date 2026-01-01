import { getAuditEvents } from "@/domain/audit/audit.repository";
import { AuditClientView } from "./_components/audit-client-view";
import { ShieldAlert, Fingerprint } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditTrailPage() {
    // Initial fetch
    const { data: initialEvents, total } = await getAuditEvents({ limit: 50 });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Industrial Header */}
            <div className="glass p-8 rounded-3xl border-none shadow-2xl bg-gradient-to-br from-slate-500/5 via-transparent to-indigo-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldAlert className="h-3 w-3" /> System Integrity
                                </span>
                            </div>
                            <div className="h-4 w-px bg-white/10" />
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">
                                Industrial Audit Trail
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white flex items-center gap-4">
                            Audit Console
                            <Fingerprint className="h-10 w-10 text-indigo-500/50" />
                        </h1>
                        <p className="text-sm text-slate-400 max-w-2xl font-medium">
                            Immutable chronological record of all quality-critical actions.
                            Fully compliant with ISO 9001, FSSC 22000 and 21 CFR Part 11 requirements.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Event Count</div>
                        <div className="text-4xl font-black text-white tabular-nums">{total}</div>
                    </div>
                </div>
            </div>

            {/* Interactive Audit View */}
            <AuditClientView initialEvents={initialEvents || []} total={total || 0} />
        </div>
    );
}
