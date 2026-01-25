import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { ProfileCheck } from "@/components/profile-check";
import { auth } from "@/lib/auth";
import { Role } from "@/types";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const role = (session?.user as any)?.role as Role | undefined;

    return (
        <div className="h-full relative">
            <ProfileCheck />
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-white border-r border-slate-200 print:hidden">
                <Sidebar role={role} />
            </div>
            <main className="md:pl-72 pb-10 pt-8 print:pl-0 h-full bg-slate-50/50 min-h-screen">
                <div className="flex items-center p-4 md:hidden print:hidden">
                    <MobileSidebar role={role} />
                </div>
                <div className="px-4 md:px-8 max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
