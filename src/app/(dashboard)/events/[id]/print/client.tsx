"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Download, Phone, Calendar, MapPin, User, Utensils, FileText, CheckSquare, Check, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Event } from "@/types";
import { generateMiqaatBookingForm } from "@/lib/pdf-generator";
import { getISTDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LagatDrawer } from "@/components/events/lagat-drawer";
import { RBACWrapper } from "@/components/rbac-wrapper";
// import {
//     Drawer,
//     DrawerClose,
//     DrawerContent,
//     DrawerDescription,
//     DrawerFooter,
//     DrawerHeader,
//     DrawerTitle,
//     DrawerTrigger,
// } from "@/components/ui/drawer";

const format12Hour = (timeStr: string | undefined | null) => {
    if (!timeStr || timeStr === "NA") return "NA";
    try {
        const [hours, minutes] = timeStr.split(":");
        const date = new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        if (isNaN(date.getTime())) return timeStr;
        return format(date, "h:mm a");
    } catch (e) {
        return timeStr;
    }
};

export default function EventPrintPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const eventId = params.id as string;
    const [event, setEvent] = useState<Event | null>(null);
    const [hijriDate, setHijriDate] = useState<string | null>(null);
    const [hijriDateAr, setHijriDateAr] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Lagat State (Ephemeral - Direct Amounts)
    // Initialize lazily to avoid flash, reading directly from searchParams
    const [lagatAmounts, setLagatAmounts] = useState<Record<string, string>>(() => {
        if (!searchParams) return {};
        const amounts: Record<string, string> = {
            thaal: searchParams.get("cost_thaal") || "",
            sarkari: searchParams.get("cost_sarkari") || "",
            kitchen: searchParams.get("cost_kitchen") || "",
            decoration: searchParams.get("cost_decoration") || "",
            other: searchParams.get("cost_other") || "",
            deposit: searchParams.get("cost_deposit") || "",
        };

        // Extract Hall Costs
        searchParams.forEach((val, key) => {
            if (key.startsWith("cost_hall_")) {
                amounts[key] = val;
            }
        });
        return amounts;
    });

    const handleLagatChange = (key: string, value: string) => {
        setLagatAmounts(prev => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/events/${eventId}`);
                if (res.ok) {
                    const data = await res.json();
                    setEvent(data);

                    // Fetch Hijri Date once we have the event date
                    if (data.occasionDate) {
                        const dateStr = format(getISTDate(data.occasionDate), "yyyy-MM-dd");
                        fetch(`/api/services/hijri-date?date=${dateStr}`)
                            .then(r => r.json())
                            .then(hData => {
                                if (hData.hijri) setHijriDate(hData.hijri);
                                if (hData.arabic) setHijriDateAr(hData.arabic);
                            })
                            .catch(e => console.error("Hijri fetch failed", e));
                    }
                }
            } catch (error) {
                console.error("Failed to load event");
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    // Calculate Grand Total
    const calculateGrandTotal = () => {
        const total = Object.values(lagatAmounts).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
        return total;
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);
    };

    const getLagatEntries = () => {
        const entries = [
            { label: "Thaal Amount", value: lagatAmounts.thaal },
            { label: "Sarkari Amount", value: lagatAmounts.sarkari },
            { label: "Kitchen Charge", value: lagatAmounts.kitchen },
            { label: "Decoration", value: lagatAmounts.decoration },
            { label: "Other Misc", value: lagatAmounts.other },
        ];

        // Add Halls
        Object.keys(lagatAmounts).forEach(key => {
            if (key.startsWith("cost_hall_")) {
                const hallName = key.replace("cost_hall_", "");
                entries.push({ label: `${hallName}`, value: lagatAmounts[key] });
            }
        });



        return entries.filter(e => Number(e.value) > 0);
    };

    const grandTotal = calculateGrandTotal();

    const handleDownload = () => {
        if (event) {
            // Helper for PDF currency (Safe font)
            const formatForPdf = (val: number | string) => {
                const num = Number(val) || 0;
                return "Rs. " + new Intl.NumberFormat('en-IN').format(num);
            };

            const entriesFormatted = getLagatEntries().map(e => {
                let qty = "-";
                let rate = "-";
                const totalVal = Number(e.value);

                // Map labels to event quantities to calculate Rate
                if (e.label === "Thaal Amount") {
                    const count = event.thaalCount || 0;
                    qty = String(count);
                    if (count > 0) rate = formatForPdf(totalVal / count);
                } else if (e.label === "Sarkari Amount") {
                    const count = event.sarkariThaalSet || 0;
                    qty = String(count);
                    if (count > 0) rate = formatForPdf(totalVal / count);
                } else {
                    // For other items, treat as qty 1 or fixed
                    if (e.label.includes("Cost") && !e.label.includes("Thaal") && !e.label.includes("Sarkari")) {
                        // Hall costs
                        qty = "1";
                        rate = formatForPdf(totalVal);
                    }
                    // Kitchen, Decoration, Deposit -> Qty "-", Rate "-" (or implies fixed)
                }

                return {
                    label: e.label,
                    quantity: qty,
                    rate: rate,
                    total: formatForPdf(totalVal)
                };
            });

            // Transform to format for PDF: { items: [{label, quantity, rate, total}], grandTotal }
            const pdfData = {
                items: entriesFormatted,
                grandTotal: formatForPdf(grandTotal),
                deposit: Number(lagatAmounts.deposit) > 0 ? formatForPdf(lagatAmounts.deposit) : undefined,
            };
            generateMiqaatBookingForm(event, hijriDate, hijriDateAr, pdfData);
        }
    }

    if (isLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
    if (!event) return <div className="p-10 text-center text-red-500">Event not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">

            {/* Controls */}
            <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <Button variant="outline" onClick={() => window.history.back()}>Back to Dashboard</Button>
                <div className="flex gap-4">
                    <RBACWrapper componentId="btn-event-edit-costs">
                        <Button
                            variant="secondary"
                            onClick={() => setIsDrawerOpen(true)}
                            className="bg-white border text-slate-700 hover:bg-slate-50 shadow-sm"
                        >
                            <Calculator className="mr-2 h-4 w-4" /> Edit Costs
                        </Button>
                    </RBACWrapper>
                    <span className="text-sm text-slate-500 self-center italic hidden md:block">Previewing PDF content...</span>
                    <RBACWrapper componentId="btn-event-download-pdf">
                        <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                    </RBACWrapper>
                </div>
            </div>

            {/* Preview Container */}
            <div className="max-w-4xl mx-auto bg-white shadow-xl theme-print-border rounded-xl overflow-hidden flex flex-col min-h-[297mm]">

                {/* Header - Image */}
                <div className="w-full relative shrink-0">
                    <img
                        src="/miqaat_thumbnail.png"
                        alt="Anjuman-e-Mohammedi"
                        className="w-full h-auto object-cover"
                    />
                </div>

                {/* Main Content */}
                <div className="p-8 flex-grow">

                    {/* Section 1: Booker Details */}
                    <div className="grid grid-cols-2 gap-8 mb-6">
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
                                <User className="w-4 h-4 mr-2" /> Booker
                            </h3>
                            <div>
                                <p className="text-lg font-bold text-slate-900">{event.name}</p>
                                <p className="text-sm text-slate-600 font-mono">{event.mobile}</p>
                                {event.email && <p className="text-sm text-slate-600">{event.email}</p>}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
                                <Calendar className="w-4 h-4 mr-2" /> Occasion
                            </h3>
                            <div>
                                <p className="text-lg font-bold text-slate-900">{event.description}</p>
                                <div className="flex gap-4 mt-1 text-sm text-slate-600">
                                    <span>{format(getISTDate(event.occasionDate), "PPP")}</span>
                                    <span>{format12Hour(event.occasionTime)}</span>
                                </div>
                                {hijriDate && (
                                    <div className="mt-1">
                                        <p className="text-sm font-semibold text-indigo-700">
                                            Hijri: {hijriDate}
                                        </p>
                                        {hijriDateAr && (
                                            <p className="text-lg font-arabic text-indigo-800 mt-1 text-right" dir="rtl">
                                                {hijriDateAr}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Venue & Caterer */}
                    <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center mb-3">
                            <MapPin className="w-4 h-4 mr-2" /> Venue & Catering
                        </h3>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-semibold">Hall(s)</label>
                                <p className="text-base font-bold text-slate-900">
                                    {Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-semibold">Caterer</label>
                                <p className="text-base font-bold text-slate-900">
                                    {event.catererName || "Not Specified"}
                                    {event.catererPhone && <span className="text-slate-500 font-normal ml-2">({event.catererPhone})</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Requirements */}
                    <div className="grid grid-cols-3 gap-8 mb-8">
                        <div className="col-span-2">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center mb-3">
                                <CheckSquare className="w-4 h-4 mr-2" /> Requirements
                            </h3>
                            <div className="grid grid-cols-2 gap-y-2 gap-x-8 mb-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-500 font-medium">Thaal Count</span>
                                        <span className="font-bold text-slate-900">{event.thaalCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-500 font-medium">Tables & Chairs</span>
                                        <span className="font-bold text-slate-900">{event.tablesAndChairs}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-500 font-medium">AC Start Time</span>
                                        <span className="font-bold text-slate-900">{format12Hour(event.acStartTime) || "NA"}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-500 font-medium">Gas Count</span>
                                        <span className="font-bold text-slate-900">{event.gasCount || 0}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-500 font-medium">Sarkari Sets</span>
                                        <span className="font-bold text-slate-900">{event.sarkariThaalSet}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-500 font-medium">Extra Chilamchi</span>
                                        <span className="font-bold text-slate-900">{event.extraChilamchiLota}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-500 font-medium">Party Time</span>
                                        <span className="font-bold text-slate-900">{format12Hour(event.partyTime) || "NA"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Checkbox Items */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: "Bhai Saab Izzan", value: event.bhaiSaabIzzan },
                                    { label: "Ben Saab Izzan", value: event.benSaabIzzan },
                                    { label: "Microphone", value: event.mic },
                                    { label: "Crockery", value: event.crockeryRequired },
                                    { label: "Thaal for Devri", value: event.thaalForDevri },
                                    { label: "PAAT", value: event.paat },
                                    { label: "Masjid Light", value: event.masjidLight },
                                ].filter(item => item.value).map((item) => (
                                    <span key={item.label} className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                                        <Check className="h-3 w-3 mr-1" /> {item.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-1">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center mb-3">
                                <Utensils className="w-4 h-4 mr-2" /> Menu
                            </h3>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[100px] text-xs whitespace-pre-wrap">
                                {event.menu || "No menu specified."}
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Lagat Details (Preview) */}
                    <div className="mb-0">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Lagat Details</h3>
                        <div className="flex gap-4">
                            <div className="flex-grow">
                                <table className="w-full text-xs box-border border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="border border-slate-300 p-2 text-left w-[70%]">Item</th>
                                            <th className="border border-slate-300 p-2 text-right w-[30%]">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getLagatEntries().length > 0 ? (
                                            getLagatEntries().map((row, i) => (
                                                <tr key={i}>
                                                    <td className="border border-slate-300 p-2 font-medium">{row.label}</td>
                                                    <td className="border border-slate-300 p-2 text-right font-semibold">{formatCurrency(Number(row.value))}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={2} className="border border-slate-300 p-2 text-center text-slate-400 italic">No cost details added.</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className="border border-slate-300 p-2 text-right font-bold bg-slate-50">GRAND TOTAL</td>
                                            <td className="border border-slate-300 p-2 text-right font-bold bg-slate-100">{formatCurrency(grandTotal)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="w-32 border-2 border-slate-800 p-2 flex flex-col items-center justify-center text-center shrink-0 rounded">
                                <div className="font-bold text-[10px] mb-1 uppercase leading-tight">Refundable<br />Deposit</div>
                                <div className="text-lg font-bold min-h-[30px] w-full border-t border-slate-200 mt-1 flex items-center justify-center pt-1">
                                    {Number(lagatAmounts.deposit) > 0 ? formatCurrency(Number(lagatAmounts.deposit)) : "-"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="mt-12 pt-4 border-t-2 border-slate-200 break-inside-avoid">
                        <div className="grid grid-cols-2 gap-12">
                            <div className="text-center">
                                <div className="h-12 border-b border-slate-300 mb-1"></div>
                                <p className="text-[10px] font-bold uppercase text-slate-500">Booker Signature</p>
                            </div>
                            <div className="text-center">
                                <div className="h-12 border-b border-slate-300 mb-1"></div>
                                <p className="text-[10px] font-bold uppercase text-slate-500">Office Signature</p>
                            </div>
                        </div>
                    </div>

                </div >

                {/* Footer */}
                < div className="mt-auto px-8 pb-8 pt-4 border-t border-slate-200 bg-slate-50" >
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">ANJUMAN-E-MOHAMMEDI</h1>
                            <p className="text-slate-500 text-xs font-medium tracking-wide">Miqaat Documentation</p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-900 font-mono font-bold text-sm tracking-widest">
                                {format(getISTDate(event.occasionDate), "ddMMyyyy")}-{event.mobile}
                            </p>
                            <p className="text-slate-400 text-[10px] mt-1">Digitally generated by Secunderabad Jamaat on {format(new Date(), "PPP p")}</p>
                        </div>
                    </div>
                </div >

            </div >

            {/* Calculation Drawer */}
            <LagatDrawer
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                amounts={lagatAmounts}
                onChange={(key, value) => {
                    setLagatAmounts(prev => {
                        const next = { ...prev, [key]: value };
                        // Update URL seamlessly
                        const params = new URLSearchParams(searchParams.toString());
                        Object.entries(next).forEach(([k, v]) => params.set(k.startsWith("cost_") ? k : `cost_${k}`, v));
                        router.replace(`?${params.toString()}`, { scroll: false });
                        return next;
                    });
                }}
                counts={{
                    thaalCount: event.thaalCount || 0,
                    sarkariCount: event.sarkariThaalSet || 0,
                }}
                halls={event.hall ? (Array.isArray(event.hall) ? event.hall : [event.hall]) : []}
                grandTotal={grandTotal}
            />

        </div >
    );
}
