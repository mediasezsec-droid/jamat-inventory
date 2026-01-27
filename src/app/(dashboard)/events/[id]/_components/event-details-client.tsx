"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Edit, Printer, Package, ArrowLeft, FileText, Trash2, Calendar, Phone, MapPin, ChefHat, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Event, InventoryItem } from "@/types";
import { useSession } from "next-auth/react";
import { RBACWrapper } from "@/components/rbac-wrapper";
import { generateEventManifest } from "@/lib/pdf-generator";
import { Separator } from "@/components/ui/separator";

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
        const itemLogs = logs.filter(log => (log.itemId === itemId) || (log.details?.itemId === itemId));
        let issued = 0, returned = 0, lost = 0;

        itemLogs.forEach(log => {
            const qty = Number(log.quantity || log.details?.quantity || 0);
            const action = log.action || "";

            if (action.includes("ISSUE") || action.includes("REMOVED")) issued += qty;
            else if (action.includes("RETURN") || action.includes("RETURNED")) returned += qty;
            else if (action.includes("LOSS")) lost += qty;
        });

        const deficit = issued - returned - lost;
        return { issued, returned, lost, deficit };
    };

    // Filter inventory to only show items that were used (issued > 0)
    const usedInventory = inventory.filter(item => {
        const stats = getItemStats(item.id);
        return stats.issued > 0 || stats.returned > 0;
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
        <div className="space-y-8 max-w-7xl mx-auto p-6 md:p-8 animate-in fade-in duration-500 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push("/")}
                        className="h-10 w-10 shrink-0 rounded-full"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">{event.name}</h1>
                            {isCancelled && <Badge variant="destructive" className="h-6">CANCELLED</Badge>}
                        </div>
                        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(event.occasionDate), "PPP")} at {event.occasionTime}
                            {/* <span className="w-1 h-1 rounded-full bg-slate-300" />
                             {event.description} */}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => router.push(`/events/${event.id}/print`)}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                    <Button variant="outline" onClick={() => generateEventManifest(event, logs)}>
                        <FileText className="mr-2 h-4 w-4" /> Manifest
                    </Button>
                    <RBACWrapper componentId="btn-event-edit">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/events/${event.id}/edit`)}
                            disabled={isCancelled}
                        >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    </RBACWrapper>
                    <Button
                        onClick={() => router.push(`/events/${event.id}/inventory`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={isCancelled}
                    >
                        <Package className="mr-2 h-4 w-4" /> Manage Inventory
                    </Button>

                    <RBACWrapper componentId="btn-event-delete">
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteEvent(false)}>
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </RBACWrapper>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Column (Details) */}
                <div className="md:col-span-8 space-y-8">
                    {/* Event Meta Card */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-4 px-6 pt-6">
                            <CardTitle className="text-lg">Event Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-8 px-6 pb-8">
                            <div className="flex gap-4">
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <Phone className="h-5 w-5 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Contact</p>
                                    <p className="font-semibold text-lg">{event.mobile}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <MapPin className="h-5 w-5 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Hall / Venue</p>
                                    <p className="font-semibold leading-tight">{Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}</p>
                                </div>
                            </div>
                            <div className="sm:col-span-2 flex gap-4 border-t pt-6">
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <ChefHat className="h-5 w-5 text-slate-500" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Caterer</p>
                                        <p className="font-semibold text-lg">{event.catererName} <span className="text-slate-400 text-base font-normal">({event.catererPhone})</span></p>
                                    </div>
                                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menu selection</p>
                                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{event.menu || "No menu specified for this event."}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventory Table */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="px-6 pt-6 pb-4 md:px-8">
                            <CardTitle className="text-lg flex items-center justify-between">
                                Inventory Reconciliation
                                <Badge variant="outline" className="ml-2 font-normal">{usedInventory.length} items used</Badge>
                            </CardTitle>
                            <CardDescription>Track items issued, returned, and lost for this event.</CardDescription>
                        </CardHeader>
                        <CardContent className="px-6 pb-8 md:px-8">
                            {usedInventory.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                    <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    <p>No inventory items have been issued yet.</p>
                                    {!isCancelled && (
                                        <Button variant="link" onClick={() => router.push(`/events/${event.id}/inventory`)} className="mt-2 text-emerald-600">
                                            Start issuing items &rarr;
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>Item Name</TableHead>
                                                <TableHead className="text-center">Issued</TableHead>
                                                <TableHead className="text-center">Returned</TableHead>
                                                <TableHead className="text-center">Lost</TableHead>
                                                <TableHead className="text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {usedInventory.map(item => {
                                                const stats = getItemStats(item.id);
                                                // Settled only if fully accounted for AND no losses reported
                                                const isSettled = stats.deficit <= 0 && stats.lost === 0;
                                                const isPending = stats.deficit > 0;

                                                return (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                        <TableCell className="text-center">{stats.issued}</TableCell>
                                                        <TableCell className="text-center">{stats.returned}</TableCell>
                                                        <TableCell className={`text-center ${stats.lost > 0 ? "text-red-600 font-bold" : "text-slate-400"}`}>{stats.lost || "-"}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex flex-col items-end gap-1">
                                                                {isSettled && (
                                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Settled</Badge>
                                                                )}
                                                                {isPending && (
                                                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">Pending: {stats.deficit}</Badge>
                                                                )}
                                                                {stats.lost > 0 && (
                                                                    <Badge variant="destructive" className="h-5 text-[10px] px-1.5">{stats.lost} Lost</Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (Requirements & Sidebar) */}
                <div className="md:col-span-4 space-y-6">
                    <Card className="shadow-md border-0 bg-white ring-1 ring-slate-200 sticky top-6">
                        <CardHeader className="bg-slate-50/50 border-b px-6 py-4 md:px-8">
                            <CardTitle className="text-lg">Requirements</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-6 md:p-8 space-y-8">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Thaal Count</span>
                                    <span className="text-4xl font-bold text-slate-900">{event.thaalCount}</span>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <span className="text-xs font-medium text-slate-400 uppercase block mb-1">Sarkari Sets</span>
                                        <span className="text-2xl font-bold text-slate-700">{event.sarkariThaalSet}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-slate-400 uppercase block mb-1">Tables/Chairs</span>
                                        <span className="text-2xl font-bold text-slate-700">{event.tablesAndChairs}</span>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-4">
                                    <span className="text-xs font-medium text-slate-400 uppercase block">Special Items</span>
                                    <div className="flex flex-wrap gap-2">
                                        {((event as any).bhaiSaabIzzan) && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none px-3 py-1">Bhai Saab Izzan</Badge>}
                                        {((event as any).benSaabIzzan) && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none px-3 py-1">Ben Saab Izzan</Badge>}

                                        {event.mic && <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">Mic Required</Badge>}
                                        {(event as any).crockeryRequired && <Badge variant="secondary" className="bg-cyan-50 text-cyan-700">Crockery</Badge>}
                                        {(event as any).masjidLight && <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">Masjid Light</Badge>}

                                        {/* Missing Items Added */}
                                        {(event as any).thaalForDevri && <Badge variant="secondary" className="bg-purple-50 text-purple-700">Thaal for Devri</Badge>}
                                        {(event as any).paat && <Badge variant="secondary" className="bg-pink-50 text-pink-700">Paat Required</Badge>}
                                        {(event as any).decorations && <Badge variant="secondary" className="bg-rose-50 text-rose-700">Decorations</Badge>}

                                        {(event.extraChilamchiLota > 0) && (
                                            <Badge variant="outline" className="border-slate-300">
                                                {event.extraChilamchiLota} Extra Chilamchi/Lota
                                            </Badge>
                                        )}
                                        {((event.gasCount || 0) > 0) && (
                                            <Badge variant="outline" className="border-slate-300">
                                                {event.gasCount} Gas Cylinder{((event.gasCount || 0) > 1) ? 's' : ''}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            {(!isCancelled && (isAdmin || (session?.user as any)?.role === "MANAGER")) && (
                                <div className="bg-red-50 p-6 md:p-8 border-t border-red-100">
                                    <h4 className="text-red-800 font-semibold text-sm mb-3">Danger Zone</h4>
                                    <Button variant="outline" size="sm" className="w-full text-red-600 border-red-200 hover:bg-red-100 bg-white" onClick={handleCancelEvent}>
                                        Cancel Event
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-200 shadow-2xl ring-1 ring-slate-900/5">
                        <div className="flex items-center gap-4 text-red-600">
                            <div className="bg-red-100 p-3 rounded-full shrink-0">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Related Data Found</h3>
                                <p className="text-slate-500 text-sm">Cannot simply delete this event.</p>
                            </div>
                        </div>
                        <div className="text-slate-600 text-sm leading-relaxed">
                            <p className="mb-2">This event has <strong>{relatedData?.count} inventory logs</strong> associated with it.</p>
                            <p>Deleting it will <strong>permanently remove</strong> the event record and all associated history logs from the database.</p>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={() => handleDeleteEvent(true)}>Permanently Delete</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
