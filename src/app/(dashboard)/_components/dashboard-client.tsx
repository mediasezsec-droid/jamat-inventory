"use client";

import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import {
    Calendar as CalendarIcon,
    Utensils,
    Warehouse,
    Plus,
    ChevronRight,
    ChevronLeft,
    Clock,
    MoreHorizontal,
    Settings,
    ArrowUpRight,
    AlertTriangle,
    Trash2,
    Ban
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Event } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface DashboardClientProps {
    initialEvents: Event[];
}

export default function DashboardClient({ initialEvents }: DashboardClientProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Fetch events with SSR fallback
    const { data: events, isLoading, mutate } = useSWR<Event[]>(
        `/api/events?date=${date ? date.toISOString() : ''}`,
        fetcher,
        { fallbackData: initialEvents }
    );

    // Metrics
    const totalThaal = events?.reduce((sum, e) => sum + (e.thaalCount || 0), 0) || 0;
    const activeEvents = events?.length || 0;

    // Actions State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [relatedData, setRelatedData] = useState<{ count: number } | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const isAdmin = (session?.user as any)?.role === "ADMIN";

    const handleDateChange = (newDate: Date | undefined) => {
        setDate(newDate);
        setIsCalendarOpen(false);
    };

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
                mutate();
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
                mutate();
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

    return (
        <div className="min-h-full space-y-8 animate-in fade-in duration-300 relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
                    <div className="flex items-center gap-2 mt-1 text-slate-500">
                        <span className="text-sm font-medium">{date ? format(date, "EEEE, MMMM do") : "Today"}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Mobile Date Nav */}
                    <div className="flex md:hidden items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDate(d => subDays(d || new Date(), 1))}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDate(d => addDays(d || new Date(), 1))}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={() => router.push("/events/new")}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-medium h-10 px-4 rounded-md shadow-sm w-full md:w-auto text-sm"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Event
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: Activity Feed */}
                <div className="lg:col-span-2 space-y-8">
                    {/* KPI Strip - Colorful */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="stat-card stat-card-amber">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-slate-600">Total Thaal</p>
                                <div className="icon-container-amber">
                                    <Utensils className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-4xl font-bold text-slate-900 tracking-tight">{isLoading ? "-" : totalThaal}</p>
                            <p className="text-xs text-slate-400 mt-1">For selected date</p>
                        </div>
                        <div className="stat-card stat-card-indigo">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-slate-600">Scheduled Events</p>
                                <div className="icon-container-indigo">
                                    <Clock className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-4xl font-bold text-slate-900 tracking-tight">{isLoading ? "-" : activeEvents}</p>
                            <p className="text-xs text-slate-400 mt-1">Events today</p>
                        </div>
                    </div>

                    {/* Schedule List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-900">Today's Schedule</h2>
                            {events && events.length > 0 && <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{events.length} items</span>}
                        </div>

                        {isLoading ? (
                            <div className="bg-white p-12 rounded-xl border border-slate-200 flex justify-center">
                                <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : !events || events.length === 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200 border-dashed p-12 text-center">
                                <p className="text-slate-500 text-sm">No events scheduled.</p>
                                <Button variant="link" onClick={() => router.push("/events/new")} className="text-slate-900 font-medium mt-1">
                                    Create one
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {events.map((event) => {
                                    const isCancelled = event.status === "CANCELLED";
                                    return (
                                        <div
                                            key={event.id}
                                            onClick={() => router.push(`/events/${event.id}`)}
                                            className={`group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex gap-4 items-center ${isCancelled ? "opacity-75 bg-slate-50" : ""}`}
                                        >
                                            <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-slate-100 pr-4">
                                                <span className="font-bold text-base text-slate-900">{event.occasionTime.split(' ')[0]}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{event.occasionTime.split(' ')[1]}</span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className={`font-semibold text-sm text-slate-900 truncate pr-2 group-hover:underline decoration-slate-300 underline-offset-4 ${isCancelled ? "line-through text-slate-500" : ""}`}>{event.name}</h3>
                                                        {isCancelled && <Badge variant="destructive" className="h-5 text-[10px] px-1.5">CANCELLED</Badge>}
                                                    </div>
                                                    {event.bhaiSaabIzzan && (
                                                        <div className="w-2 h-2 rounded-full bg-amber-400 lg:mr-4" title="Izzan"></div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                    <span className="truncate max-w-[150px]">{Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span className="font-medium">{event.thaalCount} Thaal</span>
                                                </div>
                                            </div>

                                            {isAdmin ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenuItem onClick={() => router.push(`/events/${event.id}`)}>
                                                            View Details
                                                        </DropdownMenuItem>
                                                        {!isCancelled && (
                                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => handleCancel(e, event.id)}>
                                                                <Ban className="mr-2 h-4 w-4" /> Cancel Event
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => handleDeleteClick(e, event.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Calendar & Accents */}
                <div className="space-y-6">
                    {/* Calendar - no card, just the calendar */}
                    <div className="hidden md:flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => d && setDate(d)}
                            className="rounded-xl bg-white border border-slate-200 shadow-md p-4"
                            classNames={{
                                day_selected: "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white rounded-md",
                                day_today: "bg-indigo-100 text-indigo-700 font-bold rounded-md",
                            }}
                        />
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Links</h3>
                        <div className="space-y-2">
                            <Button
                                onClick={() => router.push("/inventory")}
                                variant="ghost"
                                className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50 h-10 px-2 -ml-2"
                            >
                                <Utensils className="mr-3 h-4 w-4" /> Inventory
                            </Button>
                            <Button
                                onClick={() => router.push("/settings/config")}
                                variant="ghost"
                                className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50 h-10 px-2 -ml-2"
                            >
                                <Warehouse className="mr-3 h-4 w-4" /> Venues
                            </Button>
                            <Button
                                onClick={() => router.push("/settings")}
                                variant="ghost"
                                className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50 h-10 px-2 -ml-2"
                            >
                                <Settings className="mr-3 h-4 w-4" /> Settings
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden fixed bottom-6 right-6 z-50">
                <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <SheetTrigger asChild>
                        <Button className="h-14 w-14 rounded-full bg-slate-900 text-white shadow-lg flex items-center justify-center">
                            <CalendarIcon className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[450px] rounded-t-3xl">
                        <div className="flex justify-center pt-8">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={handleDateChange}
                                className="rounded-md"
                                classNames={{
                                    day_selected: "bg-slate-900 text-white hover:bg-slate-800 hover:text-white rounded-md",
                                    day_today: "bg-slate-100 text-slate-900 font-bold rounded-md",
                                }}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

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
