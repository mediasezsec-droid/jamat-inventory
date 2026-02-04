"use client";

import { useEffect, useState } from "react";
import { format, isPast, isToday, isFuture } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { getMisriDate } from "@/lib/misri-calendar";
import { cn, getISTDate, isEventLocked } from "@/lib/utils";
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
    Utensils,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RBACWrapper } from "@/components/rbac-wrapper";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Event } from "@/types";
import { useCurrentRole } from "@/hooks/use-current-role";

interface EventsPageProps {
    initialEvents: Event[];
}

export default function EventsPage({ initialEvents }: EventsPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = useCurrentRole();
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>(initialEvents);
    const [search, setSearch] = useState(searchParams.get("q") || "");

    // Sync props to state (for router.refresh updates)
    useEffect(() => {
        setEvents(initialEvents);
        setFilteredEvents(initialEvents);
    }, [initialEvents]);

    // Delete State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [relatedData, setRelatedData] = useState<{ count: number } | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    // Raza Confirmation State
    const [razaConfirmOpen, setRazaConfirmOpen] = useState(false);
    const [razaTarget, setRazaTarget] = useState<{ id: string, name: string, currentStatus: boolean } | null>(null);

    useEffect(() => {
        const lower = search.toLowerCase();
        const filtered = events.filter(e =>
            (e.name || "").toLowerCase().includes(lower) ||
            (e.mobile || "").includes(lower) ||
            (e.description || "").toLowerCase().includes(lower) ||
            (Array.isArray(e.hall) ? e.hall.join(" ") : (e.hall || "")).toLowerCase().includes(lower)
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
                router.refresh();
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
                router.refresh();
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

    const handleRazaClick = (e: React.MouseEvent, event: Event) => {
        e.stopPropagation();
        setRazaTarget({
            id: event.id,
            name: event.name,
            currentStatus: event.razaGranted || false
        });
        setRazaConfirmOpen(true);
    };

    const confirmRazaToggle = async () => {
        if (!razaTarget) return;

        const newValue = !razaTarget.currentStatus;
        try {
            const res = await fetch(`/api/events/${razaTarget.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ razaGranted: newValue }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success(newValue ? "Raza Granted" : "Raza Revoked");
            setRazaConfirmOpen(false);
            setRazaTarget(null);
            router.refresh();
        } catch (err) {
            toast.error("Failed to update Raza status");
        }
    };

    const getStatusBadge = (event: Event) => {
        if (event.status === "CANCELLED") return <Badge variant="destructive">Cancelled</Badge>;

        const date = getISTDate(event.occasionDate);
        if (isToday(date)) return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200 shadow-none">Today</Badge>;
        if (isFuture(date)) return <Badge className="bg-indigo-500/15 text-indigo-700 hover:bg-indigo-500/25 border-indigo-200 shadow-none">Upcoming</Badge>;
        return <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200 shadow-none">Past</Badge>;
    };

    const canManage = role === "ADMIN" || role === "MANAGER";
    const isAdmin = role === "ADMIN";


    // Event counts (using IST dates)
    const todayCount = events.filter(e => isToday(getISTDate(e.occasionDate)) && e.status !== "CANCELLED").length;
    const upcomingCount = events.filter(e => isFuture(getISTDate(e.occasionDate)) && e.status !== "CANCELLED").length;
    const pastCount = events.filter(e => isPast(getISTDate(e.occasionDate)) && !isToday(getISTDate(e.occasionDate))).length;
    const cancelledCount = events.filter(e => e.status === "CANCELLED").length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Events</h1>
                    <p className="text-slate-500 mt-1">Manage and track all jamaat occasions.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/events/calendar")}
                        className="h-11 px-6 rounded-xl border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                    >
                        <CalendarIcon className="mr-2 h-5 w-5" /> Calendar View
                    </Button>
                    <RBACWrapper componentId="btn-event-create">
                        <Button
                            id="btn-event-create"
                            onClick={() => router.push("/events/new")}
                            className="btn-gradient-primary shadow-lg h-11 px-6 rounded-xl"
                        >
                            <Plus className="mr-2 h-5 w-5" /> New Event
                        </Button>
                    </RBACWrapper>
                </div>
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
            {filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                        <CalendarIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No events found</h3>
                    <p className="text-slate-500 mt-1">Try adjusting your search filters.</p>
                </div>
            ) : (
                <Tabs defaultValue={
                    filteredEvents.some(e => isToday(getISTDate(e.occasionDate))) ? "active" :
                        filteredEvents.some(e => isFuture(getISTDate(e.occasionDate))) ? "upcoming" : "completed"
                } className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-6">
                        <TabsList className="grid w-full max-w-[400px] grid-cols-3">
                            <TabsTrigger value="active">Active</TabsTrigger>
                            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="active" className="space-y-4">
                        {filteredEvents.filter(e => isToday(getISTDate(e.occasionDate))).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredEvents
                                    .filter(e => isToday(getISTDate(e.occasionDate)))
                                    .map(event => <EventCard key={event.id} event={event} router={router} isAdmin={isAdmin} handleDeleteClick={handleDeleteClick} handleRazaClick={handleRazaClick} getStatusBadge={getStatusBadge} />)
                                }
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-xl border border-dashed">
                                No active events today.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="upcoming" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredEvents
                                .filter(e => isFuture(getISTDate(e.occasionDate)))
                                .map(event => <EventCard key={event.id} event={event} router={router} isAdmin={isAdmin} handleDeleteClick={handleDeleteClick} handleRazaClick={handleRazaClick} getStatusBadge={getStatusBadge} />)
                            }
                        </div>
                    </TabsContent>

                    <TabsContent value="completed" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-80 hover:opacity-100 transition-opacity">
                            {filteredEvents
                                .filter(e => isPast(getISTDate(e.occasionDate)) && !isToday(getISTDate(e.occasionDate)))
                                .map(event => <EventCard key={event.id} event={event} router={router} isAdmin={isAdmin} handleDeleteClick={handleDeleteClick} handleRazaClick={handleRazaClick} getStatusBadge={getStatusBadge} />)
                            }
                        </div>
                    </TabsContent>
                </Tabs>
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

            {/* Raza Confirmation Dialog */}
            {razaConfirmOpen && razaTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 shadow-2xl">
                        <div className={`flex items-center gap-3 ${razaTarget.currentStatus ? 'text-red-600' : 'text-emerald-600'}`}>
                            <div className={`${razaTarget.currentStatus ? 'bg-red-100' : 'bg-emerald-100'} p-2 rounded-full`}>
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold">{razaTarget.currentStatus ? "Revoke Raza?" : "Grant Raza?"}</h3>
                        </div>
                        <p className="text-slate-600">
                            Are you sure you want to <strong>{razaTarget.currentStatus ? "REVOKE" : "GRANT"}</strong> Raza for <strong>{razaTarget.name}</strong>?
                        </p>
                        {!razaTarget.currentStatus && (
                            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-sm text-emerald-800">
                                This will mark the event as approved.
                            </div>
                        )}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => { setRazaConfirmOpen(false); setRazaTarget(null); }}>Cancel</Button>
                            <Button
                                className={razaTarget.currentStatus ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                                onClick={confirmRazaToggle}
                            >
                                {razaTarget.currentStatus ? "Yes, Revoke" : "Yes, Grant"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function EventCard({ event, router, isAdmin, handleDeleteClick, handleRazaClick, getStatusBadge }: any) {
    const isCancelled = event.status === "CANCELLED";
    const istDate = getISTDate(event.occasionDate);
    const hijri = getMisriDate(istDate);
    const razaGranted = event.razaGranted || false;

    // Card Colors: Cancelled (Grey), Raza Granted (Subtle Green), Raza Pending (Subtle Orange)
    // Note: status === CANCELLED overrides everything
    let cardBgClass = "bg-white";
    if (isCancelled) {
        cardBgClass = "bg-slate-50 opacity-60";
    } else {
        cardBgClass = razaGranted
            ? "bg-emerald-50 border-emerald-200 hover:bg-emerald-100/50"
            : "bg-orange-50 border-orange-200 hover:bg-orange-100/50";
    }

    return (
        <Card
            className={`cursor-pointer p-5 transition-colors duration-300 ${cardBgClass}`}
            onClick={() => router.push(`/events/${event.id}`)}
        >
            {/* Header with Date Block & Status */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex flex-col items-center justify-center w-12 h-12 rounded-lg",
                        isCancelled ? "bg-slate-100 text-slate-400" : (razaGranted ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700")
                    )}>
                        <span className="text-[10px] font-bold uppercase">
                            {format(istDate, "MMM")}
                        </span>
                        <span className="text-lg font-bold leading-none">
                            {format(istDate, "d")}
                        </span>
                    </div>
                    <div>
                        <h3 className={cn(
                            "font-semibold text-foreground leading-tight",
                            isCancelled && "line-through text-muted-foreground"
                        )}>
                            {event.name}
                        </h3>
                        {event.description && (
                            <p className={cn(
                                "text-sm font-medium truncate max-w-[180px] mt-0.5",
                                razaGranted ? "text-emerald-700" : "text-orange-700"
                            )}>
                                {event.description}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {event.occasionTime}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span>{hijri.formattedEn}</span>
                        </p>
                    </div>
                </div>
                {getStatusBadge(event)}
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{event.thaalCount} Thaal</span>
                    {event.totalThaalsDone && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                            {event.totalThaalsDone} Done
                        </span>
                    )}
                </div>
            </div>

            {/* Admin Actions */}
            {isAdmin && (
                <div className={`flex justify-between items-center pt-3 border-t ${razaGranted ? 'border-emerald-200' : 'border-orange-200'}`}>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Switch
                            checked={razaGranted}
                            onCheckedChange={() => { }}
                            onClick={(e) => handleRazaClick(e, event)}
                            className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-orange-400"
                            disabled={isCancelled || isEventLocked(event.occasionDate)}
                        />
                        <span className={`text-xs font-bold uppercase tracking-wider ${razaGranted ? 'text-emerald-700' : 'text-orange-700'}`}>
                            {razaGranted ? "Raza Granted" : "Raza Pending"}
                        </span>
                    </div>

                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${razaGranted ? 'hover:bg-emerald-100 text-emerald-700' : 'hover:bg-orange-100 text-orange-700'}`}
                            onClick={(e) => { e.stopPropagation(); router.push(`/events/${event.id}/edit`); }}
                            disabled={isCancelled || isEventLocked(event.occasionDate)}
                            title={isEventLocked(event.occasionDate) ? "Event Locked (Ended > 48h ago)" : "Edit Event"}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => handleDeleteClick(e, event.id)}
                            disabled={isEventLocked(event.occasionDate)}
                            title={isEventLocked(event.occasionDate) ? "Event Locked (Ended > 48h ago)" : "Delete Event"}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}
