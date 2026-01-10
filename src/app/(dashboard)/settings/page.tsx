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
            <div className="glass p-8 rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-blue-500/10 via-slate-900/50 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="relative z-10">
                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                        Settings
                    </h1>
                    <p className="text-slate-400 font-medium tracking-wide mt-2">
                        System configuration and industrial administration.
                    </p>
                </div>
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
