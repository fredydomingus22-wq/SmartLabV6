import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionCardProps {
    title: string;
    description: string;
    href: string;
    icon: any;
    stats?: string;
    className?: string;
}

export function ActionCard({ title, description, href, icon: Icon, stats, className }: ActionCardProps) {
    return (
        <Link href={href}>
            <Card className={cn(
                "h-full hover:shadow-[0_0_20px_rgba(79,70,229,0.1)] transition-all group overflow-hidden border-slate-800 bg-card hover:border-indigo-500/50 rounded-2xl relative",
                className
            )}>
                {stats && (
                    <div className="absolute top-0 right-0 p-4">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] border-slate-800 text-slate-500 bg-slate-950/50 italic shadow-inner px-2 py-0.5">
                            {stats}
                        </Badge>
                    </div>
                )}
                <CardHeader className="pt-8 px-6 pb-2">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-indigo-500/30 transition-all shadow-inner w-fit">
                        <Icon className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </div>
                </CardHeader>
                <CardContent className="px-6 pb-8 pt-4 space-y-2">
                    <CardTitle className="text-base font-black text-white italic tracking-tight">{title}</CardTitle>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">{description}</p>
                </CardContent>
            </Card>
        </Link>
    );
}
