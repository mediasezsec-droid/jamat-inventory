"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Search, RotateCcw, AlertTriangle, Package, Calendar, User, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { useRouter } from "next/navigation"; // Added import
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";

interface LostItemLog {
    id: string;
    action: string;
    timestamp: number;
    details: {
        itemId: string;
        quantity: number;
        eventId?: string;
        eventIdName?: string;
        itemName?: string;
    };
    userName: string;
    eventName: string;
    remainingQuantity?: number;
}

interface LostItemsClientProps {
    initialLogs: LostItemLog[];
}

export default function LostItemsClient({ initialLogs }: LostItemsClientProps) {
    const router = useRouter();
    const [logs, setLogs] = useState<LostItemLog[]>(initialLogs);
    const [searchTerm, setSearchTerm] = useState("");

    // Recovery State
    const [isRecovering, setIsRecovering] = useState(false);
    const [selectedLog, setSelectedLog] = useState<LostItemLog | null>(null);
    const [recoverQty, setRecoverQty] = useState<number>(1);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        setLogs(initialLogs);
    }, [initialLogs]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.refresh();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const handleRecoverClick = (log: LostItemLog) => {
        const remaining = log.remainingQuantity ?? log.details.quantity;

        if (remaining === 1) {
            executeRecover(log, 1);
            return;
        }

        setSelectedLog(log);
        setRecoverQty(remaining);
        setIsDrawerOpen(true);
    };

    const executeRecover = async (log: LostItemLog, quantity: number) => {
        setIsRecovering(true);
        try {
            const res = await fetch("/api/inventory/recover", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemId: log.details.itemId,
                    quantity: quantity,
                    eventId: log.details.eventId,
                    logId: log.id
                }),
            });

            if (!res.ok) throw new Error("Recovery failed");

            toast.success(`Recovered ${quantity} items successfully`);
            setIsDrawerOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to recover item");
        } finally {
            setIsRecovering(false);
            setSelectedLog(null);
        }
    };

    const confirmRecovery = () => {
        if (!selectedLog) return;
        const remaining = selectedLog.remainingQuantity ?? selectedLog.details.quantity;

        if (recoverQty <= 0 || recoverQty > remaining) {
            toast.error(`Please enter a valid quantity (1-${remaining})`);
            return;
        }

        executeRecover(selectedLog, recoverQty);
    };

    const filteredLogs = logs.filter(log =>
        (log.details.itemName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.eventName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalLostItems = logs.reduce((sum, log) => sum + (log.remainingQuantity ?? log.details.quantity), 0);

    if (false) return null; // Logic removed

    return (
        <div className="container mx-auto p-6 md:p-10 max-w-[1600px] space-y-10">
            <PageHeader
                title="Lost Items Recovery"
                description="Track and recover items reported as lost or damaged across events."
                actions={
                    <Button variant="outline" onClick={handleRefresh} className="rounded-lg" disabled={isRefreshing}>
                        <RotateCcw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                        Refresh
                    </Button>
                }
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Lost Items</p>
                            <p className="text-2xl font-bold text-red-600">{totalLostItems}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Incidents</p>
                            <p className="text-2xl font-bold text-amber-600">{logs.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 col-span-2 md:col-span-1">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Search Results</p>
                            <p className="text-2xl font-bold text-emerald-600">{filteredLogs.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search by item or event name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 rounded-lg bg-white border-slate-200"
                />
            </div>

            {/* Table */}
            {logs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-700">No lost items!</p>
                            <p className="text-sm text-slate-400">All items have been recovered or none reported</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                                <TableHead className="h-14 font-semibold text-slate-700 pl-6">Item</TableHead>
                                <TableHead className="h-14 font-semibold text-slate-700">Event</TableHead>
                                <TableHead className="h-14 font-semibold text-slate-700">Reported By</TableHead>
                                <TableHead className="h-14 font-semibold text-slate-700 text-center">Date</TableHead>
                                <TableHead className="h-14 font-semibold text-red-700 text-center">Lost Qty</TableHead>
                                <TableHead className="h-14 font-semibold text-slate-700 text-right pr-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.map((log, idx) => {
                                const remaining = log.remainingQuantity ?? log.details.quantity;
                                const original = log.details.quantity;
                                return (
                                    <TableRow
                                        key={log.id}
                                        className={cn(
                                            "border-b border-slate-100 transition-colors hover:bg-slate-50",
                                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                                        )}
                                    >
                                        <TableCell className="py-5 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-red-600" />
                                                </div>
                                                <span className="font-medium text-slate-900">{log.details.itemName || "Unknown"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                                {log.eventName}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                    {log.userName?.charAt(0).toUpperCase() || "?"}
                                                </div>
                                                <span className="text-sm text-slate-600">{log.userName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-center text-sm text-slate-500">
                                            {format(new Date(log.timestamp), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="py-4 text-center">
                                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border border-red-200 font-mono">
                                                {remaining} / {original}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5 text-right pr-6">
                                            <Button
                                                size="sm"
                                                onClick={() => handleRecoverClick(log)}
                                                disabled={isRecovering}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Recover
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Recovery Drawer */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent className="px-4 pb-8">
                    <DrawerHeader className="text-center pt-6">
                        <DrawerTitle className="text-xl font-bold">Recover Lost Items</DrawerTitle>
                        <DrawerDescription className="text-slate-500 mt-2">
                            How many of <strong className="text-slate-900">{selectedLog?.details.itemName}</strong> were found?
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="px-4 py-4">
                        <Label className="text-sm text-slate-600 mb-2 block">
                            Quantity Found (Max: {selectedLog?.remainingQuantity ?? selectedLog?.details.quantity})
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            max={selectedLog?.remainingQuantity ?? selectedLog?.details.quantity}
                            value={recoverQty}
                            onChange={(e) => setRecoverQty(parseInt(e.target.value) || 0)}
                            className="h-12 text-center text-lg font-bold rounded-xl"
                        />
                    </div>

                    <DrawerFooter className="flex flex-col gap-3 mt-2">
                        <Button
                            onClick={confirmRecovery}
                            disabled={isRecovering}
                            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isRecovering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Confirm Recovery
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full h-12 rounded-xl border-slate-300">
                                Cancel
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
