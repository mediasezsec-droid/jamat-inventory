"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format, subHours, addHours } from "date-fns";
import { Loader2, AlertTriangle, Package, History, Plus, Minus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Protect, useRole } from "@/components/auth/rbac";
import { InventoryItem, Event } from "@/types";

export default function EventInventoryPage() {
    const params = useParams();
    const eventId = params.id as string;
    const { canManageInventory } = useRole();

    const [event, setEvent] = useState<Event | null>(null);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);
    const [activeTab, setActiveTab] = useState("inventory");

    // Fetch Data
    const fetchData = async () => {
        try {
            // Fetch Event
            const eventRes = await fetch(`/api/events/${eventId}`);
            if (!eventRes.ok) throw new Error("Event not found");
            const eventData = await eventRes.json();
            setEvent(eventData);

            // Check time constraints
            const eventDate = new Date(eventData.occasionDate);
            const now = new Date();
            const dayStart = new Date(eventDate); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(eventDate); dayEnd.setHours(23, 59, 59, 999);
            const allowedStart = subHours(dayStart, 3);
            const allowedEnd = addHours(dayEnd, 3);
            setIsAllowed(now >= allowedStart && now <= allowedEnd);

            // Fetch Inventory
            const invRes = await fetch("/api/inventory");
            const invData = await invRes.json();
            setInventory(invData);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Polling for logs (every 3 seconds)
        const fetchLogs = async () => {
            try {
                const logsRes = await fetch(`/api/events/${eventId}/logs`);
                if (logsRes.ok) {
                    const logsData = await logsRes.json();
                    setLogs(logsData);
                }
            } catch (error) {
                console.error("Failed to fetch logs", error);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 3000);

        return () => clearInterval(interval);
    }, [eventId]);

    const handleUpdate = async (itemId: string, action: "ISSUE" | "RETURN" | "LOSS", quantity: number) => {
        if (quantity <= 0) return;
        try {
            const res = await fetch(`/api/events/${eventId}/inventory`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId, quantity, action }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update");
            }

            toast.success(`${action} successful`);
            // No need to fetch logs manually, RTDB listener will update
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const getItemStats = (itemId: string) => {
        const itemLogs = logs.filter(log => (log.details?.itemId === itemId) || (log.itemId === itemId));

        let issued = 0;
        let returned = 0;
        let lost = 0;

        itemLogs.forEach(log => {
            const qty = log.details?.quantity || log.quantity || 0;
            if (log.action === "ISSUE" || log.action === "INVENTORY_REMOVED") {
                issued += qty;
            } else if (log.action === "RETURN" || log.action === "INVENTORY_RETURNED") {
                returned += qty;
            } else if (log.action === "LOSS" || log.action === "INVENTORY_LOSS") {
                lost += qty;
            }
        });

        const deficit = issued - returned - lost;
        return { issued, returned, lost, deficit };
    };

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-amber-600" /></div>;
    if (!event) return <div className="p-10 text-center">Event not found</div>;

    return (
        <div className="container mx-auto p-4 max-w-5xl space-y-6 pb-24">
            <PageHeader
                title="Event Inventory"
                description={`${event.name} - ${format(new Date(event.occasionDate), "PPP")}`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()}>Print Checklist</Button>
                    </div>
                }
            />

            {!isAllowed && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-800 mb-6">
                    <AlertTriangle className="h-5 w-5 mt-0.5" />
                    <div>
                        <h3 className="font-semibold">Read-Only Mode</h3>
                        <p className="text-sm opacity-90">Inventory management is only allowed on the day of the event (with 3hr buffer).</p>
                    </div>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="inventory" className="flex items-center gap-2">
                        <Package className="h-4 w-4" /> Inventory
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="flex items-center gap-2">
                        <History className="h-4 w-4" /> Logs
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inventory" className="space-y-4">
                    {inventory.map(item => {
                        const stats = getItemStats(item.id);
                        return (
                            <Card key={item.id} className="overflow-hidden">
                                <CardHeader className="bg-slate-50 pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{item.name}</CardTitle>
                                            <p className="text-sm text-slate-500 capitalize">{item.category}</p>
                                        </div>
                                        <Badge variant={stats.deficit > 0 ? "destructive" : "secondary"} className="text-sm px-3 py-1">
                                            Deficit: {stats.deficit}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="grid grid-cols-3 gap-4 text-center mb-6">
                                        <div className="bg-slate-50 p-2 rounded">
                                            <p className="text-xs text-slate-500 uppercase">Available</p>
                                            <p className="text-xl font-bold text-slate-700">{item.availableQuantity}</p>
                                        </div>
                                        <div className="bg-amber-50 p-2 rounded">
                                            <p className="text-xs text-amber-600 uppercase">Issued</p>
                                            <p className="text-xl font-bold text-amber-700">{stats.issued}</p>
                                        </div>
                                        <div className="bg-green-50 p-2 rounded">
                                            <p className="text-xs text-green-600 uppercase">Returned</p>
                                            <p className="text-xl font-bold text-green-700">{stats.returned}</p>
                                        </div>
                                    </div>

                                    {canManageInventory && isAllowed && (
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <QuickAction
                                                    label="Issue"
                                                    variant="default"
                                                    onAction={(qty) => handleUpdate(item.id, "ISSUE", qty)}
                                                />
                                                <QuickAction
                                                    label="Return"
                                                    variant="outline"
                                                    onAction={(qty) => handleUpdate(item.id, "RETURN", qty)}
                                                />
                                            </div>
                                            {stats.deficit > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
                                                    onClick={() => {
                                                        if (confirm(`Report ${stats.deficit} items as LOST?`)) {
                                                            handleUpdate(item.id, "LOSS", stats.deficit);
                                                        }
                                                    }}
                                                >
                                                    Report {stats.deficit} Lost Items
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </TabsContent>

                <TabsContent value="logs">
                    <Card>
                        <CardContent className="p-0">
                            {logs.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">No logs found for this event.</div>
                            ) : (
                                <div className="divide-y">
                                    {logs.map((log, i) => (
                                        <div key={i} className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {log.userName}
                                                    <span className="text-slate-500 font-normal"> {log.action.replace("INVENTORY_", "").toLowerCase()} </span>
                                                    {log.details?.quantity || log.quantity} {log.details?.itemName || log.itemName}
                                                </p>
                                                <p className="text-xs text-slate-400">{format(new Date(log.timestamp), "PP p")}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">{log.action.replace("INVENTORY_", "")}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function QuickAction({ label, variant, onAction }: { label: string, variant: "default" | "outline", onAction: (qty: number) => void }) {
    const [qty, setQty] = useState("");

    return (
        <div className="flex-1 flex gap-1">
            <Input
                type="number"
                placeholder="Qty"
                className="w-16 text-center"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
            />
            <Button
                variant={variant}
                className="flex-1"
                onClick={() => {
                    const val = parseInt(qty);
                    if (val > 0) {
                        onAction(val);
                        setQty("");
                    }
                }}
            >
                {label}
            </Button>
        </div>
    );
}
