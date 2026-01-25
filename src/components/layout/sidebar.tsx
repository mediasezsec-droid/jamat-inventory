"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    CalendarPlus,
    Package,
    ClipboardList,
    Settings,
    LogOut,
    CalendarDays,
    Users,
    UserCircle,
    Menu,
    AlertCircle
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/",
    },
    {
        label: "Events",
        icon: CalendarDays,
        href: "/events",
    },
    {
        label: "New Event",
        icon: CalendarPlus,
        href: "/events/new",
    },
    {
        label: "Inventory",
        icon: Package,
        href: "/inventory",
    },
    {
        label: "Ledger",
        icon: ClipboardList,
        href: "/ledger",
    },
    {
        label: "System Logs",
        icon: ClipboardList,
        href: "/logs",
    },
    {
        label: "Lost Items",
        icon: AlertCircle,
        href: "/lost-items",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/settings",
    },
    {
        label: "My Profile",
        icon: UserCircle,
        href: "/profile",
    },
    {
        label: "Users",
        icon: Users,
        href: "/users",
    },
];

import { Role } from "@/types";

interface SidebarProps {
    role?: Role;
}

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();

    // Strict role checks
    const isAdmin = role === "ADMIN";
    const isManager = role === "MANAGER";
    const isStaff = role === "STAFF";
    const isWatcher = role === "WATCHER";

    // RBAC:
    // ADMIN: Can do everything
    // MANAGER: Can view and create events, view logs
    // STAFF: Can only edit inventory
    // WATCHER: Can view inventory and events (no edit)

    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/",
            roles: ["ADMIN", "MANAGER", "STAFF", "WATCHER"], // Everyone
        },
        {
            label: "Events",
            icon: CalendarDays,
            href: "/events",
            roles: ["ADMIN", "MANAGER", "WATCHER"], // View events
        },
        {
            label: "New Event",
            icon: CalendarPlus,
            href: "/events/new",
            roles: ["ADMIN", "MANAGER"], // Create events
        },
        {
            label: "Inventory",
            icon: Package,
            href: "/inventory",
            roles: ["ADMIN", "MANAGER", "STAFF", "WATCHER"], // Everyone (edit restricted in page)
        },
        {
            label: "Ledger",
            icon: ClipboardList,
            href: "/ledger",
            roles: ["ADMIN", "MANAGER"], // Financial data
        },
        {
            label: "System Logs",
            icon: ClipboardList,
            href: "/logs",
            roles: ["ADMIN", "MANAGER"],
        },
        {
            label: "Lost Items",
            icon: AlertCircle,
            href: "/lost-items",
            roles: ["ADMIN", "MANAGER", "STAFF"],
        },
        {
            label: "Settings",
            icon: Settings,
            href: "/settings",
            roles: ["ADMIN"],
        },
        {
            label: "My Profile",
            icon: UserCircle,
            href: "/profile",
            roles: ["ADMIN", "MANAGER", "STAFF", "WATCHER"], // Everyone
        },
        {
            label: "Users",
            icon: Users,
            href: "/users",
            roles: ["ADMIN"],
        },
    ];

    const filteredRoutes = routes.filter(route => {
        if (!role) return false; // No role = no access
        return route.roles.includes(role);
    });

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-slate-50 border-r border-slate-200 w-full">
            {/* Logo Section - with gradient accent */}
            <div className="h-20 flex items-center px-6 border-b border-slate-100 relative overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-violet-500/5" />
                <Link href="/" className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-200">
                        J
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg tracking-tight text-slate-900 leading-none">Jamaat Inv</span>
                        <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider mt-1">
                            {isAdmin ? "Admin" : isManager ? "Manager" : isStaff ? "Staff" : "Watcher"}
                        </span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                {filteredRoutes.map((route) => {
                    const isActive = pathname === route.href;
                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group font-medium",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                                    : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50"
                            )}
                        >
                            <route.icon className={cn(
                                "h-4 w-4 transition-colors",
                                isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500"
                            )} />
                            {route.label}
                            {isActive && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            )}
                        </Link>
                    )
                })}
            </div>

            {/* User / Footer */}
            <div className="p-4 border-t border-slate-100">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-slate-500 hover:text-red-600 hover:bg-slate-50 px-3 h-9 rounded-md text-sm font-medium"
                    onClick={async () => {
                        try {
                            await fetch("/api/auth/logout", { method: "POST" });
                            window.location.href = "/login";
                        } catch (error) {
                            console.error("Logout failed:", error);
                        }
                    }}
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}

export function MobileSidebar({ role }: { role?: Role }) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-slate-600 hover:bg-slate-100 rounded-md">
                    <Menu className="w-5 h-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-white border-r border-slate-200 w-[260px]">
                <Sidebar role={role} />
            </SheetContent>
        </Sheet>
    )
}
