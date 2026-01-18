import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendDirection?: "up" | "down" | "neutral";
    description?: string;
    className?: string;
}

/**
 * Standard KPI Card for Dashboards.
 * height: fixed [120px]
 */
export function KPICard({
    title,
    value,
    icon: Icon,
    trend,
    trendDirection = "neutral",
    description,
    className
}: KPICardProps) {
    return (
        <Card className={cn("h-[120px] shadow-sm hover:shadow-md transition-shadow", className)}>
            <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <span className="text-sm font-medium text-muted-foreground line-clamp-1">
                        {title}
                    </span>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold tracking-tight">{value}</div>
                    {(trend || description) && (
                        <div className="flex flex-col items-end text-xs">
                            {trend && (
                                <span
                                    className={cn(
                                        "font-medium",
                                        trendDirection === "up" && "text-emerald-600",
                                        trendDirection === "down" && "text-red-600",
                                        trendDirection === "neutral" && "text-muted-foreground"
                                    )}
                                >
                                    {trend}
                                </span>
                            )}
                            {description && (
                                <span className="text-muted-foreground">{description}</span>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
