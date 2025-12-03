
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Utensils, Warehouse, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { Event } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
    const router = useRouter();
    const [date] = useState(new Date());

    // Fetch events (no polling, stable key)
    const { data: events, isLoading } = useSWR<Event[]>(
        `/api/events?date=${date.toISOString()}`,
        fetcher
    );

    const totalThaal = events?.reduce((sum, event) => sum + (event.thaalCount || 0), 0) || 0;
    const hallsBooked = new Set(events?.map(e => e.hall)).size || 0;

    const handleShare = (eventId: string) => {
        const url = `${window.location.origin}/public/events/${eventId}`;
        navigator.clipboard.writeText(url);
        toast.success("Public link copied to clipboard!");
    };

    return (
        <div className="p-8 space-y-10 bg-slate-50/50 min-h-full">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-2 text-lg">Overview for {format(new Date(), "EEEE, MMMM do, yyyy")}</p>
                </div>
                <Button onClick={() => router.push("/events/new")} className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6 text-lg rounded-xl">
                    <CalendarIcon className="mr-2 h-5 w-5" /> New Event
                </Button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Thaal</p>
                            <h3 className="text-3xl font-bold text-slate-900">{isLoading ? "..." : totalThaal}</h3>
                        </div>
                        <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Utensils className="h-6 w-6 text-amber-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Halls Occupied</p>
                            <h3 className="text-3xl font-bold text-slate-900">{isLoading ? "..." : hallsBooked}</h3>
                        </div>
                        <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Warehouse className="h-6 w-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Events Today</p>
                            <h3 className="text-3xl font-bold text-slate-900">{isLoading ? "..." : events?.length || 0}</h3>
                        </div>
                        <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <CalendarIcon className="h-6 w-6 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Events Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Today's Schedule</h2>
                    <Button variant="ghost" className="text-slate-500 hover:text-slate-900" onClick={() => router.push("/events")}>
                        View All &rarr;
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div></div>
                ) : events?.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarIcon className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No events scheduled</h3>
                        <p className="text-slate-500 mt-1">Your calendar is clear for today.</p>
                        <Button variant="link" onClick={() => router.push("/events/new")} className="text-amber-600 mt-2 font-medium">
                            Create Event
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events?.map((event) => (
                            <Card key={event.id} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-2xl overflow-hidden flex flex-col group">
                                <div className="p-6 flex-grow">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-1 rounded-lg text-sm font-medium">
                                            {event.occasionTime}
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-600 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => router.push(`/events/${event.id}/edit`)}>
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1" title={event.description}>
                                        {event.description}
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-6 flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                                        {event.name}
                                    </p>

                                    <div className="space-y-3">
                                        <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                            <Warehouse className="h-4 w-4 mr-3 text-slate-400" />
                                            <span className="font-medium truncate" title={Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}>
                                                {Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                            <Utensils className="h-4 w-4 mr-3 text-slate-400" />
                                            <span className="font-medium">{event.thaalCount} Thaal</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center gap-3">
                                    <Button variant="ghost" size="sm" className="flex-1 text-slate-600 hover:text-amber-600 hover:bg-amber-50" onClick={() => handleShare(event.id)}>
                                        Share
                                    </Button>
                                    <div className="h-4 w-px bg-slate-200"></div>
                                    <Button variant="ghost" size="sm" className="flex-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50" onClick={() => router.push(`/events/${event.id}/print`)}>
                                        Print
                                    </Button>
                                    <div className="h-4 w-px bg-slate-200"></div>
                                    <Button variant="ghost" size="sm" className="flex-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => router.push(`/events/${event.id}/inventory`)}>
                                        Manage
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
