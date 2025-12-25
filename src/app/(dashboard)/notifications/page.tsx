import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
    Bell,
    AlertCircle,
    Clock,
    CheckCircle2,
    Info,
    ChevronRight,
    Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface Deviation {
    id: string;
    reading_time: string;
    is_deviation: boolean;
    parameter_name: string;
    value: number;
    limit_min: number;
    limit_max: number;
}

interface ExpiringLot {
    id: string;
    code: string;
    expiry_date: string;
    status: string;
}

async function getNotifications(supabase: any, user: any) {
    // 1. Deviations from CCP
    const { data: deviations } = await supabase
        .from("ccp_readings")
        .select(`
            id,
            reading_time,
            is_deviation,
            parameter_name,
            value,
            limit_min,
            limit_max
        `)
        .eq("organization_id", user.organization_id)
        .eq("plant_id", user.plant_id)
        .eq("is_deviation", true)
        .order("reading_time", { ascending: false })
        .limit(10);

    // 2. Expiring Lots (Raw Materials)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const { data: expiringLots } = await supabase
        .from("raw_material_lots")
        .select("id, code, expiry_date, status")
        .eq("organization_id", user.organization_id)
        .eq("plant_id", user.plant_id)
        .lte("expiry_date", thirtyDaysFromNow.toISOString())
        .eq("status", "approved")
        .order("expiry_date", { ascending: true })
        .limit(5);

    // Transform into a unified notification list
    const alerts = [
        ...((deviations || []) as Deviation[]).map((d: Deviation) => ({
            id: d.id,
            type: 'deviation',
            title: `Desvio Crítico: ${d.parameter_name}`,
            description: `Valor ${d.value} fora dos limites (${d.limit_min} - ${d.limit_max})`,
            time: d.reading_time,
            severity: 'high'
        })),
        ...((expiringLots || []) as ExpiringLot[]).map((l: ExpiringLot) => ({
            id: l.id,
            type: 'expiry',
            title: `Lote Próximo da Expiração: ${l.code}`,
            description: `A validade expira em ${new Date(l.expiry_date).toLocaleDateString()}`,
            time: new Date().toISOString(), // Use current for sorting priority
            severity: 'medium'
        }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return alerts;
}

export default async function NotificationsPage() {
    const supabase = await createClient();
    const user = await getSafeUser();
    const notifications = await getNotifications(supabase, user);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-8 rounded-2xl border-slate-800/50">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-orange-500/20">
                            <Bell className="h-6 w-6 text-orange-400" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Centro de Notificações</h1>
                    </div>
                    <p className="text-slate-400 font-medium">Alertas críticos e avisos do sistema em tempo real.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-slate-800 text-slate-400 hover:text-slate-100 h-11 px-6">
                        Marcar todas como lidas
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="max-w-4xl mx-auto space-y-4">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 glass rounded-2xl border-slate-800/50">
                        <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-100">Tudo em conformidade</h3>
                            <p className="text-slate-400">Não existem alertas ou desvios pendentes no momento.</p>
                        </div>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <Card key={n.id} className="glass border-slate-800/50 hover:border-slate-700 transition-all cursor-pointer group overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex items-start gap-4 p-5">
                                    <div className={`mt-1 p-2.5 rounded-xl ${n.severity === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
                                        }`}>
                                        {n.type === 'deviation' ? <AlertCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                                                {n.title}
                                            </h3>
                                            <span className="text-[10px] font-mono text-slate-500">
                                                {new Date(n.time).toLocaleString('pt-PT')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                            {n.description}
                                        </p>
                                        <div className="flex items-center gap-3 pt-2">
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] font-bold uppercase border-none",
                                                n.severity === 'high' ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                                            )}>
                                                {n.severity === 'high' ? 'Crítico' : 'Aviso'}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] font-bold bg-slate-900 border-slate-800 text-slate-400">
                                                {n.type === 'deviation' ? 'Qualidade' : 'Inventário'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-700 group-hover:text-slate-400 transition-all self-center ml-2" />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
