"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

export default function HealthCheckClient() {
    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <PageHeader
                title="System Health"
                description="Check database latency and connectivity."
                backUrl="/settings"
            />

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <CardTitle>Health Status</CardTitle>
                    </div>
                    <CardDescription>Real-time system performance metrics.</CardDescription>
                </CardHeader>
                <CardContent>
                    <HealthCheckPanel />
                </CardContent>
            </Card>
        </div>
    );
}

function HealthCheckPanel() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const checkHealth = async () => {
        setLoading(true);
        try {
            const start = performance.now();
            const res = await fetch("/api/health");
            const data = await res.json();
            const end = performance.now();

            setStatus({
                ...data,
                clientLatency: Math.round(end - start)
            });
            if (res.ok) toast.success("System is healthy");
            else toast.error("System health check failed");
        } catch (error) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkHealth();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                <div>
                    <h3 className="font-medium text-slate-900">Connection Status</h3>
                    <p className="text-sm text-slate-500">
                        {status ? (status.status === "ok" ? "All Systems Operational" : "System Issues Detected") : "Checking..."}
                    </p>
                </div>
                <Button id="btn-health-ping" onClick={checkHealth} disabled={loading} variant="outline" className="border-green-200 hover:bg-green-50 text-green-700">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Ping Neon DB
                </Button>
            </div>

            {status && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-white shadow-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Neon PostgreSQL</h4>
                        <div className="text-2xl font-mono font-bold text-slate-800">
                            {status.database?.latencyMs !== undefined ? `${status.database.latencyMs}ms` : "N/A"}
                        </div>
                        <div className="text-xs text-green-600 mt-1 flex items-center">
                            {status.database?.status === "connected" && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>}
                            {status.database?.status === "connected" ? "Connected" : <span className="text-red-500">Error</span>}
                        </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-white shadow-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Firebase RTDB</h4>
                        <div className="text-2xl font-mono font-bold text-slate-800">
                            {status.rtdb?.latencyMs !== undefined ? `${status.rtdb.latencyMs}ms` : "N/A"}
                        </div>
                        <div className="text-xs text-green-600 mt-1 flex items-center">
                            {status.rtdb?.status === "connected" && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>}
                            {status.rtdb?.status === "connected" ? "Connected" : <span className="text-red-500">Error</span>}
                        </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-white shadow-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Client Latency</h4>
                        <div className="text-2xl font-mono font-bold text-slate-800">
                            {status.clientLatency ? `${status.clientLatency}ms` : "N/A"}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Total Roundtrip</div>
                    </div>
                </div>
            )}
        </div>
    );
}
