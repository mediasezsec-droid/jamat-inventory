"use client";

import { ReactNode } from "react";
import { MoreVertical, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    mobileActions?: { label: string; onClick: () => void; variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" }[];
    backUrl?: string;
}

export function PageHeader({ title, description, actions, mobileActions, backUrl }: PageHeaderProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-4 pb-6 pt-2 md:flex-row md:items-center md:justify-between border-b border-slate-100 mb-8">
            <div className="space-y-1.5">
                {backUrl && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 text-slate-500 hover:text-slate-900 mb-1"
                        onClick={() => router.push(backUrl)}
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" /> Back
                    </Button>
                )}
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
                {description && (
                    <p className="text-sm md:text-base text-slate-500 max-w-2xl">
                        {description}
                    </p>
                )}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
                {actions}
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center gap-2">
                {actions && <div className="flex gap-2">{actions}</div>}

                {mobileActions && mobileActions.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <MoreVertical className="h-5 w-5" />
                                <span className="sr-only">More actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg">
                            {mobileActions.map((action, index) => (
                                <DropdownMenuItem
                                    key={index}
                                    onClick={action.onClick}
                                    className={`py-3 ${action.variant === "destructive" ? "text-red-600 focus:text-red-600 focus:bg-red-50" : ""}`}
                                >
                                    {action.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}
