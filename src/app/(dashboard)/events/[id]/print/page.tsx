"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Printer, Phone, Calendar, MapPin, User, Utensils, FileText, CheckSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Event } from "@/types";

export default function EventPrintPage() {
    const params = useParams();
    const eventId = params.id as string;
    const [event, setEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/events/${eventId}`);
                if (res.ok) {
                    const data = await res.json();
                    setEvent(data);
                }
            } catch (error) {
                console.error("Failed to load event");
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    if (isLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>;
    if (!event) return <div className="p-10 text-center text-red-500">Event not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 print:p-0 print:bg-white">
            <style type="text/css" media="print">
                {`
                    @page { size: A4; margin: 5mm; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                `}
            </style>

            {/* No-Print Controls */}
            <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <Button variant="outline" onClick={() => window.history.back()}>Back to Dashboard</Button>
                <Button onClick={() => window.print()} className="bg-amber-600 hover:bg-amber-700 text-white shadow-md">
                    <Printer className="mr-2 h-4 w-4" /> Print Form
                </Button>
            </div>

            {/* Print Container */}
            <div className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none print:w-full border print:border-none rounded-xl overflow-hidden">

                {/* Header - Compact & Removed Bismillah */}
                <div className="bg-slate-900 text-white p-6 text-center print:bg-slate-900 print:text-white print:p-4">
                    <h1 className="text-3xl font-bold uppercase tracking-wide font-serif mb-1 print:text-2xl print:mb-0">Anjuman-e-Mohammedi</h1>
                    <p className="text-sm opacity-80 uppercase tracking-wider print:text-xs">Secunderabad</p>
                </div>

                {/* Document Title */}
                <div className="bg-amber-50 border-b border-amber-100 p-3 text-center print:bg-amber-50 print:border-amber-100 print:p-2">
                    <h2 className="text-xl font-bold text-amber-900 uppercase tracking-widest print:text-lg">Miqaat Booking Form</h2>
                </div>

                <div className="p-8 print:p-4">
                    {/* Section 1: Booker & Event Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8 print:gap-4 print:mb-4">
                        <div className="space-y-4 print:space-y-2">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1 mb-2 flex items-center print:mb-1">
                                <User className="w-4 h-4 mr-2" /> Booker Details
                            </h3>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-semibold">Name</label>
                                <p className="text-lg font-medium print:text-base">{event.name}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-semibold">Mobile</label>
                                <p className="text-lg font-medium font-mono print:text-base">{event.mobile}</p>
                            </div>
                            {event.email && (
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-semibold">Email</label>
                                    <p className="text-base print:text-sm">{event.email}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 print:space-y-2">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1 mb-2 flex items-center print:mb-1">
                                <Calendar className="w-4 h-4 mr-2" /> Event Details
                            </h3>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-semibold">Occasion</label>
                                <p className="text-lg font-medium print:text-base">{event.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 print:gap-2">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-semibold">Date</label>
                                    <p className="text-lg font-medium print:text-base">{format(new Date(event.occasionDate), "PPP")}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-semibold">Time</label>
                                    <p className="text-lg font-medium print:text-base">{event.occasionTime}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Venue & Caterer */}
                    <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-100 print:bg-slate-50 print:border-slate-100 print:p-3 print:mb-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1 mb-4 flex items-center print:mb-2">
                            <MapPin className="w-4 h-4 mr-2" /> Venue & Catering
                        </h3>
                        <div className="grid grid-cols-2 gap-8 print:gap-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-semibold">Hall(s) Booked</label>
                                <p className="text-lg font-medium text-slate-900 print:text-base">
                                    {Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-semibold">Caterer</label>
                                <p className="text-lg font-medium text-slate-900 print:text-base">
                                    {event.catererName || "Not Specified"}
                                    {event.catererPhone && <span className="text-slate-500 text-sm ml-2">({event.catererPhone})</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Requirements & Menu */}
                    <div className="grid grid-cols-3 gap-8 mb-8 print:gap-4 print:mb-4">
                        <div className="col-span-2 space-y-4 print:space-y-2">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1 mb-2 flex items-center print:mb-1">
                                <CheckSquare className="w-4 h-4 mr-2" /> Requirements
                            </h3>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-6 mb-6 print:mb-2 print:gap-y-1">
                                <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                                    <span className="text-sm text-slate-600">Thaal Count</span>
                                    <span className="font-bold">{event.thaalCount}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                                    <span className="text-sm text-slate-600">Sarkari Sets</span>
                                    <span className="font-bold">{event.sarkariThaalSet}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                                    <span className="text-sm text-slate-600">Tables & Chairs</span>
                                    <span className="font-bold">{event.tablesAndChairs}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                                    <span className="text-sm text-slate-600">Extra Chilamchi</span>
                                    <span className="font-bold">{event.extraChilamchiLota}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs text-slate-500 uppercase font-semibold mb-2 print:mb-1">Additional Items</p>
                                <div className="grid grid-cols-2 gap-2 print:gap-1">
                                    {[
                                        { label: "Bhai Saab Izzan", value: event.bhaiSaabIzzan },
                                        { label: "Ben Saab Izzan", value: event.benSaabIzzan },
                                        { label: "Microphone", value: event.mic },
                                        { label: "Crockery", value: event.crockeryRequired },
                                        { label: "Thaal for Devri", value: event.thaalForDevri },
                                        { label: "PAAT", value: event.paat },
                                        { label: "Masjid Light", value: event.masjidLight },
                                    ].filter(item => item.value).map((item) => (
                                        <div key={item.label} className="flex items-center space-x-2">
                                            <div className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center print:bg-green-100 print:text-green-600 print:h-4 print:w-4">
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <span className="text-sm font-medium print:text-xs">{item.label}</span>
                                        </div>
                                    ))}
                                    {[
                                        { label: "Bhai Saab Izzan", value: event.bhaiSaabIzzan },
                                        { label: "Ben Saab Izzan", value: event.benSaabIzzan },
                                        { label: "Microphone", value: event.mic },
                                        { label: "Crockery", value: event.crockeryRequired },
                                        { label: "Thaal for Devri", value: event.thaalForDevri },
                                        { label: "PAAT", value: event.paat },
                                        { label: "Masjid Light", value: event.masjidLight },
                                    ].every(item => !item.value) && (
                                            <span className="text-sm text-slate-400 italic">No additional items selected</span>
                                        )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 print:space-y-2">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1 mb-2 flex items-center print:mb-1">
                                <Utensils className="w-4 h-4 mr-2" /> Menu
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[120px] text-sm whitespace-pre-wrap print:bg-slate-50 print:border-slate-100 print:p-2 print:min-h-[80px] print:text-xs">
                                {event.menu || "No menu specified."}
                            </div>
                        </div>
                    </div>

                    {/* Footer / Signatures */}
                    <div className="mt-16 pt-8 border-t-2 border-slate-200 print:mt-8 print:pt-4">
                        <div className="grid grid-cols-2 gap-16 print:gap-8">
                            <div className="text-center">
                                <div className="h-16 border-b border-slate-300 mb-2 print:h-12"></div>
                                <p className="text-sm font-bold uppercase text-slate-500 print:text-xs">Booker Signature</p>
                            </div>
                            <div className="text-center">
                                <div className="h-16 border-b border-slate-300 mb-2 print:h-12"></div>
                                <p className="text-sm font-bold uppercase text-slate-500 print:text-xs">Office Signature</p>
                            </div>
                        </div>
                        <div className="mt-8 text-center text-xs text-slate-400 print:text-black print:mt-4">
                            <p>Generated by Jamaat Inventory System on {format(new Date(), "PPP 'at' p")}</p>
                            <p className="mt-1">This is a computer-generated document.</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
