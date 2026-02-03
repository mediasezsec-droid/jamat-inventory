"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays, isToday, parse } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Calendar as CalendarIcon,
    Utensils,
    Clock,
    MoreHorizontal,
    ArrowUpRight,
    AlertTriangle,
    Trash2,
    Ban,
    TrendingUp,
    Activity,
    Plus,
    ChevronLeft,
    ChevronRight,
    Warehouse,
} from "lucide-react";
import { SharedCalendar } from "@/components/shared-calendar";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

// Helper to parse "HH:mm AM/PM" time string relative to a base date
const parseEventTime = (timeStr: string, baseDate: Date) => {
    try {
        // Try parsing "hh:mm a" (e.g. 08:30 PM)
        return parse(timeStr, "hh:mm a", baseDate);
    } catch (e) {
        // Fallback or explicit handling if needed
        return baseDate;
    }
};
import { useRouter } from "next/navigation";
import { enGB } from "date-fns/locale";
import { Event } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KPICard } from "./kpi-card";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface DashboardClientProps {
    initialEvents: Event[];
    todayHijri?: string | null;
    currentDate?: Date;
}

export default function DashboardClient({ initialEvents, todayHijri, currentDate }: DashboardClientProps) {
    const router = useRouter();
    const { data: session } = useSession();
    // Use the passed currentDate (which reflects server time/URL param) or fallback to browser's today
    const [date, setDate] = useState<Date | undefined>(currentDate || new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const [events, setEvents] = useState<Event[]>(initialEvents);

    // Sync props to state handling router refreshes
    useEffect(() => {
        setEvents(initialEvents);
    }, [initialEvents]);

    // Sync date from server if it changes (e.g. initial load or subsequent navigation)
    useEffect(() => {
        if (currentDate) {
            setDate(currentDate);
        }
    }, [currentDate]);

    // Update URL when date changes to trigger SSR refetch
    const handleDateChange = (newDate: Date | undefined) => {
        setDate(newDate); // Optimistic update
        setIsCalendarOpen(false);
        if (newDate) {
            // Use YYYY-MM-DD to avoid timezone shifts when ISO string is parsed on server
            const dateStr = format(newDate, "yyyy-MM-dd");
            router.push(`/?date=${dateStr}`);
        } else {
            router.push("/");
        }
    };

    const isLoading = false; // Data is now SSR

    // Metrics
    const totalThaal = events?.reduce((sum, e) => sum + (e.thaalCount || 0), 0) || 0;
    const activeEvents = events?.filter(e => e.status !== 'CANCELLED').length || 0;
    const cancelledEvents = events?.filter(e => e.status === 'CANCELLED').length || 0;

    // Actions State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [relatedData, setRelatedData] = useState<{ count: number } | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const isAdmin = (session?.user as any)?.role === "ADMIN";



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

    // Process events: Sort by Time & Filter completed (3h buffer)
    const sortedAndFilteredEvents = [...events]
        .map(event => {
            const dateForEvent = date || new Date();
            let parsedDate = dateForEvent;

            if (event.occasionTime) {
                // Normalize string (trim whitespace)
                const timeClean = event.occasionTime.trim();
                parsedDate = parseEventTime(timeClean, dateForEvent);
            }
            return { ...event, _parsedDate: parsedDate };
        })
        .sort((a, b) => a._parsedDate.getTime() - b._parsedDate.getTime())
        .filter(event => {
            // "Show completed 3 hours after the event time"
            // If viewing Today, hide events from > 3 hours ago
            if (date && isToday(date)) {
                const now = new Date();
                const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));

                if (event._parsedDate < threeHoursAgo) {
                    return false;
                }
            }
            return true;
        });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
                    <p className="text-slate-500 mt-1">
                        Overview for <span className="font-semibold text-slate-900">{date ? format(date, "MMMM do, yyyy") : "Today"}</span>
                    </p>
                    {todayHijri && (
                        <div className="text-sm font-medium text-emerald-600 mt-1 flex items-center gap-2">
                            <span>{todayHijri.split("/")[0]}</span>
                            <span className="text-slate-300">|</span>
                            <span className="font-arabic text-emerald-700">{todayHijri.split("/")[1]}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
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
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-5"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Event
                    </Button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <KPICard
                    title="Total Thaal"
                    value={isLoading ? "-" : totalThaal}
                    icon={Utensils}
                    trend="+12%"
                    trendUp={true}
                    loading={isLoading}
                    description="vs last week"
                />
                <KPICard
                    title="Scheduled Events"
                    value={isLoading ? "-" : activeEvents}
                    icon={Clock}
                    loading={isLoading}
                    description="Active today"
                />
                <KPICard
                    title="Cancelled"
                    value={isLoading ? "-" : cancelledEvents}
                    icon={Ban}
                    trend={cancelledEvents > 0 ? "Review" : "None"}
                    trendUp={cancelledEvents === 0}
                    loading={isLoading}
                />
                <KPICard
                    title="System Health"
                    value="98%"
                    icon={Activity}
                    trend="Stable"
                    trendUp={true}
                    loading={isLoading}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Activity Feed / Schedule (Col Span 8) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-500" />
                            Activity Feed
                        </h3>
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                            View All
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex flex-col gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 w-full bg-white rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : !sortedAndFilteredEvents || sortedAndFilteredEvents.length === 0 ? (
                            <Card className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 bg-slate-50/50">
                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                    <Clock className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-slate-500 font-medium">No active events</p>
                                <Button variant="link" onClick={() => router.push("/events/new")} className="mt-2 text-indigo-600">
                                    Schedule an Event
                                </Button>
                            </Card>
                        ) : (
                            sortedAndFilteredEvents.map((event) => {
                                const isCancelled = event.status === "CANCELLED";
                                return (
                                    <Card
                                        key={event.id}
                                        onClick={() => router.push(`/events/${event.id}`)}
                                        className={`group relative p-5 cursor-pointer hover:shadow-md transition-all duration-200 border-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${isCancelled ? "opacity-60" : ""}`}
                                    >
                                        <div className="flex items-center gap-5">
                                            {/* Time Column */}
                                            <div className="flex flex-col items-center justify-center min-w-[70px] border-r border-slate-100 pr-5">
                                                <span className="text-lg font-bold text-foreground">{event.occasionTime.split(' ')[0]}</span>
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{event.occasionTime.split(' ')[1]}</span>
                                            </div>

                                            {/* Content Column */}
                                            <div className="flex-1 min-w-0 py-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className={cn("font-bold text-base text-foreground mb-1", isCancelled && "line-through text-muted-foreground")}>
                                                            {event.name}
                                                        </h4>
                                                        {(event as any).hijriDate && (
                                                            <div className="hidden sm:flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                                BS Izzan
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                                    <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                                                        <Warehouse className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="truncate max-w-[150px]">{Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                                                        <Utensils className="h-3.5 w-3.5 text-slate-400" />
                                                        <span>{event.thaalCount} Thaal</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Column */}
                                            <div className="flex items-center">
                                                {isAdmin ? (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenuItem onClick={() => router.push(`/events/${event.id}`)}>
                                                                View Details
                                                            </DropdownMenuItem>
                                                            {!isCancelled && (
                                                                <DropdownMenuItem className="text-red-600" onClick={(e) => handleCancel(e, event.id)}>
                                                                    <Ban className="mr-2 h-4 w-4" /> Cancel Event
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-red-600" onClick={(e) => handleDeleteClick(e, event.id)}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                ) : (
                                                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                        <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Sidebar (Col Span 4) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Calendar Widget */}
                    <Link href="/events/calendar">
                        <Card className="min-h-[350px] p-4">
                            <SharedCalendar
                                embedded={true}
                                onDateSelect={handleDateChange}
                                initialDate={date}
                            />
                        </Card>
                    </Link>
                </div>
            </div>

            {/* Mobile Calendar Dialog */}
            <div className="md:hidden fixed bottom-6 right-6 z-50">
                <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <SheetTrigger asChild>
                        <Button className="h-14 w-14 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center hover:bg-indigo-700 hover:scale-105 transition-all">
                            <CalendarIcon className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[480px] rounded-t-3xl">
                        <div className="flex justify-center pt-8">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={handleDateChange}
                                className="rounded-md"
                                locale={enGB}
                                classNames={{
                                    day_selected: "bg-indigo-600 text-white hover:bg-indigo-700 focus:bg-indigo-700 rounded-md",
                                    day_today: "bg-slate-100 text-slate-900 font-bold border border-slate-200 rounded-md",
                                    head_cell: "text-muted-foreground font-medium text-[0.8rem] text-slate-500",
                                    cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-md transition-colors text-slate-700",
                                }}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Delete Confirmation Dialog */}
            {
                deleteConfirmOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
                                    <p className="text-slate-500 text-sm">This action cannot be undone.</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-slate-700 text-sm">
                                    This event has <span className="font-bold text-slate-900">{relatedData?.count} inventory logs</span> associated with it.
                                    Deleting this event will permanently remove the event and all its history.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => { setDeleteConfirmOpen(false); setSelectedEventId(null); }} className="rounded-xl">Cancel</Button>
                                <Button variant="destructive" onClick={() => selectedEventId && performDelete(selectedEventId, true)} className="rounded-xl px-6">Delete Everything</Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
