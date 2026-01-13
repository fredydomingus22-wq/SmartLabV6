import { createClient } from "@/lib/supabase/server";
import { Building2, MapPin, Globe, ShieldCheck, Zap } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PlantConfigPage() {
    const supabase = await createClient();

    // Fetch organization and plant data
    const { data: org } = await supabase.from("organizations").select("*").limit(1).single();
    const { data: plant } = await supabase.from("plants").select("*").limit(1).single();

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <PageHeader
                title="Configuração da Unidade"
                description="Parâmetros estruturais da organização e ativos industriais"
                icon={<Building2 className="h-4 w-4" />}
                backHref="/settings"
                variant="emerald"
            />

            <div className="grid gap-8 md:grid-cols-2">
                {/* Organization Card */}
                <div className="group relative p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 glass overflow-hidden transition-all duration-500 hover:border-emerald-500/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all duration-500" />

                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                                <Building2 className="h-6 w-6 text-emerald-400" />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">MASTER DATA</Badge>
                        </div>

                        <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight group-hover:text-emerald-400 transition-colors">Organização</h3>
                            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Corporate identity and billing</div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entidade</span>
                                <span className="text-sm font-black text-white italic uppercase">{org?.name || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">País de Residência</span>
                                <span className="text-sm font-black text-white italic uppercase">{org?.country || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status Subscrição</span>
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-none font-black text-[9px] uppercase">{org?.subscription_plan || "Enterprise"}</Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plant Card */}
                <div className="group relative p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 glass overflow-hidden transition-all duration-500 hover:border-blue-500/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all duration-500" />

                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                                <MapPin className="h-6 w-6 text-blue-400" />
                            </div>
                            <Badge className="bg-blue-500/10 text-blue-400 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">PHYSICAL ASSET</Badge>
                        </div>

                        <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight group-hover:text-blue-400 transition-colors">Unidade Fabril</h3>
                            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Industrial facility and location</div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Designação</span>
                                <span className="text-sm font-black text-white italic uppercase">{plant?.name || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Localização Técnica</span>
                                <span className="text-sm font-black text-white italic uppercase">{plant?.location || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Timezone Operacional</span>
                                <div className="flex items-center gap-2">
                                    <Globe className="h-3 w-3 text-blue-400" />
                                    <span className="text-sm font-black text-white italic uppercase">{plant?.timezone || "UTC"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Extra Technical Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/20 glass flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-slate-800 text-slate-400">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Security Level</div>
                        <div className="text-xs font-black text-white uppercase italic">High Compliance</div>
                    </div>
                </div>
                <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/20 glass flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-slate-800 text-slate-400">
                        <Zap className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">System Engine</div>
                        <div className="text-xs font-black text-white uppercase italic">Active Node V6</div>
                    </div>
                </div>
                <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/20 glass flex items-center gap-4 text-center justify-center italic">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">SmartLab Industrial Cloud v6.2</span>
                </div>
            </div>
        </div>
    );
}
