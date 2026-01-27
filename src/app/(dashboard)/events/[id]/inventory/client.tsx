"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { format, subHours, addHours } from "date-fns";
import { Loader2, AlertTriangle, Package, History, Plus, Minus, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Protect, useRole } from "@/components/auth/rbac";
import { InventoryItem, Event } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrintManifest } from "./_components/print-manifest";

export default function EventInventoryClient() {
    const params = useParams();
    const eventId = params.id as string;
    const { canManageInventory } = useRole();

    const [event, setEvent] = useState<Event | null>(null);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("inventory");
    const [searchTerm, setSearchTerm] = useState("");

    // State to hold input values for all items: { [itemId]: quantity_string }
    const [inputValues, setInputValues] = useState<Record<string, string>>({});

    // Fetch Data
    const fetchData = async () => {
        try {
            const [eventRes, invRes, logsRes] = await Promise.all([
                fetch(`/api/events/${eventId}`),
                fetch("/api/inventory"),
                fetch(`/api/events/${eventId}/logs`)
            ]);

            if (!eventRes.ok) throw new Error("Event not found");
            const eventData = await eventRes.json();
            setEvent(eventData);

            const invData = await invRes.json();
            setInventory(invData);

            if (logsRes.ok) {
                const logsData = await logsRes.json();
                setLogs(logsData);
            }

        } catch (error) {
            console.error(error);
            // toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(); // Initial fetch
        const interval = setInterval(() => {
            fetchData(); // Poll everything (Inventory + Logs)
        }, 3000);

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
            return true;
        } catch (error: any) {
            console.error(error);
            // toast.error(error.message);
            return false;
        }
    };

    const handleBulkAction = async (action: "ISSUE" | "RETURN") => {
        const updates: Promise<any>[] = [];
        const itemsToUpdate: string[] = [];

        Object.entries(inputValues).forEach(([itemId, qtyStr]) => {
            const qty = parseInt(qtyStr);
            if (qty > 0) {
                itemsToUpdate.push(itemId);
                updates.push(handleUpdate(itemId, action, qty));
            }
        });

        if (updates.length === 0) {
            toast.info("No quantity entered for any item.");
            return;
        }

        toast.promise(Promise.all(updates), {
            loading: `Processing ${action === "ISSUE" ? "Dispatch" : "Return"} for ${updates.length} items...`,
            success: () => {
                fetchData();
                // Clear inputs for successful items or all? Clear all for simplicity
                setInputValues({});
                return `Successfully ${action === "ISSUE" ? "Dispatched" : "Returned"} items.`;
            },
            error: "Some updates failed. Check logs."
        });
    };

    const handleSingleAction = async (itemId: string, action: "ISSUE" | "RETURN" | "LOSS", quantity: number) => {
        const success = await handleUpdate(itemId, action, quantity);
        if (success) {
            toast.success(`${action} successful`);
            fetchData();
            // Clear specific input if it was an issue/return
            if (action !== "LOSS") {
                setInputValues(prev => ({ ...prev, [itemId]: "" }));
            }
        } else {
            toast.error("Failed to update");
        }
    }


    // Memoize stats for performance and filtering
    const itemStats = useMemo(() => {
        const statsMap = new Map<string, { issued: number, returned: number, lost: number, deficit: number }>();
        inventory.forEach(item => {
            const itemLogs = logs.filter(log => (log.details?.itemId === item.id) || (log.itemId === item.id));
            let issued = 0, returned = 0, lost = 0;
            itemLogs.forEach(log => {
                const qty = log.details?.quantity || log.quantity || 0;
                if (log.action.includes("ISSUE") || log.action.includes("REMOVED")) issued += qty;
                else if (log.action.includes("RETURN") || log.action.includes("RETURNED")) returned += qty;
                else if (log.action.includes("LOSS") || log.action.includes("LOSS")) lost += qty;
            });
            statsMap.set(item.id, { issued, returned, lost, deficit: issued - returned - lost });
        });
        return statsMap;
    }, [inventory, logs]);

    // Filter items
    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase());

        // If searching, show all matches. If not searching, show only active items.
        if (searchTerm) return matchesSearch;

        const stats = itemStats.get(item.id);
        const hasActivity = (stats?.issued || 0) > 0 || (stats?.returned || 0) > 0 || (stats?.lost || 0) > 0;
        return hasActivity;
    });

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>;
    if (!event) return <div className="p-10 text-center">Event not found</div>;

    const isCancelled = event.status === "CANCELLED";

    return (
        <>
            <div className="container mx-auto p-4 max-w-7xl pb-24 space-y-8 print:hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventory Control</h1>
                        <p className="text-slate-500 flex items-center gap-2 mt-1">
                            <span className="font-semibold">{event.name}</span>
                            <span>•</span>
                            <span>{format(new Date(event.occasionDate), "PPP")}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()}>Print Checklist</Button>
                    </div>
                </div>

                {isCancelled && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">Event is Cancelled. You can still manage inventory for reconciliation.</span>
                    </div>
                )}

                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-4 z-40 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-slate-50 border-slate-200"
                        />
                    </div>

                    <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block"></div>

                    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab("inventory")}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "inventory" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Inventory List
                        </button>
                        <button
                            onClick={() => setActiveTab("logs")}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "logs" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Log History
                        </button>
                    </div>
                </div>

                {activeTab === "inventory" ? (
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="w-[250px] font-bold text-slate-700">Item Name</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-center">In Stock</TableHead>
                                        <TableHead className="font-bold text-indigo-700 text-center">Issued</TableHead>
                                        <TableHead className="font-bold text-emerald-700 text-center">Returned</TableHead>
                                        <TableHead className="font-bold text-amber-700 text-center">Pending</TableHead>
                                        <TableHead className="text-right font-bold text-slate-700 pr-8">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInventory.map((item) => {
                                        const stats = itemStats.get(item.id) || { issued: 0, returned: 0, lost: 0, deficit: 0 };
                                        const isDeficit = stats.deficit > 0;
                                        return (
                                            <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{item.name}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{item.category}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-slate-600 font-medium">{item.availableQuantity}</TableCell>
                                                <TableCell className="text-center font-mono text-indigo-700 font-bold">{stats.issued}</TableCell>
                                                <TableCell className="text-center font-mono text-emerald-700 font-bold">{stats.returned}</TableCell>
                                                <TableCell className="text-center">
                                                    {isDeficit ? (
                                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap">
                                                            {stats.deficit} Pending
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {canManageInventory && (
                                                        <div className="flex items-center justify-end gap-3">
                                                            <QuickActionRow
                                                                qtyValue={inputValues[item.id] || ""}
                                                                onQtyChange={(val) => setInputValues(prev => ({ ...prev, [item.id]: val }))}
                                                                onDispatch={(qty) => handleSingleAction(item.id, "ISSUE", qty)}
                                                                onReturn={(qty) => handleSingleAction(item.id, "RETURN", qty)}
                                                                deficit={stats.deficit}
                                                                onReportLoss={(qty) => handleSingleAction(item.id, "LOSS", qty)}
                                                            />
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        {canManageInventory && (
                            <div className="flex justify-end gap-3 pb-8">
                                <Button
                                    onClick={() => handleBulkAction("ISSUE")}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                >
                                    Issue All
                                </Button>
                                <Button
                                    onClick={() => handleBulkAction("RETURN")}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                >
                                    Return All
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-0 divide-y divide-slate-100">
                            {logs.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">No activity recorded for this event yet.</div>
                            ) : (
                                logs.map((log, i) => {
                                    const isIssue = log.action.includes("ISSUE") || log.action.includes("REMOVED");
                                    const isReturn = log.action.includes("RETURN");
                                    const isLoss = log.action.includes("LOSS");

                                    return (
                                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isIssue ? "bg-indigo-100 text-indigo-600" :
                                                    isReturn ? "bg-emerald-100 text-emerald-600" :
                                                        "bg-red-100 text-red-600"
                                                    }`}>
                                                    {log.action.includes("REMOVED") ? "I" : log.action[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        <span className="font-bold">{log.userName}</span>
                                                        <span className="text-slate-500 font-normal mx-1">
                                                            {isIssue ? "dispatched" :
                                                                isReturn ? "returned" : "reported lost"}
                                                        </span>
                                                        <span className="font-bold text-slate-900">
                                                            {log.details?.quantity || log.quantity} {log.details?.itemName || log.itemName}
                                                        </span>
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{format(new Date(log.timestamp), "PP p")}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] text-slate-400">{log.action}</Badge>
                                        </div>
                                    )
                                })
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
            <PrintManifest event={event} inventory={inventory} itemStats={itemStats} />
        </>
    );
}

interface QuickActionRowProps {
    qtyValue: string;
    onQtyChange: (val: string) => void;
    onDispatch: (q: number) => void;
    onReturn: (q: number) => void;
    deficit: number;
    onReportLoss: (q: number) => void;
}

function QuickActionRow({ qtyValue, onQtyChange, onDispatch, onReturn, deficit, onReportLoss }: QuickActionRowProps) {

    const handleAction = (type: "dispatch" | "return") => {
        const val = parseInt(qtyValue);
        if (!val || val <= 0) return;

        if (type === "dispatch") onDispatch(val);
        else onReturn(val);
    };

    return (
        <div className="flex items-center gap-2">
            {deficit > 0 && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-700 hover:bg-red-50"
                    title="Report Loss"
                    onClick={() => {
                        if (confirm(`Report missing items?`)) onReportLoss(deficit);
                    }}
                >
                    <AlertCircle className="h-4 w-4" />
                </Button>
            )}

            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                <input
                    type="number"
                    className="w-16 bg-transparent text-center text-sm font-semibold focus:outline-none placeholder:text-slate-400"
                    placeholder="Qty"
                    value={qtyValue}
                    onChange={(e) => onQtyChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && qtyValue) {
                            // Optionally handle enter key here
                        }
                    }}
                />
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <div className="flex gap-1">
                    <Button
                        size="sm"
                        className="h-7 px-2 bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 shadow-sm text-xs font-bold"
                        title="Dispatch (Issue)"
                        onClick={() => handleAction("dispatch")}
                    >
                        Out
                    </Button>
                    <Button
                        size="sm"
                        className="h-7 px-2 bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 shadow-sm text-xs font-bold"
                        title="Return"
                        onClick={() => handleAction("return")}
                    >
                        In
                    </Button>
                </div>
            </div>
        </div>
    )
}
