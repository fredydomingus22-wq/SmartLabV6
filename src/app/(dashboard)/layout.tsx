import { AppSidebar } from "@/components/smart/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { FAB } from "@/components/smart/fab";
import { getSafeUser } from "@/lib/auth";
import { MobileNav } from "@/components/smart/mobile-nav";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getSafeUser();

    return (
        <div className="flex h-screen overflow-hidden bg-slate-950">
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
                    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </main>
            </div>

            {/* Floating Action Button */}
            <FAB user={user} />
        </div>
    );
}
