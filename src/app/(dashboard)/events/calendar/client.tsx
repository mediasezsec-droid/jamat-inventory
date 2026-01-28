"use client";

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Event } from "@/types";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useRouter } from "next/navigation";
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMisriDate } from "@/lib/misri-calendar";

const locales = {
    "en-US": enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource?: any;
    status: string; // Relaxed type to avoid conflicts with undefined
}

export default function CalendarClient() {
    const router = useRouter();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch("/api/events");
                if (res.ok) {
                    const data: Event[] = await res.json();

                    const calendarEvents = data.map(event => {
                        // Assuming duration is "Start - End" or parsing logic generally needed? 
                        // For now, let's assume occasionTime is just start time string "HH:MM AM/PM"
                        // But we need a duration. Since schema might be simple, let's default to specific logic
                        // If we don't have end time, default to 4 hours?

                        // Robust Parsing Logic
                        // 1. Manually parse YYYY-MM-DD from the date string part
                        const datePart = event.occasionDate.split("T")[0];
                        const [year, month, day] = datePart.split("-").map(Number);

                        // 2. Parse HH:mm from time string
                        const [hours, minutes] = event.occasionTime.split(":").map(Number);

                        // 3. Create Local Date explicitly (Month is 0-indexed)
                        // This consistently creates a local date object for the given components
                        let start = new Date(year, month - 1, day, hours, minutes, 0, 0);

                        // Fallback validation
                        if (isNaN(start.getTime())) {
                            start = new Date(); // Safety fallback
                        }

                        // 4. End Date (Reduce to 3 hours to avoid crossing midnight)
                        const end = new Date(start);
                        end.setHours(start.getHours() + 3);

                        return {
                            id: event.id,
                            title: `${event.name} (${event.hall})`,
                            start: start,
                            end: end,
                            allDay: false, // Explicitly false to force time grid
                            status: event.status || "BOOKED", // Fallback for undefined
                            resource: event
                        };
                    });

                    setEvents(calendarEvents);
                }
            } catch (error) {
                console.error("Failed to fetch events", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const onNavigate = (newDate: Date) => setDate(newDate);
    const onView = (newView: View) => setView(newView);

    const onSelectEvent = (event: CalendarEvent) => {
        router.push(`/events/${event.id}`);
    };

    const eventStyleGetter = (event: CalendarEvent) => {
        let backgroundColor = "#10b981"; // Emerald-500
        if (event.status === "CANCELLED") backgroundColor = "#ef4444"; // Red-500
        else if (new Date(event.start) < new Date()) backgroundColor = "#64748b"; // Slate-500 (Past)

        return {
            style: {
                backgroundColor,
                borderRadius: "6px",
                opacity: 0.8,
                color: "white",
                border: "0px",
                display: "block"
            }
        };
    };

    return (
        <div className="container mx-auto p-8 md:p-12 max-w-7xl space-y-8">
            <PageHeader
                title="Event Calendar"
                description="Visual schedule of all upcoming bookings."
                backUrl="/events"
            />

            <Card className="p-6 border-0 shadow-sm min-h-[600px] bg-white">
                {isLoading ? (
                    <div className="flex h-[500px] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <div className="h-[700px]">
                        <style>{`
                            .rbc-calendar { font-family: inherit; }
                            .rbc-header { padding: 12px 0; font-weight: 600; color: #475569; }
                            .rbc-month-view { border-radius: 12px; border: 1px solid #e2e8f0; }
                            .rbc-today { background-color: #f8fafc; }
                            .rbc-off-range-bg { background-color: #f1f5f9; }
                            .rbc-toolbar button { border: 1px solid #e2e8f0; color: #475569; }
                            .rbc-toolbar button.rbc-active { background-color: #4f46e5; color: white; border-color: #4f46e5; }
                            .rbc-toolbar button:hover { background-color: #f1f5f9; }
                            .rbc-toolbar button.rbc-active:hover { background-color: #4338ca; }
                        `}</style>
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: "100%" }}
                            view={view}
                            date={date}
                            onNavigate={onNavigate}
                            onView={onView}
                            onSelectEvent={onSelectEvent}
                            eventPropGetter={eventStyleGetter}
                            views={[Views.MONTH, Views.WEEK, Views.DAY]}
                            popup
                            components={{
                                month: {
                                    dateHeader: ({ date, label }) => {
                                        const hijri = getMisriDate(date);
                                        return (
                                            <div className="flex justify-between items-start px-2 pt-2">
                                                <div className="flex flex-col items-start">
                                                    <span className="text-lg text-emerald-700 font-arabic font-bold leading-none">
                                                        {hijri.dayAr}
                                                    </span>
                                                    <span className="text-[10px] text-emerald-600 font-arabic font-medium leading-tight">
                                                        {hijri.monthNameAr}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-semibold text-slate-700">{label}</span>
                                            </div>
                                        );
                                    }
                                }
                            }}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
