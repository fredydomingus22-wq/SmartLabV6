import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Users, Building2, Wrench } from "lucide-react";

const settingsItems = [
    {
        href: "/settings/audit-logs",
        icon: History,
        title: "Audit Logs",
        description: "View system activity and changes"
    },
    {
        href: "/settings/users",
        icon: Users,
        title: "User Management",
        description: "Manage team members and roles"
    },
    {
        href: "/settings/plant",
        icon: Building2,
        title: "Plant Config",
        description: "Organization and facility settings"
    },
];

export default function SettingsPage() {
    return (
        <div className="container py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">System configuration and administration.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {settingsItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Card className="glass hover:border-primary/50 transition-all cursor-pointer h-full">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <item.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{item.title}</CardTitle>
                                        <CardDescription>{item.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
