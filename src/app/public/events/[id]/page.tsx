"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Calendar, MapPin, Phone, User, Package, CheckCircle2, Clock } from "lucide-react";
import { Event } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function PublicEventPage() {
    const params = useParams();
    const eventId = params.id as string;
    const [event, setEvent] = useState<Event | null>(null);
    const [inventoryStats, setInventoryStats] = useState<Record<string, { name: string, issued: number, returned: number }>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                // Fetch Event
                const eventRes = await fetch(`/api/events/${eventId}`);
                if (!eventRes.ok) throw new Error("Event not found");
                const eventData = await eventRes.json();
                setEvent(eventData);
            } catch (error) {
                setError("Failed to load event details.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvent();

        // Polling for logs (every 3 seconds)
        const fetchLogs = async () => {
            try {
                const logsRes = await fetch(`/api/events/${eventId}/logs`);
                if (logsRes.ok) {
                    const logsData = await logsRes.json();

                    const stats: Record<string, { name: string, issued: number, returned: number }> = {};

                    logsData.forEach((log: any) => {
                        const itemId = log.details?.itemId || log.itemId;
                        const itemName = log.details?.itemName || log.itemName || "Unknown Item";
                        const quantity = log.details?.quantity || log.quantity || 0;
                        const action = log.action;

                        if (!itemId) return;

                        if (!stats[itemId]) {
                            stats[itemId] = { name: itemName, issued: 0, returned: 0 };
                        }

                        const specificAction = log.details?.action;

                        if (specificAction === "ISSUE" || (action === "INVENTORY_REMOVED" && specificAction !== "LOSS")) {
                            stats[itemId].issued += quantity;
                        } else if (specificAction === "RETURN" || action === "INVENTORY_RETURNED" || action === "INVENTORY_RETURNED") {
                            stats[itemId].returned += quantity;
                        } else if (specificAction === "LOSS" || action === "INVENTORY_LOSS") {
                            // Treat loss as returned/resolved for public view
                            stats[itemId].returned += quantity;
                        }
                    });
                    setInventoryStats(stats);
                }
            } catch (error) {
                console.error("Failed to fetch logs", error);
            }
        };

        fetchLogs(); // Initial fetch
        const interval = setInterval(fetchLogs, 3000); // Poll every 3s

        return () => clearInterval(interval);
    }, [eventId]);

    if (isLoading) return <div className="flex justify-center items-center min-h-screen bg-slate-50"><Loader2 className="animate-spin h-10 w-10 text-amber-600" /></div>;
    if (error || !event) return <div className="flex justify-center items-center min-h-screen bg-slate-50 text-red-500 font-medium">{error || "Event not found"}</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Hero Header */}
            <div className="bg-slate-900 text-white py-12 px-4 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold font-serif mb-2 text-amber-500">Anjuman-e-Mohammedi</h1>
                    <p className="text-slate-400 uppercase tracking-[0.2em] text-sm md:text-base">Miqaat & Event Management</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20 pb-20">
                {/* Event Details Card */}
                <Card className="shadow-2xl border-0 overflow-hidden mb-8">
                    <div className="h-2 bg-gradient-to-r from-amber-500 to-amber-700"></div>
                    <CardHeader className="bg-white border-b border-slate-100 pb-6 pt-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <Badge variant="outline" className="mb-2 border-amber-200 text-amber-700 bg-amber-50">
                                    {event.thaalCount} Thaal
                                </Badge>
                                <CardTitle className="text-3xl font-bold text-slate-800">{event.description}</CardTitle>
                                <div className="flex items-center text-slate-500 mt-2 font-medium">
                                    <Calendar className="h-4 w-4 mr-2 text-amber-600" />
                                    {format(new Date(event.occasionDate), "EEEE, MMMM do, yyyy")}
                                    <span className="mx-2">•</span>
                                    <Clock className="h-4 w-4 mr-2 text-amber-600" />
                                    {event.occasionTime}
                                </div>
                            </div>
                            <div className="text-right hidden md:block">
                                <p className="text-sm text-slate-400 uppercase tracking-wider">Venue</p>
                                <p className="font-semibold text-slate-700">{Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Booker Information</h3>
                                    <div className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                                            <User className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{event.name}</p>
                                            <p className="text-sm text-slate-500">{event.mobile}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:hidden">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Venue Details</h3>
                                    <div className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                                            <MapPin className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}</p>
                                            <p className="text-sm text-slate-500">Caterer: {event.catererName}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Requirements Checklist</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <RequirementItem label="Sarkari Sets" value={event.sarkariThaalSet} />
                                    <RequirementItem label="Extra Chilamchi" value={event.extraChilamchiLota} />
                                    <RequirementItem label="Tables/Chairs" value={event.tablesAndChairs} />
                                    {event.mic && <RequirementItem label="Microphone" active />}
                                    {event.crockeryRequired && <RequirementItem label="Crockery" active />}
                                    {event.masjidLight && <RequirementItem label="Masjid Light" active />}
                                </div>
                            </div>
                        </div>

                        {event.menu && (
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Menu</h3>
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                    {event.menu}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Live Inventory Status */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center">
                            <Package className="mr-2 h-5 w-5 text-amber-600" />
                            Live Inventory Status
                        </h2>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 animate-pulse">
                            Live Updates
                        </Badge>
                    </div>

                    {Object.keys(inventoryStats).length === 0 ? (
                        <Card className="border-dashed border-2 border-slate-200 bg-transparent shadow-none">
                            <CardContent className="p-8 text-center text-slate-400">
                                <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                <p>No inventory items have been issued yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(inventoryStats).map(([itemId, stats]) => {
                                const percentReturned = stats.issued > 0 ? (stats.returned / stats.issued) * 100 : 0;
                                return (
                                    <Card key={itemId} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                                        <CardContent className="p-5">
                                            <div className="flex justify-between items-center mb-3">
                                                <h3 className="font-bold text-slate-700">{stats.name}</h3>
                                                <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                    {stats.issued} Issued
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>Returned: {stats.returned}</span>
                                                    <span>{Math.round(percentReturned)}%</span>
                                                </div>
                                                <Progress value={percentReturned} className="h-2 bg-slate-100" />
                                            </div>

                                            {stats.issued === stats.returned && stats.issued > 0 && (
                                                <div className="mt-3 flex items-center text-xs text-green-600 font-medium bg-green-50 p-2 rounded">
                                                    <CheckCircle2 className="h-3 w-3 mr-1.5" />
                                                    Fully Returned
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="text-center mt-12 text-slate-400 text-sm">
                    <p>&copy; {new Date().getFullYear()} Anjuman-e-Mohammedi. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}

function RequirementItem({ label, value, active }: { label: string, value?: number | string, active?: boolean }) {
    return (
        <div className="flex items-center p-2 bg-slate-50 rounded border border-slate-100">
            <div className={`h-2 w-2 rounded-full mr-2 ${active || (value && value !== 0) ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
            <span className="text-sm text-slate-600 font-medium">
                {label} {value ? `: ${value}` : ''}
            </span>
        </div>
    );
}
