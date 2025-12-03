
"use client";

import { useEffect, useState } from "react";
import { format, isPast, isToday, isFuture } from "date-fns";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, Search, MapPin, Users, Phone, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Event } from "@/types";

import { useCurrentRole } from "@/hooks/use-current-role";

export default function EventsPage() {
    const router = useRouter();
    const role = useCurrentRole();
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch("/api/events");
                if (res.ok) {
                    const data = await res.json();
                    // Sort by date descending (newest first)
                    const sorted = data.sort((a: Event, b: Event) =>
                        new Date(b.occasionDate).getTime() - new Date(a.occasionDate).getTime()
                    );
                    setEvents(sorted);
                    setFilteredEvents(sorted);
                }
            } catch (error) {
                console.error("Failed to load events");
            } finally {
                setIsLoading(false);
            }
        };
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

    const getEventStatus = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) return <Badge className="bg-green-500 hover:bg-green-600">Today</Badge>;
        if (isFuture(date)) return <Badge className="bg-blue-500 hover:bg-blue-600">Upcoming</Badge>;
        return <Badge variant="secondary">Past</Badge>;
    };

    const canCreate = role === "ADMIN" || role === "MANAGER";

    return (
        <div className="container mx-auto p-4 max-w-5xl space-y-6">
            <PageHeader
                title="All Events"
                description="Manage and view all scheduled events."
                actions={
                    canCreate && (
                        <Button onClick={() => router.push("/events/new")} className="bg-amber-600 hover:bg-amber-700 shadow-sm">
                            <Plus className="mr-2 h-4 w-4" /> New Event
                        </Button>
                    )
                }
            />

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search events by name, mobile, or hall..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-12 bg-white shadow-sm border-slate-200"
                />
            </div>

            {/* Events Grid */}
            {isLoading ? (
                <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No events found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map((event) => (
                        <Card
                            key={event.id}
                            className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-slate-200 overflow-hidden"
                            onClick={() => router.push(`/events/${event.id}`)}
                        >
                            <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-semibold text-slate-900 line-clamp-1">
                                            {event.description}
                                        </CardTitle>
                                        <div className="flex items-center text-xs text-slate-500">
                                            <Calendar className="mr-1 h-3 w-3" />
                                            {format(new Date(event.occasionDate), "EEE, MMM d, yyyy")}
                                        </div>
                                    </div>
                                    {getEventStatus(event.occasionDate)}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center text-sm text-slate-600">
                                    <Users className="mr-2 h-4 w-4 text-slate-400" />
                                    <span className="font-medium">{event.name}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <Phone className="mr-2 h-4 w-4 text-slate-400" />
                                    <span>{event.mobile}</span>
                                </div>
                                <div className="flex items-start text-sm text-slate-600">
                                    <MapPin className="mr-2 h-4 w-4 text-slate-400 mt-0.5" />
                                    <span className="line-clamp-2">{Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}</span>
                                </div>
                                <div className="pt-2 flex items-center justify-between border-t border-slate-100 mt-2">
                                    <div className="flex items-center text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                        <Clock className="mr-1 h-3 w-3" />
                                        {event.occasionTime}
                                    </div>
                                    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                                        {event.thaalCount} Thaal
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
