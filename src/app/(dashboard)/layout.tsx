import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProfileCheck } from "@/components/profile-check";
import { auth } from "@/lib/auth";
import { checkModuleAccess } from "@/lib/rbac-server";
import { Role } from "@/types";
import { redirect } from "next/navigation";

export const preferredRegion = ["sin1"];

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const user = session?.user as any;
    const role = user?.role as Role | undefined;

    // Global module access check - user must have inventory-module access
    // ADMIN bypasses this check (handled inside checkModuleAccess)
    if (session?.user) {
        const hasModuleAccess = await checkModuleAccess("inventory-module");
        if (!hasModuleAccess) {
            redirect("/unauthorized?reason=no-module-access");
        }
    }

    return (
        <div className="h-full relative min-h-screen">
            <ProfileCheck />

            {/* Unified Sidebar handles both Mobile (Sheet) and Desktop (Fixed) */}
            <Sidebar className="print:hidden" />

            {/* Main Content - Padded to accomodate fixed sidebar on desktop */}
            <main className="lg:pl-[280px] h-full transition-all duration-300 flex flex-col min-h-screen">
                <Header user={session?.user} role={role} />
                <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}

