import { AppSidebar } from "@/components/smart/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { FAB } from "@/components/smart/fab";
import { getSafeUser } from "@/lib/auth.server";
import { MobileNav } from "@/components/smart/mobile-nav";
import { menuItems } from "@/config/navigation";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { CommandMenu } from "@/components/smart/command-menu";
import { PageTransition } from "@/components/layout/page-transition";
import { hasAccess } from "@/lib/permissions";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getSafeUser();
    const headersList = await headers();
    const pathname = headersList.get("x-invoke-path") || "";

    // Route Protection Logic
    const currentMenuItem = menuItems.find(item => {
        const isMainHrefMatched = item.href && (pathname === item.href || pathname.startsWith(item.href + "/"));
        const isChildMatched = item.children?.some((child: any) =>
            pathname === child.href || pathname.startsWith(child.href + "/")
        );
        return isMainHrefMatched || isChildMatched;
    });

    if (currentMenuItem && !hasAccess(user.role, currentMenuItem.module)) {
        redirect("/dashboard");
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-950">
            {/* Command Palette */}
            <CommandMenu user={user} />

            {/* Desktop Sidebar (hidden on mobile) */}
            <div className="hidden md:block h-full">
                <AppSidebar user={user} />
            </div>

            {/* Mobile Sidebar (Drawer) */}
            <div className="md:hidden absolute top-4 left-4 z-50">
                <MobileNav user={user} />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <AppHeader user={user} />

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <div className="p-3 sm:p-4 md:p-8 space-y-4 md:space-y-8">
                        <PageTransition>
                            {children}
                        </PageTransition>
                    </div>
                </main>
            </div>

            {/* Floating Action Button */}
            <FAB user={user} />
        </div>
    );
}

