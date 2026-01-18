import { getEnvironmentalZones } from "@/lib/queries/compliance";
import { ZoneCard } from "@/app/(dashboard)/quality/environmental/_components/zone-card";
import { ZoneDialog } from "@/app/(dashboard)/quality/environmental/_components/zone-dialog";
import { Microscope, ShieldAlert, Activity } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function EnvironmentalMonitoringPage() {
    const zones = await getEnvironmentalZones();

    return (
        <div className="space-y-6 px-6 pb-20">
            <PageHeader
                title="Plano de Monitorização Ambiental (PMA)"
                overline="Segurança Alimentar • ISO 22000 / FSSC"
                icon={<Microscope className="h-4 w-4" />}
                variant="blue"
                description="Gestão técnica de zonas de higiene, pontos de amostragem e integridade microbiológica."
                backHref="/quality"
                actions={<ZoneDialog mode="create" />}
            />

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="glass p-6 rounded-2xl flex items-center gap-4 bg-slate-900/40 border-slate-800">
                    <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1 italic">Zonas de Risco (Z1)</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter">{zones.filter(z => z.risk_level === 1).length}</p>
                    </div>
                </div>
                <div className="glass p-6 rounded-2xl flex items-center gap-4 bg-slate-900/40 border-slate-800">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <Activity className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1 italic">Pontos de Controlo</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter">{zones.reduce((acc, z) => acc + (z.sampling_points?.length || 0), 0)}</p>
                    </div>
                </div>
                <div className="glass p-6 rounded-2xl flex items-center gap-4 bg-slate-900/40 border-slate-800">
                    <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <Microscope className="h-5 w-5 text-indigo-500" />
                    </div>
                    <Link href="/micro" className="group">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1 group-hover:text-indigo-400 transition-colors italic">Conectividade Lab</p>
                        <p className="text-xs font-black text-slate-300 group-hover:text-white transition-colors uppercase italic tracking-tighter">Consola de Micro →</p>
                    </Link>
                </div>
            </div>

            {/* Zones List */}
            <div className="grid gap-6">
                {zones.length > 0 ? (
                    zones.map((zone) => (
                        <ZoneCard key={zone.id} zone={zone} />
                    ))
                ) : (
                    <div className="glass p-12 text-center space-y-4 border-slate-800 bg-slate-900/40">
                        <Microscope className="h-12 w-12 mx-auto text-slate-700 opacity-50" />
                        <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Configuração Vazia • Sem Zonas Definidas</h3>
                        <p className="text-slate-500 max-w-md mx-auto text-xs font-bold uppercase tracking-widest leading-relaxed">
                            Inicie a estruturação do PMA definindo as zonas de risco e pontos de amostragem para monitorização microbiológica.
                        </p>
                        <div className="pt-4">
                            <ZoneDialog mode="create" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
