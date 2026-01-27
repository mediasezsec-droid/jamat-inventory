"use client";

import Link from "next/link";
import {
    Loader2,
    Building2,
    Utensils,
    Database,
    Settings,
    ChevronRight,
    RefreshCw,
    CheckCircle,
    XCircle,
    Zap,
    Server,
    Users,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface DbHealth {
    database: { status: "connected" | "error"; latencyMs: number; error?: string };
    rtdb: { status: "connected" | "error"; latencyMs: number; error?: string };
}

export function SettingsHubClient() {
    const [dbHealth, setDbHealth] = useState<DbHealth | null>(null);
    const [isCheckingHealth, setIsCheckingHealth] = useState(false);

    const checkHealth = async () => {
        setIsCheckingHealth(true);
        try {
            const res = await fetch("/api/health");
            const data = await res.json();
            setDbHealth(data);
        } catch (error) {
            toast.error("Failed to check database connectivity");
        } finally {
            setIsCheckingHealth(false);
        }
    };

    useEffect(() => {
        checkHealth();
    }, []);

    const getLatencyColor = (ms: number) => {
        if (ms < 100) return "text-emerald-600";
        if (ms < 300) return "text-amber-600";
        return "text-red-600";
    };

    const cards = [
        {
            title: "General Configuration",
            desc: "Manage global booking rules and system preferences.",
            icon: Settings,
            href: "/settings/config",
            color: "text-slate-600",
            bg: "bg-slate-100",
            gradient: "from-slate-500 to-gray-500"
        },
        {
            title: "Venues Management",
            desc: "Manage halls and locations available for events.",
            icon: Building2,
            href: "/settings/venues",
            color: "text-blue-600",
            bg: "bg-blue-50",
            gradient: "from-blue-500 to-indigo-500"
        },
        {
            title: "Caterers Management",
            desc: "Manage approved food providers and contact details.",
            icon: Utensils,
            href: "/settings/caterers",
            color: "text-amber-600",
            bg: "bg-amber-50",
            gradient: "from-amber-500 to-orange-500"
        },
        {
            title: "User Management",
            desc: "Create and manage system users and access roles.",
            icon: Users,
            href: "/settings/users",
            color: "text-violet-600",
            bg: "bg-violet-50",
            gradient: "from-violet-500 to-purple-500"
        },
        {
            title: "Data & Backup",
            desc: "Export data, restore backups, or reset the system.",
            icon: Database,
            href: "/settings/data",
            color: "text-slate-600",
            bg: "bg-slate-100",
            gradient: "from-slate-500 to-slate-600"
        }
    ];

    return (
        <div className="container mx-auto p-4 max-w-5xl space-y-8">
            <PageHeader
                title="Settings"
                description="Manage global system configuration and master data."
            />

            {/* Database Status Card */}
            <Card className="overflow-hidden">
                {/* ... (Keep existing DB status card) ... */}
                <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500"></div>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <Server className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Database Connectivity</CardTitle>
                                <CardDescription>Real-time connection status</CardDescription>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={checkHealth}
                            disabled={isCheckingHealth}
                            className="rounded-lg"
                        >
                            <RefreshCw className={cn("h-4 w-4 mr-2", isCheckingHealth && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {dbHealth ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Neon Check */}
                            <div className={cn(
                                "p-4 rounded-xl border-2 transition-all",
                                dbHealth.database?.status === "connected"
                                    ? "bg-emerald-50 border-emerald-200"
                                    : "bg-red-50 border-red-200"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {dbHealth.database?.status === "connected" ? (
                                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                                        ) : (
                                            <XCircle className="h-6 w-6 text-red-600" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-slate-900">Neon PostgreSQL</p>
                                            <p className="text-xs text-slate-500">Relational Database</p>
                                        </div>
                                    </div>
                                    {dbHealth.database?.status === "connected" && (
                                        <div className="text-right">
                                            <div className={cn("text-2xl font-bold font-mono", getLatencyColor(dbHealth.database.latencyMs))}>
                                                {dbHealth.database.latencyMs}
                                                <span className="text-sm font-normal text-slate-400 ml-0.5">ms</span>
                                            </div>
                                            <Badge className={cn(
                                                "text-xs",
                                                dbHealth.database.latencyMs < 100
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : dbHealth.database.latencyMs < 300
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-red-100 text-red-700"
                                            )}>
                                                <Zap className="h-3 w-3 mr-1" />
                                                {dbHealth.database.latencyMs < 100 ? "Fast" : dbHealth.database.latencyMs < 300 ? "Normal" : "Slow"}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                                {dbHealth.database?.error && (
                                    <p className="text-xs text-red-600 mt-2">{dbHealth.database.error}</p>
                                )}
                            </div>

                            {/* RTDB Status */}
                            <div className={cn(
                                "p-4 rounded-xl border-2 transition-all",
                                dbHealth.rtdb.status === "connected"
                                    ? "bg-emerald-50 border-emerald-200"
                                    : "bg-red-50 border-red-200"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {dbHealth.rtdb.status === "connected" ? (
                                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                                        ) : (
                                            <XCircle className="h-6 w-6 text-red-600" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-slate-900">Realtime DB</p>
                                            <p className="text-xs text-slate-500">Real-time Data</p>
                                        </div>
                                    </div>
                                    {dbHealth.rtdb.status === "connected" && (
                                        <div className="text-right">
                                            <div className={cn("text-2xl font-bold font-mono", getLatencyColor(dbHealth.rtdb.latencyMs))}>
                                                {dbHealth.rtdb.latencyMs}
                                                <span className="text-sm font-normal text-slate-400 ml-0.5">ms</span>
                                            </div>
                                            <Badge className={cn(
                                                "text-xs",
                                                dbHealth.rtdb.latencyMs < 100
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : dbHealth.rtdb.latencyMs < 300
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-red-100 text-red-700"
                                            )}>
                                                <Zap className="h-3 w-3 mr-1" />
                                                {dbHealth.rtdb.latencyMs < 100 ? "Fast" : dbHealth.rtdb.latencyMs < 300 ? "Normal" : "Slow"}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                                {dbHealth.rtdb.error && (
                                    <p className="text-xs text-red-600 mt-2">{dbHealth.rtdb.error}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-8 text-slate-400">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            Checking connectivity...
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Links Grid */}
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-slate-500" />
                    Management Areas
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {cards.map((card) => (
                        <Link key={card.href} href={card.href} className="group block h-full">
                            <Card className="h-full transition-all hover:shadow-lg border-slate-200 group-hover:border-slate-300 overflow-hidden">
                                <div className={cn("h-1.5 bg-gradient-to-r", card.gradient)}></div>
                                <CardHeader className="pb-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${card.bg}`}>
                                        <card.icon className={`h-6 w-6 ${card.color}`} />
                                    </div>
                                    <CardTitle className="text-base group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                                        {card.title}
                                        <ChevronRight className="h-4 w-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-indigo-500" />
                                    </CardTitle>
                                    <CardDescription className="text-sm">{card.desc}</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
