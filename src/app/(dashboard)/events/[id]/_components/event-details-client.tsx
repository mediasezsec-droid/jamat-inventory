"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Edit, Printer, Package, ArrowLeft, FileText, Trash2, Calendar, Phone, MapPin, ChefHat, AlertTriangle, Copy, MoreVertical, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Event, InventoryItem } from "@/types";
import { useSession } from "next-auth/react";
import { RBACWrapper } from "@/components/rbac-wrapper";
import { generateEventManifest } from "@/lib/pdf-generator";
import { QRDialog } from "./qr-dialog";
import { Separator } from "@/components/ui/separator";
import { EventStepper } from "./event-stepper";
import { toast } from "sonner";

// Type for database-backed inventory allocations
interface EventInventoryAllocation {
    id: string;
    eventId: string;
    itemId: string;
    itemName: string;
    issuedQty: number;
    returnedQty: number;
    lostQty: number;
    recoveredQty: number;
}

interface EventDetailsClientProps {
    initialEvent: Event;
    initialInventory: InventoryItem[];
    initialAllocations: EventInventoryAllocation[];
    initialHijriDate?: string | null;
}

export default function EventDetailsClient({ initialEvent, initialInventory, initialAllocations, initialHijriDate }: EventDetailsClientProps) {
    const router = useRouter();
    const { data: session } = useSession();

    const [event, setEvent] = useState<Event>(initialEvent);
    const [inventory] = useState<InventoryItem[]>(initialInventory);
    const [allocations] = useState<EventInventoryAllocation[]>(initialAllocations);
    const [hijriDate] = useState<string | null>(initialHijriDate || null);

    // Get stats directly from database-backed allocations (single source of truth)
    const getItemStats = (itemId: string) => {
        const allocation = allocations.find(a => a.itemId === itemId);
        if (!allocation) return { issued: 0, returned: 0, lost: 0, deficit: 0 };

        // returned includes recovered items
        const effectiveReturned = allocation.returnedQty + allocation.recoveredQty;
        // lost is reduced by recovered
        const effectiveLost = Math.max(0, allocation.lostQty - allocation.recoveredQty);
        // deficit = issued - returned - lost (what's still out)
        const deficit = allocation.issuedQty - effectiveReturned - effectiveLost;

        return {
            issued: allocation.issuedQty,
            returned: effectiveReturned,
            lost: effectiveLost,
            deficit: Math.max(0, deficit)
        };
    };

    // Filter inventory to only show items that were used (have allocations)
    const usedInventory = inventory.filter(item => {
        const allocation = allocations.find(a => a.itemId === item.id);
        return allocation && allocation.issuedQty > 0;
    });

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [relatedData, setRelatedData] = useState<{ count: number } | null>(null);

    // Thaal Served Drawer State
    const [thaalDrawerOpen, setThaalDrawerOpen] = useState(false);
    const [thaalServedCount, setThaalServedCount] = useState("");
    const [isSavingThaal, setIsSavingThaal] = useState(false);

    // Update Thaal Served
    const handleUpdateThaalServed = async () => {
        const count = parseInt(thaalServedCount);
        if (!count || count < 0) {
            toast.error("Please enter a valid count");
            return;
        }

        setIsSavingThaal(true);
        try {
            const res = await fetch(`/api/events/${event.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ totalThaalsDone: count }),
            });

            if (!res.ok) throw new Error("Failed to update");

            toast.success("Thaals served updated successfully");
            setEvent({ ...event, totalThaalsDone: count } as any);
            setThaalDrawerOpen(false);
            setThaalServedCount("");
            router.refresh();
        } catch (error) {
            toast.error("Failed to update thaals served");
        } finally {
            setIsSavingThaal(false);
        }
    };

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
        <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 pb-24 md:pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push("/")}
                        className="h-10 w-10 shrink-0 rounded-full"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 md:flex-none">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground line-clamp-1">{event.name}</h1>
                            {isCancelled && <Badge variant="destructive" className="h-6">CANCELLED</Badge>}
                        </div>
                        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(event.occasionDate), "PPP")} at {event.occasionTime}
                        </div>
                    </div>
                </div>

                {/* Actions: Desktop vs Mobile */}
                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                    {/* Mobile: Manage Inventory takes full width, Menu for others */}
                    <div className="md:hidden flex flex-1 gap-2">
                        <Button
                            onClick={() => router.push(`/events/${event.id}/inventory`)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                            disabled={isCancelled}
                        >
                            <Package className="mr-2 h-4 w-4" /> Manage Inv.
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/events/${event.id}/print`)}>
                                    <Printer className="mr-2 h-4 w-4" /> Print View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => generateEventManifest(event, allocations)}>
                                    <FileText className="mr-2 h-4 w-4" /> Manifest PDF
                                </DropdownMenuItem>

                                <RBACWrapper componentId="menu-clone">
                                    <DropdownMenuItem onClick={() => router.push(`/events/new?fromId=${event.id}`)}>
                                        <Copy className="mr-2 h-4 w-4" /> Clone Event
                                    </DropdownMenuItem>
                                </RBACWrapper>

                                <RBACWrapper componentId="menu-edit">
                                    <DropdownMenuItem onClick={() => router.push(`/events/${event.id}/edit`)} disabled={isCancelled}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                                    </DropdownMenuItem>
                                </RBACWrapper>

                                <RBACWrapper componentId="menu-delete">
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteEvent(false)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                                    </DropdownMenuItem>
                                </RBACWrapper>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="hidden">
                            <QRDialog eventId={event.id} eventName={event.name} />
                        </div>
                    </div>

                    {/* Desktop: Full Buttons */}
                    <div className="hidden md:flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => router.push(`/events/${event.id}/print`)}>
                            <Printer className="mr-2 h-4 w-4" /> Print
                        </Button>
                        <Button variant="outline" onClick={() => generateEventManifest(event, allocations)}>
                            <FileText className="mr-2 h-4 w-4" /> Manifest
                        </Button>
                        <QRDialog eventId={event.id} eventName={event.name} />
                        <RBACWrapper componentId="btn-event-edit">
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/events/new?fromId=${event.id}`)}
                            >
                                <Copy className="mr-2 h-4 w-4" /> Clone
                            </Button>
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
            </div>

            {/* Event Stepper */}
            <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                <div className="mb-4">
                    <h2 className="text-base font-semibold text-slate-800">Event Progress</h2>
                </div>
                {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const eventDate = new Date(event.occasionDate);
                    eventDate.setHours(0, 0, 0, 0);

                    // Compute aggregates
                    let totalIssued = 0;
                    let totalDeficit = 0;
                    let totalLost = 0;

                    inventory.forEach(item => {
                        const s = getItemStats(item.id);
                        if (s.issued > 0) {
                            totalIssued += s.issued;
                            totalDeficit += s.deficit;
                            totalLost += s.lost;
                        }
                    });

                    // Logic
                    let step = 0; // Booked

                    const msPerHour = 1000 * 60 * 60;
                    const hoursSinceEvent = (today.getTime() - eventDate.getTime()) / msPerHour;

                    if (event.status === "COMPLETED") {
                        step = 4; // Settled
                    } else if (hoursSinceEvent > 48) {
                        step = 4; // Auto-settle after 48 hours
                    } else if (totalIssued > 0) {
                        step = 1; // Dispatched

                        // If today matches event date
                        if (today.getTime() === eventDate.getTime()) {
                            step = 2; // Active
                        }
                        // If today is after event date OR full returns started
                        else if (today > eventDate) {
                            step = 3; // Returning
                        }

                        // Check for Settlement (manual/inventory based)
                        if (totalIssued > 0 && totalDeficit <= 0 && step >= 3) {
                            step = 4; // Settled
                        }
                    }

                    // Settlement Info Text
                    let settlementInfo = "";
                    if (step === 4) {
                        if (hoursSinceEvent > 48) {
                            const settleDate = new Date(eventDate);
                            settleDate.setHours(settleDate.getHours() + 48);
                            settlementInfo = `Auto-Settled: ${format(settleDate, "MMM d, h:mm a")}`;
                        } else {
                            settlementInfo = "Settled: Inventory Match";
                        }
                    } else if (step >= 2 && step < 4) {
                        const remainingHours = Math.max(0, Math.ceil(48 - hoursSinceEvent));
                        if (remainingHours > 0) {
                            settlementInfo = `Auto-settle in ${remainingHours}h`;
                        } else {
                            settlementInfo = "Settling soon...";
                        }
                    }

                    return (
                        <EventStepper currentStep={step} isCancelled={isCancelled} settlementInfo={settlementInfo} />
                    );
                })()}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Column (Details) */}
                <div className="md:col-span-8 space-y-8">
                    {/* Event Meta Card */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-4 px-4 md:px-6 pt-6">
                            <CardTitle className="text-lg">Event Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 px-4 md:px-6 pb-8">
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
                                    <div className="bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menu selection</p>
                                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{event.menu || "No menu specified for this event."}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventory Table */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="px-4 md:px-6 pt-6 pb-4 md:px-8">
                            <CardTitle className="text-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                Inventory Reconciliation
                                <Badge variant="outline" className="w-fit font-normal">{usedInventory.length} items used</Badge>
                            </CardTitle>
                            <CardDescription>Track items issued, returned, and lost for this event.</CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 md:px-8 pb-8">
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
                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="min-w-[150px]">Item Name</TableHead>
                                                <TableHead className="text-center">Issued</TableHead>
                                                <TableHead className="text-center">Returned</TableHead>
                                                <TableHead className="text-center">Lost</TableHead>
                                                <TableHead className="text-right min-w-[120px]">Status</TableHead>
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
                                                        <TableCell className="font-medium">
                                                            <div className="line-clamp-2" title={item.name}>{item.name}</div>
                                                        </TableCell>
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
                                <div className="space-y-3">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Thaal Count</span>
                                        <span className="text-4xl font-bold text-slate-900">{event.thaalCount}</span>
                                    </div>
                                    {event.totalThaalsDone && (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-emerald-700 uppercase">Thaals Served</span>
                                                <span className="text-2xl font-bold text-emerald-700">{event.totalThaalsDone}</span>
                                            </div>
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200"
                                        onClick={() => {
                                            setThaalServedCount(event.totalThaalsDone?.toString() || "");
                                            setThaalDrawerOpen(true);
                                        }}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Update Thaal Served
                                    </Button>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-baseline pt-4 border-t border-slate-100">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Occasion & Timeline</span>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-slate-900 block">{event.description}</span>
                                        <span className="text-xs text-slate-500 block mt-0.5">{format(new Date(event.occasionDate), "PPP")}</span>
                                        <span className="text-xs font-medium text-emerald-600 block mt-0.5 flex flex-col gap-0.5 items-end">
                                            {hijriDate ? (
                                                <>
                                                    <span>{hijriDate.split("/")[0]}</span>
                                                    <span className="font-arabic text-emerald-700 text-lg">{hijriDate.split("/")[1]}</span>
                                                </>
                                            ) : "-"}
                                        </span>
                                    </div>
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

            {/* Thaal Served Update Drawer */}
            <Drawer open={thaalDrawerOpen} onOpenChange={setThaalDrawerOpen}>
                <DrawerContent>
                    <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader>
                            <DrawerTitle>Update Thaals Served</DrawerTitle>
                            <DrawerDescription>
                                How many thaals were actually served at this event?
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4">
                            <Label className="text-sm text-slate-600 mb-2 block">
                                Total Thaals Served
                            </Label>
                            <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={thaalServedCount}
                                onChange={(e) => {
                                    if (/^[0-9]*$/.test(e.target.value)) {
                                        setThaalServedCount(e.target.value);
                                    }
                                }}
                                className="h-12 text-center text-lg font-bold rounded-xl"
                                placeholder="Enter count..."
                            />
                        </div>
                        <DrawerFooter className="flex flex-col gap-3">
                            <Button
                                onClick={handleUpdateThaalServed}
                                disabled={isSavingThaal}
                                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {isSavingThaal ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                Save Count
                            </Button>
                            <DrawerClose asChild>
                                <Button variant="outline" className="w-full h-12 rounded-xl border-slate-300">
                                    Cancel
                                </Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
