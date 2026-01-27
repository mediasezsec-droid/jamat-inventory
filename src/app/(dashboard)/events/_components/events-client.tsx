"use client";

import { useEffect, useState } from "react";
import { format, isPast, isToday, isFuture } from "date-fns";
import { useRouter } from "next/navigation";
import {
    Plus,
    Calendar as CalendarIcon,
    MapPin,
    Clock,
    Search,
    Filter,
    Edit,
    Trash2,
    Ban,
    AlertTriangle,
    Users,
    Utensils
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Event } from "@/types";
import { useCurrentRole } from "@/hooks/use-current-role";

export default function EventsPage() {
    const router = useRouter();
    const role = useCurrentRole();
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Delete State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [relatedData, setRelatedData] = useState<{ count: number } | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/events");
            if (res.ok) {
                const data = await res.json();
                const sorted = data.sort((a: Event, b: Event) =>
                    new Date(b.occasionDate).getTime() - new Date(a.occasionDate).getTime()
                );
                setEvents(sorted);
                setFilteredEvents(sorted);
            }
        } catch (error) {
            console.error("Failed to load events");
            toast.error("Failed to load events");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        const lower = search.toLowerCase();
        const filtered = events.filter(e =>
            e.name.toLowerCase().includes(lower) ||
            e.mobile.includes(lower) ||
            e.description.toLowerCase().includes(lower) ||
            (Array.isArray(e.hall) ? e.hall.join(" ") : e.hall).toLowerCase().includes(lower)
        );
        setFilteredEvents(filtered);
    }, [search, events]);

    const handleCancel = async (e: React.MouseEvent, eventId: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to CANCEL this event?")) return;

        try {
            const res = await fetch(`/api/events/${eventId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "CANCELLED" }),
            });

            if (res.ok) {
                toast.success("Event cancelled");
                fetchEvents(); // Refresh list
            }
        } catch (error) {
            console.error("Failed to cancel event", error);
            toast.error("Failed to cancel");
        }
    };

    const handleDeleteClick = async (e: React.MouseEvent, eventId: string) => {
        e.stopPropagation();
        setSelectedEventId(eventId);
        await performDelete(eventId, false);
    };

    const performDelete = async (eventId: string, force: boolean) => {
        try {
            const res = await fetch(`/api/events/${eventId}${force ? "?force=true" : ""}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Event deleted");
                setDeleteConfirmOpen(false);
                setSelectedEventId(null);
                fetchEvents();
                return;
            }

            if (res.status === 409) {
                const data = await res.json();
                setRelatedData(data);
                setDeleteConfirmOpen(true);
            }
        } catch (error) {
            console.error("Failed to delete event", error);
            toast.error("Delete failed");
        }
    };

    const getStatusBadge = (event: Event) => {
        if (event.status === "CANCELLED") return <Badge variant="destructive">Cancelled</Badge>;

        const date = new Date(event.occasionDate);
        if (isToday(date)) return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200 shadow-none">Today</Badge>;
        if (isFuture(date)) return <Badge className="bg-indigo-500/15 text-indigo-700 hover:bg-indigo-500/25 border-indigo-200 shadow-none">Upcoming</Badge>;
        return <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200 shadow-none">Past</Badge>;
    };

    const canManage = role === "ADMIN" || role === "MANAGER";
    const isAdmin = role === "ADMIN";

    // Event counts
    const todayCount = events.filter(e => isToday(new Date(e.occasionDate)) && e.status !== "CANCELLED").length;
    const upcomingCount = events.filter(e => isFuture(new Date(e.occasionDate)) && e.status !== "CANCELLED").length;
    const pastCount = events.filter(e => isPast(new Date(e.occasionDate)) && !isToday(new Date(e.occasionDate))).length;
    const cancelledCount = events.filter(e => e.status === "CANCELLED").length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Events</h1>
                    <p className="text-slate-500 mt-1">Manage and track all jamaat occasions.</p>
                </div>
                {canManage && (
                    <Button
                        id="btn-event-create" // RBAC ID
                        onClick={() => router.push("/events/new")}
                        className="btn-gradient-primary shadow-lg h-11 px-6 rounded-xl"
                    >
                        <Plus className="mr-2 h-5 w-5" /> New Event
                    </Button>
                )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card stat-card-emerald">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-600">Today</p>
                        <div className="icon-container-emerald">
                            <CalendarIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{todayCount}</p>
                </div>
                <div className="stat-card stat-card-indigo">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-600">Upcoming</p>
                        <div className="icon-container-indigo">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{upcomingCount}</p>
                </div>
                <div className="stat-card stat-card-amber">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-600">Past</p>
                        <div className="icon-container-amber">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{pastCount}</p>
                </div>
                <div className="stat-card stat-card-rose">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-600">Cancelled</p>
                        <div className="icon-container-rose">
                            <Ban className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{cancelledCount}</p>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        id="input-event-search" // RBAC ID
                        placeholder="Search events, halls, or names..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-11 h-12 bg-white border-slate-200 shadow-sm rounded-xl focus-visible:ring-indigo-500"
                    />
                </div>
                <Button id="btn-event-filter" variant="outline" className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200">
                    <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
            </div>

            {/* Events List */}
            {isLoading ? (
                <div className="py-20 flex justify-center">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                        <CalendarIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No events found</h3>
                    <p className="text-slate-500 mt-1">Try adjusting your search filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => {
                        const isCancelled = event.status === "CANCELLED";
                        return (
                            <Card
                                key={event.id}
                                className={`overflow-hidden transition-all duration-300 hover:shadow-lg border-slate-200 hover:border-indigo-200 group flex flex-col ${isCancelled ? 'bg-slate-50/50' : 'bg-white'}`}
                            >
                                <CardHeader className="p-5 pb-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                                {format(new Date(event.occasionDate), "MMM").toUpperCase()}
                                            </span>
                                            <span className="text-3xl font-bold text-slate-900 -mt-1">
                                                {format(new Date(event.occasionDate), "d")}
                                            </span>
                                        </div>
                                        {getStatusBadge(event)}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className={`font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors ${isCancelled ? 'line-through text-slate-500' : ''}`}>
                                            {event.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 line-clamp-1">{event.description}</p>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-5 pt-2 space-y-3 flex-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span>{event.occasionTime}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span className="truncate">{Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}</span>
                                    </div>
                                    <div className="flex items-center gap-4 pt-2">
                                        <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 font-normal">
                                            <Users className="w-3 h-3 mr-1" /> {event.thaalCount} Thaal
                                        </Badge>
                                        {event.bhaiSaabIzzan && (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 text-[10px]">IZZAN</Badge>
                                        )}
                                    </div>
                                </CardContent>

                                <CardFooter className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                                        onClick={() => router.push(`/events/${event.id}`)}
                                    >
                                        View
                                    </Button>
                                    {isAdmin && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 bg-white hover:text-indigo-600 text-slate-500 border-slate-200"
                                                onClick={() => router.push(`/events/${event.id}/edit`)}
                                                disabled={isCancelled}
                                                title="Edit Event"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            {!isCancelled && (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-9 w-9 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 border-slate-200"
                                                    onClick={(e) => handleCancel(e, event.id)}
                                                    title="Cancel Event"
                                                >
                                                    <Ban className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 border-slate-200"
                                                onClick={(e) => handleDeleteClick(e, event.id)}
                                                title="Delete Event"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 shadow-2xl">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="bg-red-100 p-2 rounded-full">
                                <AlertTriangle className="h-6 w-6" />
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
                            <Button variant="outline" onClick={() => { setDeleteConfirmOpen(false); setSelectedEventId(null); }}>Cancel</Button>
                            <Button variant="destructive" onClick={() => selectedEventId && performDelete(selectedEventId, true)}>Yes, Delete Everything</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
