"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Loader2, ChevronRight, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

export default function SyncDataClient() {
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async (direction: "firestore-to-neon" | "neon-to-firestore") => {
        setIsSyncing(true);
        try {
            const res = await fetch(`/api/admin/sync/${direction}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    collections: ["users", "events", "inventory", "settings"]
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(`Sync successful: ${JSON.stringify(data.results)}`);
            } else {
                throw new Error(data.error || "Sync failed");
            }
        } catch (error) {
            toast.error("Sync operation failed");
            console.error(error);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <PageHeader
                title="Database Synchronization"
                description="Sync data between Firestore (Legacy) and Neon PostgreSQL (New)."
                backUrl="/settings"
            />

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-indigo-600" />
                        <CardTitle>Sync Options</CardTitle>
                    </div>
                    <CardDescription>
                        Manually trigger synchronization processes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SyncStatsPanel onSync={handleSync} isSyncing={isSyncing} />
                </CardContent>
            </Card>
        </div>
    );
}

function SyncStatsPanel({ onSync, isSyncing }: { onSync: (dir: "firestore-to-neon" | "neon-to-firestore") => void, isSyncing: boolean }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/sync/stats");
            if (res.ok) setStats(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [isSyncing]); // Refetch after sync

    if (loading && !stats) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" /></div>;

    const renderStatRow = (label: string, neonKey: string, fsKey: string) => {
        const neon = stats?.neon?.[neonKey] || 0;
        const fs = stats?.firestore?.[fsKey] || 0;
        const diff = Math.abs(neon - fs);

        return (
            <div className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <span className="text-slate-600">{label}</span>
                <div className="flex items-center gap-4">
                    <div className="text-center w-16">
                        <span className="text-xs text-slate-400 block">Neon</span>
                        <span className="font-mono font-medium">{neon}</span>
                    </div>
                    <div className="text-center w-16">
                        <span className="text-xs text-slate-400 block">Firestore</span>
                        <span className="font-mono font-medium">{fs}</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold w-16 text-center ${diff === 0 ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}>
                        {diff === 0 ? "Synced" : `${diff} diff`}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Firestore -> Neon */}
                <div className="border rounded-xl p-4 space-y-4 bg-slate-50/50 flex flex-col h-full">
                    <div>
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            Firestore <ChevronRight className="h-4 w-4 text-slate-400" /> Neon PostgreSQL
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 mb-4">
                            Pull data from Legacy Firestore to New System.
                        </p>
                        <div className="bg-white rounded-lg border p-3 mb-4 space-y-1">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Record Mismatches</h4>
                            {renderStatRow("Users", "users", "users")}
                            {renderStatRow("Events", "events", "events")}
                            {renderStatRow("Inventory", "inventory", "inventory")}
                            {renderStatRow("Halls", "halls", "halls")}
                            {renderStatRow("Caterers", "caterers", "caterers")}
                        </div>
                    </div>
                    <div className="mt-auto">
                        <Button
                            id="btn-data-sync-neon"
                            onClick={() => onSync("firestore-to-neon")}
                            disabled={isSyncing}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Sync to Neon
                        </Button>
                    </div>
                </div>

                {/* Neon -> Firestore */}
                <div className="border rounded-xl p-4 space-y-4 bg-slate-50/50 flex flex-col h-full">
                    <div>
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            Neon PostgreSQL <ChevronRight className="h-4 w-4 text-slate-400" /> Firestore
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 mb-4">
                            Push new data to Legacy System (Backup).
                        </p>
                        {/* Summary Block */}
                        <div className="bg-white rounded-lg border p-4 mb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Database className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-900">Total Records (Neon)</div>
                                    <div className="text-2xl font-bold font-mono">
                                        {(stats?.neon?.users || 0) + (stats?.neon?.events || 0) + (stats?.neon?.inventory || 0)}
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-slate-500">
                                This count will be pushed to Firestore, overwriting matching IDs.
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto">
                        <Button
                            id="btn-data-sync-firestore"
                            onClick={() => onSync("neon-to-firestore")}
                            disabled={isSyncing}
                            variant="outline"
                            className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        >
                            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Sync to Firestore
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
