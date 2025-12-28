import { AdminSidebar } from "@/components/smart/admin-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { getSafeUser } from "@/lib/auth.server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getSafeUser();

    // Strict Role Check for Admin Section
    if (user.role !== "system_owner") {
        console.warn(`Unauthorized access attempt to admin by user ${user.id} with role ${user.role}`);
        redirect("/dashboard");
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#020617]"> {/* Slightly deeper blue for admin */}
            {/* Sidebar */}
            <AdminSidebar user={user} />

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <AppHeader user={user} />

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-blue-900/50 scrollbar-track-transparent">
                    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

