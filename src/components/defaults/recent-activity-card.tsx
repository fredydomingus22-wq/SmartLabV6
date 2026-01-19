import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, History, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
    id: string;
    title: string;
    code: string;
    status: string;
    date: string | Date;
    severity?: 'critical' | 'major' | 'minor' | 'info';
    type?: string;
    href: string;
}

interface RecentActivityCardProps {
    title: string;
    description: string;
    items: ActivityItem[];
    emptyMessage?: string;
    viewAllHref: string;
    viewAllLabel?: string;
    className?: string;
}

export function RecentActivityCard({
    title,
    description,
    items,
    emptyMessage = "Histórico Limpo • Nenhuma Ocorrência",
    viewAllHref,
    viewAllLabel = "Arquivo Completo",
    className
}: RecentActivityCardProps) {
    return (
        <Card className={cn("border-slate-800 shadow-2xl overflow-hidden rounded-2xl bg-card", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-800 bg-slate-900/50 px-6">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-black uppercase tracking-widest italic text-white flex items-center gap-3">
                        <History className="h-4 w-4 text-indigo-400" />
                        {title}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-tight text-slate-500">
                        {description}
                    </CardDescription>
                </div>
                <Link href={viewAllHref}>
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white hover:bg-slate-800 text-[10px] font-black uppercase tracking-[0.2em] italic">
                        {viewAllLabel}
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-800/40">
                    {items.length > 0 ? (
                        items.slice(0, 5).map((item) => (
                            <Link key={item.id} href={item.href} className="block hover:bg-slate-900/40 transition-all p-5 group">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-5">
                                        <div className={cn("h-12 w-12 rounded-xl flex flex-col items-center justify-center border shadow-inner transition-all group-hover:scale-105",
                                            item.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                                item.severity === 'major' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                    'bg-slate-900/50 border-slate-800 text-slate-600'
                                        )}>
                                            <span className="text-[10px] font-black tracking-tighter uppercase leading-none">
                                                {item.severity ? 'SEV' : 'LOG'}
                                            </span>
                                            <span className="text-xs font-black uppercase mt-0.5">
                                                {item.severity === 'critical' ? 'CR' : item.severity === 'major' ? 'MJ' : item.severity === 'minor' ? 'MN' : 'INF'}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-950 text-indigo-400 font-black border border-slate-800 italic">
                                                    {item.code}
                                                </span>
                                                <h4 className="text-sm font-black text-white italic tracking-tight group-hover:text-indigo-400 transition-colors">
                                                    {item.title}
                                                </h4>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {item.type && (
                                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                                        <div className="h-1 w-1 rounded-full bg-slate-800" />
                                                        Tipo: {item.type.replace('_', ' ')}
                                                    </div>
                                                )}
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 border-slate-800 text-slate-500 bg-slate-950/50 italic shadow-inner">
                                            {item.status.replace('_', ' ')}
                                        </Badge>
                                        <ArrowRight className="h-4 w-4 text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="p-20 text-center space-y-4">
                            <div className="h-16 w-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                                <History className="h-8 w-8 text-slate-800" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 italic">{emptyMessage}</p>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 bg-slate-950/20 border-t border-slate-800 flex justify-center">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700 italic">
                    SmartLab Analytics Hub
                </p>
            </CardFooter>
        </Card>
    );
}
