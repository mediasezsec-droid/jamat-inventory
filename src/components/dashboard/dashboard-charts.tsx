
"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";
import { cn } from "@/lib/utils";

// Theme constants matching new global CSS variables
const colors = {
    primary: "#4f46e5",
    secondary: "#10b981",
    tertiary: "#f59e0b",
    quaternary: "#ef4444",
    quinary: "#8b5cf6",
    grid: "#e5e7eb",
    text: "#6b7280"
};

interface RevenueChartProps {
    data: any[];
    className?: string;
}

export function RevenueChart({ data, className }: RevenueChartProps) {
    return (
        <div className={cn("bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6", className)}>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">Revenue Overview</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="name"
                            stroke={colors.text}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            padding={{ left: 10, right: 10 }}
                        />
                        <YAxis
                            stroke={colors.text}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                            }}
                            itemStyle={{ color: "#111827", fontWeight: 600 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke={colors.primary}
                            strokeWidth={3}
                            dot={{ r: 4, fill: colors.primary, strokeWidth: 0 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

interface ServicesChartProps {
    data: any[];
    className?: string;
}

export function ServicesChart({ data, className }: ServicesChartProps) {
    const COLORS = [colors.primary, colors.secondary, colors.tertiary, colors.quaternary, colors.quinary];

    return (
        <div className={cn("bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col", className)}>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">Service Distribution</h3>
            <div className="flex-1 min-h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                            }}
                            itemStyle={{ color: "#111827", fontWeight: 600 }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
