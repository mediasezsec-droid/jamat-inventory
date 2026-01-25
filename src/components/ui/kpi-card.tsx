
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string | number;
    trend?: string;
    trendType?: "up" | "down" | "neutral";
    icon?: LucideIcon;
    className?: string;
}

export function KPICard({ title, value, trend, trendType = "neutral", icon: Icon, className }: KPICardProps) {
    return (
        <div className={cn("bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col transition-all hover:shadow-md", className)}>
            <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    {title}
                </span>
                {Icon && (
                    <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>

            <div className="flex items-end justify-between mt-auto">
                <span className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                    {value}
                </span>

                {trend && (
                    <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        trendType === "up" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                        trendType === "down" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                        trendType === "neutral" && "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    )}>
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}
