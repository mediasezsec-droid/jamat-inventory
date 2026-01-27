"use client";

import { useRole } from "@/hooks/use-role";
import { Bell, Search, Settings, LogOut, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export function Header() {
    const { role, user } = useRole();
    const router = useRouter();

    const handleLogout = () => {
        signOut();
    };

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-6 backdrop-blur-xl transition-all print:hidden">
            {/* Search Bar - Global */}
            <div className="flex flex-1 items-center gap-4">
                <div className="relative w-full max-w-sm hidden md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search..."
                        className="pl-9 bg-slate-50 border-slate-200 focus:bg-white h-10 w-full"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const target = (e.currentTarget as HTMLInputElement).value;
                                const base = window.location.pathname.includes('/inventory') ? '/inventory' : '/events';
                                router.push(`${base}?q=${target}`);
                            }
                        }}
                    />
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-indigo-600 rounded-full h-10 w-10">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                            <Avatar className="h-9 w-9 border border-slate-200">
                                <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                                    {user?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {role}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push("/profile")}>
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/settings")}>
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
