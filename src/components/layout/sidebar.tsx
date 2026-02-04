"use client";

import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Settings,
    Users,
    Menu,
    Building2,
    ChefHat,
    FileDown,
    RefreshCw,
    Calendar,
    PlusCircle,
    Package,
    ClipboardList,
    ScrollText,
    HelpCircle,
    LogOut,
    Grid,
    AlertTriangle,
    Mail,
    UserPlus
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/hooks/use-role";
import { useRBAC } from "@/hooks/use-rbac";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";

// Route groups - visibility controlled by role-based page access
const routeGroups = [
    {
        label: "Main",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/" },
            { label: "New Event", icon: PlusCircle, href: "/events/new" },
        ]
    },
    {
        label: "Operations",
        items: [
            { label: "Events", icon: Calendar, href: "/events" },
            { label: "Floor Plan", icon: Grid, href: "/events/floor-plan" },
            { label: "Inventory", icon: Package, href: "/inventory" },
            { label: "Ledger", icon: ClipboardList, href: "/ledger" },
            { label: "Lost Items", icon: HelpCircle, href: "/lost-items" },
        ]
    },
    {
        label: "Management",
        items: [
            { label: "Users", icon: Users, href: "/settings/users" },
            { label: "Add User", icon: UserPlus, href: "/users/add" },
            { label: "Venues", icon: Building2, href: "/settings/venues" },
            { label: "Caterers", icon: ChefHat, href: "/settings/caterers" },
        ]
    },
    {
        label: "System",
        items: [
            { label: "Logs", icon: ScrollText, href: "/logs" },
            { label: "Sync", icon: RefreshCw, href: "/settings/data/sync" },
            { label: "Export", icon: FileDown, href: "/export-data" },
            { label: "Restore Data", icon: RefreshCw, href: "/settings/data/restore" },
            { label: "System Health", icon: AlertTriangle, href: "/settings/data/health" },
            { label: "Settings", icon: Settings, href: "/settings/config" },
            { label: "System Reset", icon: AlertTriangle, href: "/settings/data" },
            { label: "Email Test", icon: Mail, href: "/settings/email-test" },
        ]
    }
];

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { role, isLoading, user } = useRole();
    const { canViewPage } = useRBAC();
    const [isOpen, setIsOpen] = useState(false);

    if (isLoading) return null;

    // Filter route items based on role-based page access
    const getVisibleItems = (items: typeof routeGroups[0]['items']) => {
        return items.filter(item => canViewPage(item.href));
    };

    // Filter groups to only show those with visible items
    const visibleGroups = routeGroups
        .map(group => ({
            ...group,
            items: getVisibleItems(group.items)
        }))
        .filter(group => group.items.length > 0);

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[#4A1010] text-[#FDFBF7]">
            {/* Logo */}
            <div className="p-5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[#C6A868] flex items-center justify-center shrink-0">
                        <span className="text-[#4A1010] font-bold text-lg">J</span>
                    </div>
                    <div>
                        <h1 className="font-semibold text-sidebar-foreground text-base leading-tight">Jamaat Inventory</h1>
                        <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">v2.1</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
                {visibleGroups.map((group) => (
                    <div key={group.label}>
                        <h4 className="text-[10px] font-semibold text-sidebar-foreground/60 uppercase tracking-widest px-3 mb-2">
                            {group.label}
                        </h4>
                        <div className="space-y-0.5">
                            {group.items.map((route) => {
                                const isActive = pathname === route.href;
                                return (
                                    <Link
                                        key={route.href}
                                        href={route.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                                            isActive
                                                ? "bg-[#5F1515] text-[#C6A868]"
                                                : "text-[#FDFBF7]/60 hover:bg-[#5F1515]/50 hover:text-[#FDFBF7]"
                                        )}
                                    >
                                        {isActive && (
                                            <span className="w-0.5 h-4 bg-[#C6A868] rounded-full -ml-1.5 mr-1" />
                                        )}
                                        <route.icon className={cn(
                                            "h-4 w-4",
                                            isActive ? "text-[#C6A868]" : "text-[#FDFBF7]/60"
                                        )} />
                                        <span>{route.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-sidebar-border">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-sidebar-border">
                        <AvatarImage src={user?.image || ""} />
                        <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs font-medium">
                            {user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || "User"}</p>
                        <p className="text-[10px] text-sidebar-foreground/60 capitalize">{role?.toLowerCase()}</p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Sheet */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <button className="lg:hidden fixed left-4 top-4 z-50 p-2.5 rounded-lg bg-[#4A1010] text-[#FDFBF7] shadow-lg border border-[#5F1515]">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[260px] bg-sidebar border-sidebar-border">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <div className={cn("hidden lg:flex flex-col w-[260px] fixed inset-y-0 z-50 border-r border-sidebar-border", className)}>
                <SidebarContent />
            </div>
        </>
    );
}
