import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
    breadcrumbs?: BreadcrumbItem[];
}

export function PageHeader({
    title,
    description,
    children,
    className,
    breadcrumbs = [],
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-6 py-6", className)}>
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <nav className="flex items-center text-sm text-muted-foreground">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">
                        <Home className="h-4 w-4" />
                    </Link>
                    {breadcrumbs.map((item, index) => (
                        <div key={index} className="flex items-center">
                            <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
                            {item.href ? (
                                <Link
                                    href={item.href}
                                    className="hover:text-foreground transition-colors font-medium"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-foreground font-semibold">
                                    {item.label}
                                </span>
                            )}
                        </div>
                    ))}
                </nav>
            )}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {children && (
                    <div className="flex items-center gap-2">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
