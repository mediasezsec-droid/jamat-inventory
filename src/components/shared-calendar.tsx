"use client";

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Event } from "@/types";
import { Loader2 } from "lucide-react";
import { getMisriDate } from "@/lib/misri-calendar";
import { getISTDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
    status: string;
}

interface SharedCalendarProps {
    onDateSelect?: (date: Date) => void;
    onEventSelect?: (eventId: string) => void;
    embedded?: boolean;
    initialDate?: Date;
}

export function SharedCalendar({ onDateSelect, onEventSelect, embedded = false, initialDate }: SharedCalendarProps) {
    const router = useRouter();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(initialDate || new Date());

    useEffect(() => {
        if (initialDate) setDate(initialDate);
    }, [initialDate]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Fetch all events for the calendar visual
                const res = await fetch("/api/events");
                if (res.ok) {
                    const data: Event[] = await res.json();

                    const calendarEvents = data.map(event => {
                        // Use getISTDate to parse the occasionDate string into a local Date object representing the IST day.
                        // The time components from occasionTime are then applied to this base date.
                        const dateObj = getISTDate(event.occasionDate);
                        const year = dateObj.getFullYear();
                        const month = dateObj.getMonth();
                        const day = dateObj.getDate();
                        const [hours, minutes] = event.occasionTime.split(":").map(Number);

                        let start = new Date(year, month, day, hours, minutes, 0, 0);
                        if (isNaN(start.getTime())) start = new Date(); // Fallback

                        const end = new Date(start);
                        end.setHours(start.getHours() + 3);

                        return {
                            id: event.id,
                            title: embedded ? event.name : `${event.name} (${event.hall})`, // Show name in embedded
                            start: start,
                            end: end,
                            allDay: false,
                            status: event.status || "BOOKED",
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
    }, [embedded]);

    const onNavigate = (newDate: Date) => {
        setDate(newDate);
        if (onDateSelect) onDateSelect(newDate);
    };

    const handleSelectSlot = ({ start }: { start: Date }) => {
        setDate(start);
        if (onDateSelect) onDateSelect(start);
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        if (onEventSelect) onEventSelect(event.id);
        else router.push(`/events/${event.id}`);
    };

    const eventStyleGetter = (event: CalendarEvent) => {
        let backgroundColor = "#10b981"; // Emerald-500
        if (event.status === "CANCELLED") backgroundColor = "#ef4444"; // Red-500
        else if (new Date(event.start) < new Date()) backgroundColor = "#64748b"; // Slate-500 (Past)

        return {
            style: {
                backgroundColor,
                borderRadius: "4px",
                opacity: 0.9,
                color: "white",
                border: "0px",
                display: "block",
                margin: "1px 0",
                fontSize: embedded ? "10px" : "12px",
                padding: embedded ? "0px 2px" : "2px 5px",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis"
            }
        };
    };

    // Custom Toolbar for Embedded View (Simpler)
    const renderToolbar = (toolbar: any) => {
        if (!embedded) return undefined; // Use default

        const goToBack = () => {
            toolbar.onNavigate('PREV');
        };
        const goToNext = () => {
            toolbar.onNavigate('NEXT');
        };
        const label = () => {
            const date = toolbar.date;
            return format(date, "MMMM yyyy");
        };

        return (
            <div className="rbc-toolbar flex justify-between items-center mb-2 p-1">
                <span className="rbc-btn-group">
                    <button type="button" onClick={goToBack}><span className="text-xs">&lt;</span></button>
                    {/* <button type="button" onClick={goToCurrent}><span className="text-xs">Today</span></button> */}
                    <button type="button" onClick={goToNext}><span className="text-xs">&gt;</span></button>
                </span>
                <span className="rbc-toolbar-label text-sm font-semibold">{label()}</span>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className={embedded ? "h-[380px]" : "h-[700px]"}>
            <style>{`
                .rbc-calendar { font-family: inherit; }
                .rbc-header { padding: 8px 0; font-weight: 600; color: #475569; font-size: ${embedded ? '0.75rem' : 'inherit'}; }
                .rbc-month-view { border-radius: 12px; border: 1px solid #e2e8f0; }
                .rbc-today { background-color: #f8fafc; }
                .rbc-off-range-bg { background-color: #f1f5f9; }
                .rbc-date-cell { padding-right: 4px; font-size: ${embedded ? '0.7rem' : 'inherit'}; }
                .rbc-row-content { z-index: 10; }
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
                onView={setView}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable={true}
                eventPropGetter={eventStyleGetter}
                views={embedded ? [Views.MONTH] : [Views.MONTH, Views.WEEK, Views.DAY]}
                components={{
                    toolbar: embedded ? renderToolbar : undefined,
                    month: {
                        dateHeader: ({ date, label }) => {
                            // Render Hijri even in embedded mode
                            const hijri = getMisriDate(date);
                            return (
                                <div className="flex justify-between items-start px-1 pt-1">
                                    <div className="flex flex-col items-start">
                                        <span className={`text-emerald-700 font-arabic font-bold leading-none ${embedded ? "text-xs" : "text-lg"}`}>
                                            {hijri.dayAr}
                                        </span>
                                        {!embedded && (
                                            <span className="text-[10px] text-emerald-600 font-arabic font-medium leading-tight">
                                                {hijri.monthNameAr}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`font-semibold text-slate-700 ${embedded ? "text-xs" : "text-sm"}`}>{label}</span>
                                </div>
                            );
                        }
                    }
                }}
            />
        </div>
    );
}
