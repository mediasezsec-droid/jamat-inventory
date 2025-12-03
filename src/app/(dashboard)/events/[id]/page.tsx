"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Edit, Printer, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Event, InventoryItem } from "@/types";
import { useSession } from "next-auth/react";

export default function EventDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const eventId = params.id as string;

    const [event, setEvent] = useState<Event | null>(null);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventRes, invRes, logsRes] = await Promise.all([
                    fetch(`/api/events/${eventId}`),
                    fetch("/api/inventory"),
                    fetch(`/api/events/${eventId}/logs`)
                ]);

                if (eventRes.ok) setEvent(await eventRes.json());
                if (invRes.ok) setInventory(await invRes.json());
                if (logsRes.ok) setLogs(await logsRes.json());

            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [eventId]);

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

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    if (!event) return <div className="p-10 text-center">Event not found</div>;

    const isAdmin = (session?.user as any)?.role === "ADMIN";

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{event.name}</h1>
                        <p className="text-slate-500">{event.description} • {format(new Date(event.occasionDate), "PPP")}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/events/${eventId}/print`)}>
                        <Printer className="mr-2 h-4 w-4" /> Print Form
                    </Button>
                    <Button variant="outline" onClick={() => router.push(`/events/${eventId}/inventory`)}>
                        <Package className="mr-2 h-4 w-4" /> Manage Inventory
                    </Button>
                    {isAdmin && (
                        <Button onClick={() => router.push(`/events/${eventId}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Event
                        </Button>
                    )}
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Details */}
                <Card className="md:col-span-2 glass-card">
                    <CardHeader>
                        <CardTitle>Event Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-6">
                        <div>
                            <span className="text-sm text-slate-500 block">Mobile</span>
                            <span className="font-medium">{event.mobile}</span>
                        </div>
                        <div>
                            <span className="text-sm text-slate-500 block">Time</span>
                            <span className="font-medium">{event.occasionTime}</span>
                        </div>
                        <div>
                            <span className="text-sm text-slate-500 block">Hall</span>
                            <span className="font-medium">{Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}</span>
                        </div>
                        <div>
                            <span className="text-sm text-slate-500 block">Caterer</span>
                            <span className="font-medium">{event.catererName} ({event.catererPhone})</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-sm text-slate-500 block">Menu</span>
                            <p className="font-medium whitespace-pre-wrap">{event.menu || "No menu specified"}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Requirements Summary */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-slate-600">Thaal Count</span>
                            <span className="font-bold">{event.thaalCount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Sarkari Sets</span>
                            <span className="font-bold">{event.sarkariThaalSet}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Tables/Chairs</span>
                            <span className="font-bold">{event.tablesAndChairs}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {event.mic && <Badge variant="secondary">Mic</Badge>}
                            {event.bhaiSaabIzzan && <Badge variant="secondary">Bhai Saab Izzan</Badge>}
                            {event.benSaabIzzan && <Badge variant="secondary">Ben Saab Izzan</Badge>}
                            {event.crockeryRequired && <Badge variant="secondary">Crockery</Badge>}
                            {event.masjidLight && <Badge variant="secondary">Masjid Light</Badge>}
                        </div>
                    </CardContent>
                </Card>
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
        </div>
    );
}
