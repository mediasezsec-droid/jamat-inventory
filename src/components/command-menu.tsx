"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, Calendar, Package, Settings, User, FileText, LayoutDashboard, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRBAC } from "@/hooks/use-rbac";

export function CommandMenu() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const { canViewPage } = useRBAC();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[640px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[9999]"
        >
            <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
                <Search className="w-5 h-5 text-slate-400 mr-2" />
                <Command.Input
                    placeholder="Type a command or search..."
                    className="w-full h-14 bg-transparent outline-none text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-py-2">
                <Command.Empty className="py-6 text-center text-sm text-slate-500">No results found.</Command.Empty>

                <Command.Group heading="Navigation" className="text-xs font-medium text-slate-500 px-2 py-1.5 mb-2">
                    <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/events"))}>
                        <Calendar className="w-4 h-4 mr-2" /> Events
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/inventory"))}>
                        <Package className="w-4 h-4 mr-2" /> Inventory
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
                        <Settings className="w-4 h-4 mr-2" /> Settings
                    </CommandItem>
                </Command.Group>

                <Command.Group heading="Quick Actions" className="text-xs font-medium text-slate-500 px-2 py-1.5 mb-2">
                    {canViewPage("/events/new") && (
                        <CommandItem onSelect={() => runCommand(() => router.push("/events/new"))}>
                            <Plus className="w-4 h-4 mr-2" /> New Event
                        </CommandItem>
                    )}
                    {canViewPage("/inventory/add") && (
                        <CommandItem onSelect={() => runCommand(() => router.push("/inventory/add"))}>
                            <Plus className="w-4 h-4 mr-2" /> Add Inventory Item
                        </CommandItem>
                    )}
                    <CommandItem onSelect={() => runCommand(() => router.push("/events/calendar"))}>
                        <Calendar className="w-4 h-4 mr-2" /> View Calendar
                    </CommandItem>
                </Command.Group>

                {/* Could add robust search via API here later */}
                {/* 
                <Command.Group heading="Recent Events">
                    ...
                </Command.Group> 
                */}
            </Command.List>

            <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">Press <strong>ESC</strong> to close</span>
                <span className="text-xs text-slate-400"><strong>Ctrl+K</strong> to open</span>
            </div>
        </Command.Dialog>
    );
}

function CommandItem({ children, onSelect }: { children: React.ReactNode, onSelect?: () => void }) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-300 aria-selected:bg-indigo-50 aria-selected:text-indigo-700 dark:aria-selected:bg-slate-800 dark:aria-selected:text-indigo-400 cursor-pointer transition-colors"
        >
            {children}
        </Command.Item>
    );
}
