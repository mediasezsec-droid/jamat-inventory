"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Edit, Printer, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Event, InventoryItem } from "@/types";
import { useSession } from "next-auth/react";
import { RBACWrapper } from "@/components/rbac-wrapper";

interface EventDetailsClientProps {
    initialEvent: Event;
    initialInventory: InventoryItem[];
    initialLogs: any[];
}

export default function EventDetailsClient({ initialEvent, initialInventory, initialLogs }: EventDetailsClientProps) {
    const router = useRouter();
    const { data: session } = useSession();

    const [event, setEvent] = useState<Event>(initialEvent);
    const [inventory] = useState<InventoryItem[]>(initialInventory);
    const [logs] = useState<any[]>(initialLogs);

    const getItemStats = (itemId: string) => {
        const itemLogs = logs.filter(log => log.itemId === itemId);
        const issued = itemLogs.filter(log => log.action === "ISSUE").reduce((acc, log) => acc + log.quantity, 0);
        const returned = itemLogs.filter(log => log.action === "RETURN").reduce((acc, log) => acc + log.quantity, 0);
        const lost = itemLogs.filter(log => log.action === "LOSS").reduce((acc, log) => acc + log.quantity, 0);
        const deficit = issued - returned - lost;
        return { issued, returned, lost, deficit };
    };

    // Filter inventory to only show items that were used (issued > 0)
    const usedInventory = inventory.filter(item => {
        const stats = getItemStats(item.id);
        return stats.issued > 0;
    });

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [relatedData, setRelatedData] = useState<{ count: number } | null>(null);

    // Cancel Event
    const handleCancelEvent = async () => {
        if (!confirm("Are you sure you want to CANCEL this event? Inventory management will be locked.")) return;

        try {
            const res = await fetch(`/api/events/${event.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "CANCELLED" }),
            });

            if (res.ok) {
                setEvent(prev => ({ ...prev, status: "CANCELLED" }));
            }
        } catch (error) {
            console.error("Failed to cancel event", error);
        }
    };

    // Delete Event
    const handleDeleteEvent = async (force = false) => {
        try {
            const res = await fetch(`/api/events/${event.id}${force ? "?force=true" : ""}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.push("/");
                return;
            }

            if (res.status === 409) {
                const data = await res.json();
                setRelatedData(data);
                setDeleteConfirmOpen(true);
            }
        } catch (error) {
            console.error("Failed to delete event", error);
        }
    };

    const isAdmin = (session?.user as any)?.role === "ADMIN";
    const isCancelled = event.status === "CANCELLED";

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header with gradient background */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-8 text-white shadow-xl">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push("/")}
                                className="text-white/80 hover:text-white hover:bg-white/10"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold">{event.name}</h1>
                                    {isCancelled && <Badge variant="destructive" className="bg-red-500">CANCELLED</Badge>}
                                </div>
                                <p className="text-white/70 mt-1">{event.description} • {format(new Date(event.occasionDate), "PPP")}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                id="btn-event-print"
                                variant="secondary"
                                onClick={() => router.push(`/events/${event.id}/print`)}
                                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                            >
                                <Printer className="mr-2 h-4 w-4" /> Print Form
                            </Button>
                            <Button
                                id="btn-event-inventory-manage"
                                onClick={() => router.push(`/events/${event.id}/inventory`)}
                                className="bg-white text-indigo-700 hover:bg-white/90"
                            >
                                <Package className="mr-2 h-4 w-4" /> Manage Inventory
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Actions */}
            <div className="flex gap-2 justify-end">
                <RBACWrapper componentId="btn-event-edit">
                    <Button
                        id="btn-event-edit"
                        onClick={() => router.push(`/events/${event.id}/edit`)}
                        disabled={isCancelled}
                        className="btn-gradient-primary"
                    >
                        <Edit className="mr-2 h-4 w-4" /> Edit Event
                    </Button>
                </RBACWrapper>

                {!isCancelled && (
                    <RBACWrapper componentId="btn-event-cancel">
                        <Button id="btn-event-cancel" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={handleCancelEvent}>
                            Cancel Event
                        </Button>
                    </RBACWrapper>
                )}

                <RBACWrapper componentId="btn-event-delete">
                    <Button id="btn-event-delete" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDeleteEvent(false)}>
                        Delete
                    </Button>
                </RBACWrapper>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="md:col-span-2 stat-card stat-card-indigo">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Event Details</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <span className="text-sm text-slate-500 block mb-1">Mobile</span>
                            <span className="font-semibold text-slate-900">{event.mobile}</span>
                        </div>
                        <div>
                            <span className="text-sm text-slate-500 block mb-1">Time</span>
                            <span className="font-semibold text-slate-900">{event.occasionTime}</span>
                        </div>
                        <div>
                            <span className="text-sm text-slate-500 block mb-1">Hall</span>
                            <span className="font-semibold text-slate-900">{Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}</span>
                        </div>
                        <div>
                            <span className="text-sm text-slate-500 block mb-1">Caterer</span>
                            <span className="font-semibold text-slate-900">{event.catererName} ({event.catererPhone})</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-sm text-slate-500 block mb-1">Menu</span>
                            <p className="font-medium text-slate-700 whitespace-pre-wrap">{event.menu || "No menu specified"}</p>
                        </div>
                    </div>
                </div>

                {/* Requirements Summary */}
                <div className="stat-card stat-card-amber">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Requirements</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Thaal Count</span>
                            <span className="text-2xl font-bold text-slate-900">{event.thaalCount}</span>
                        </div>
                        <div className="section-divider" />
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Sarkari Sets</span>
                            <span className="text-xl font-bold text-slate-900">{event.sarkariThaalSet}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Tables/Chairs</span>
                            <span className="text-xl font-bold text-slate-900">{event.tablesAndChairs}</span>
                        </div>
                        <div className="section-divider" />
                        <div className="flex flex-wrap gap-2">
                            {event.mic && <Badge className="badge-gradient-indigo">Mic</Badge>}
                            {event.bhaiSaabIzzan && <Badge className="badge-gradient-amber">Bhai Saab Izzan</Badge>}
                            {event.benSaabIzzan && <Badge className="badge-gradient-amber">Ben Saab Izzan</Badge>}
                            {event.crockeryRequired && <Badge className="badge-gradient-emerald">Crockery</Badge>}
                            {event.masjidLight && <Badge className="badge-gradient-indigo">Masjid Light</Badge>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Usage Table */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Inventory Usage & Reconciliation</CardTitle>
                </CardHeader>
                <CardContent>
                    {usedInventory.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            No inventory items have been issued for this event yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Issued</TableHead>
                                    <TableHead>Returned</TableHead>
                                    <TableHead>Lost / Broken</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usedInventory.map(item => {
                                    const stats = getItemStats(item.id);
                                    const isSettled = stats.deficit === 0;
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{stats.issued}</TableCell>
                                            <TableCell>{stats.returned}</TableCell>
                                            <TableCell className={stats.lost > 0 ? "text-red-600 font-bold" : ""}>{stats.lost}</TableCell>
                                            <TableCell>
                                                {isSettled ? (
                                                    <Badge className="bg-green-500 hover:bg-green-600">Settled</Badge>
                                                ) : (
                                                    <Badge variant="destructive">Deficit: {stats.deficit}</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="bg-red-100 p-2 rounded-full">
                                <AlertTriangleIcon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold">Related Data Found</h3>
                        </div>
                        <p className="text-slate-600">
                            This event has <strong>{relatedData?.count} inventory logs</strong> associated with it.
                            Deleting this event will permanently remove the event and all its history.
                        </p>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-sm text-red-800">
                            <strong>Warning:</strong> This action cannot be undone.
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={() => handleDeleteEvent(true)}>Yes, Delete Everything</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AlertTriangleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
        </svg>
    )
}
