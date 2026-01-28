"use client";


import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Path } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import {
    CalendarIcon,
    Loader2,
    ChevronRight,
    ChevronLeft,
    Check,
    User,
    MapPin,
    Utensils,
    AlertCircle,
    CheckCircle2,
    FileText,
    Sparkles
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Schema
const formSchema = z.object({
    // Step 1: Basic Details
    mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    occasionDate: z.date(),
    occasionTime: z.string().min(1, "Time is required"),
    description: z.string().min(1, "Description is required"),

    // Step 2: Venue & Caterer
    hall: z.array(z.string()).refine((value) => value.some((item) => item), {
        message: "You have to select at least one hall.",
    }),
    catererName: z.string().default(""),
    catererPhone: z.string().default(""),

    // Step 3: Essentials
    eventType: z.enum(["PUBLIC", "PRIVATE"]).default("PRIVATE"),
    thaalCount: z.coerce.number().min(0),
    hallCounts: z.record(z.string(), z.number()).optional(), // { "Hall A": 50 }
    sarkariThaalSet: z.coerce.number().min(0),
    bhaiSaabIzzan: z.boolean().default(false),
    benSaabIzzan: z.boolean().default(false),
    extraChilamchiLota: z.coerce.number().min(0),
    tablesAndChairs: z.coerce.number().min(0),
    mic: z.boolean().default(false),
    crockeryRequired: z.boolean().default(false),
    thaalForDevri: z.boolean().default(false),
    paat: z.boolean().default(false),
    masjidLight: z.boolean().default(false),
    menu: z.string().default(""),

    // Step 4: Add-ons
    acStartTime: z.string().optional(),
    partyTime: z.string().optional(),
    decorations: z.boolean().default(false),
    gasCount: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
    { id: 1, title: "Booker Info", icon: User },
    { id: 2, title: "Venue & Catering", icon: MapPin },
    { id: 3, title: "Logistics", icon: Utensils },
    { id: 4, title: "Facilities", icon: Sparkles },
    { id: 5, title: "Confirmation", icon: CheckCircle2 },
];


export default function NewEventPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromId = searchParams.get("fromId");

    const [step, setStep] = useState(1);

    // Confirmation & Status State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [status, setStatus] = useState<"idle" | "creating" | "success" | "error">("idle");
    const [statusMessage, setStatusMessage] = useState("");
    const [countdown, setCountdown] = useState(3);
    const [hijriDate, setHijriDate] = useState<string | null>(null);
    const [isLoadingHijri, setIsLoadingHijri] = useState(false);

    // Master Data
    const [availableHalls, setAvailableHalls] = useState<string[]>([]);
    const [availableCaterers, setAvailableCaterers] = useState<any[]>([]);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const res = await fetch("/api/settings/master-data");
                if (res.ok) {
                    const data = await res.json();
                    if (data.halls) setAvailableHalls(data.halls);
                    if (data.caterers) setAvailableCaterers(data.caterers);
                }
            } catch (error) {
                console.error("Failed to fetch master data", error);
            }
        };
        fetchMasterData();
    }, []);

    // Clone Event Logic
    useEffect(() => {
        if (!fromId) return;

        const fetchSourceEvent = async () => {
            try {
                toast.loading("Cloning event details...");
                const res = await fetch(`/api/events/${fromId}`);
                if (res.ok) {
                    const event = await res.json();

                    form.reset({
                        mobile: event.mobile,
                        name: event.name,
                        email: event.email || "",
                        occasionDate: new Date(), // Reset date
                        occasionTime: "", // Reset time
                        description: event.description,
                        hall: Array.isArray(event.hall) ? event.hall : [event.hall],
                        catererName: event.catererName,
                        catererPhone: event.catererPhone,
                        thaalCount: event.thaalCount,
                        sarkariThaalSet: event.sarkariThaalSet,
                        extraChilamchiLota: event.extraChilamchiLota,
                        tablesAndChairs: event.tablesAndChairs,
                        bhaiSaabIzzan: event.bhaiSaabIzzan || false,
                        benSaabIzzan: event.benSaabIzzan || false,
                        mic: event.mic || false,
                        crockeryRequired: event.crockeryRequired || false,
                        thaalForDevri: event.thaalForDevri || false,
                        paat: event.paat || false,
                        masjidLight: event.masjidLight || false,
                        menu: event.menu || "",
                        acStartTime: event.acStartTime || "",
                        partyTime: event.partyTime || "",
                        decorations: event.decorations || false,
                        gasCount: event.gasCount || 0,
                    });
                    toast.dismiss();
                    toast.success("Event details cloned! Please set a new date and time.");
                } else {
                    toast.dismiss();
                    toast.error("Failed to load source event for cloning.");
                }
            } catch (error) {
                console.error("Clone failed", error);
                toast.dismiss();
                toast.error("Error cloning event.");
            }
        };

        fetchSourceEvent();
    }, [fromId]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            mobile: "",
            name: "",
            email: "",
            occasionDate: new Date(),
            occasionTime: "",
            description: "",
            hall: [],
            catererName: "",
            catererPhone: "",
            thaalCount: 0,
            sarkariThaalSet: 0,
            extraChilamchiLota: 0,
            tablesAndChairs: 0,
            bhaiSaabIzzan: false,
            benSaabIzzan: false,
            mic: false,
            crockeryRequired: false,
            thaalForDevri: false,
            paat: false,
            masjidLight: false,
            eventType: "PRIVATE",
            hallCounts: {},
            menu: "",
            acStartTime: "",
            partyTime: "",
            decorations: false,
            gasCount: 0,
        },
    });

    const watchedDate = form.watch("occasionDate");
    const watchedTime = form.watch("occasionTime");
    const watchedHall = form.watch("hall");

    // Watch for date changes to fetch Hijri date
    const occasionDate = form.watch("occasionDate");
    useEffect(() => {
        if (occasionDate) {
            setIsLoadingHijri(true);
            const dateStr = format(occasionDate, "yyyy-MM-dd");
            fetch(`/api/services/hijri-date?date=${dateStr}`)
                .then(r => r.json())
                .then(data => {
                    if (data.hijri) {
                        setHijriDate(`${data.hijri} / ${data.arabic}`);
                    } else {
                        setHijriDate(null);
                    }
                })
                .catch(e => {
                    console.error("Hijri fetch failed", e);
                    setHijriDate(null);
                })
                .finally(() => setIsLoadingHijri(false));
        } else {
            setHijriDate(null);
        }
    }, [occasionDate]);

    useEffect(() => {
        const checkRealtimeConflict = async () => {
            if (!watchedDate || !watchedTime || !watchedHall || watchedHall.length === 0) return;

            try {
                const res = await fetch("/api/events/check-conflict", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        occasionDate: watchedDate,
                        occasionTime: watchedTime,
                        hall: watchedHall,
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.conflictType === "hard") {
                        toast.error("Format Conflict: " + data.conflictMessage, { duration: 4000 });
                        // Optionally set a localized error state
                    } else if (data.conflictType === "soft") {
                        toast.warning("Buffer Warning: " + data.conflictMessage, { duration: 5000 });
                    }
                }
            } catch (e) {
                // Silent fail for realtime check
            }
        };

        const timer = setTimeout(checkRealtimeConflict, 1000);
        return () => clearTimeout(timer);
    }, [watchedDate, watchedTime, watchedHall]);

    const formValues = form.getValues();

    // Mobile lookup
    const handleMobileBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const mobile = e.target.value;
        if (mobile.length >= 10) {
            try {
                const res = await fetch(`/api/lookup/mobile?mobile=${mobile}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.name) {
                        form.setValue("name", data.name);
                        toast.info(`Found existing user: ${data.name}`);
                    }
                }
            } catch (error) {
                console.error("Lookup failed", error);
            }
        }
    }

    const nextStep = async () => {
        let fieldsToValidate: Path<FormValues>[] = [];
        if (step === 1) {
            fieldsToValidate = ["mobile", "name", "email", "occasionDate", "occasionTime", "description"];
        } else if (step === 2) {
            fieldsToValidate = ["hall", "catererName", "catererPhone"];
        } else if (step === 3) {
            fieldsToValidate = ["thaalCount", "sarkariThaalSet", "extraChilamchiLota", "tablesAndChairs", "menu"];
        } else if (step === 4) {
            fieldsToValidate = ["acStartTime", "partyTime", "decorations", "gasCount"];
        }

        const isValid = await form.trigger(fieldsToValidate);
        if (isValid) {
            setStep((prev) => prev + 1);
        }
    };

    const prevStep = () => setStep((prev) => prev - 1);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
            e.preventDefault();
        }
    };

    async function onSubmit(values: FormValues) {
        setIsConfirmOpen(false);
        setStatusOpen(true);
        setStatus("creating");
        setStatusMessage("Checking availability and creating event...");

        try {
            // Check conflicts
            const conflictRes = await fetch("/api/events/check-conflict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    occasionDate: values.occasionDate,
                    occasionTime: values.occasionTime,
                    hall: values.hall,
                }),
            });

            const conflictData = await conflictRes.json();

            if (conflictData.conflictType === "hard") {
                setStatus("error");
                setStatusMessage(conflictData.conflictMessage || "Hall is supposedly valid"); // Typesafe fallback
                // If it's a hard conflict, we show the error dialog
                return;
            }

            if (conflictData.conflictType === "soft") {
                const occupied = conflictData.occupiedHalls?.join(", ") || "Selected Hall";
                // const available = conflictData.availableHalls?.join(", ") || "None"; 
                // We might not want to show ALL available halls in a simple alert, maybe just warn about the occupied ones.
                // User asked to "show the occupied halls too and available options".

                const availableMsg = conflictData.availableHalls && conflictData.availableHalls.length > 0
                    ? `\n\nAvailable Halls: ${conflictData.availableHalls.join(", ")}`
                    : "\n\nNo other halls available.";

                const message = `BUFFER ALERT: 2-Hour Buffer Violation.\n\nThe following halls have insufficient buffer time from another event:\n👉 ${occupied}\n${conflictData.conflictMessage}${availableMsg}\n\nDo you want to proceed anyway?`;

                const confirmed = window.confirm(message);
                if (!confirmed) {
                    setStatusOpen(false);
                    return;
                }
            }

            // Create Event
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create event");
            }

            setStatus("success");
            setStatusMessage("Event created successfully!");

            let count = 3;
            setCountdown(count);
            const interval = setInterval(() => {
                count -= 1;
                setCountdown(count);
                if (count === 0) {
                    clearInterval(interval);
                    router.push(`/events/${data.id}/print`);
                }
            }, 1000);

        } catch (error: any) {
            console.error(error);
            setStatus("error");
            setStatusMessage(error.message || "Failed to create event");
        }
    }

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
            {/* Gradient Header */}
            {/* Header */}
            <Card className="p-6 mb-8 border-0 shadow-sm relative overflow-hidden bg-white">
                <div className="flex items-center gap-4 relative z-10">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="h-10 w-10 p-0 hover:bg-slate-100"
                    >
                        <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">New Booking</h1>
                        <p className="text-muted-foreground text-sm">Step {step} of {steps.length} • {format(new Date(), "EEEE, MMMM d")}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{Math.round((step / steps.length) * 100)}% Complete</span>
                    </div>
                </div>
            </Card>

            {/* Mobile Progress Indicator */}
            <div className="md:hidden mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Step {step}: {steps[step - 1]?.title}</span>
                    <span className="text-sm text-slate-400">{step}/{steps.length}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-500"
                        style={{ width: `${(step / steps.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Desktop Progress Bar */}
            <div className="mb-10 relative hidden md:block">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full -z-10"></div>
                <div
                    className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full -z-10 transition-all duration-500"
                    style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                ></div>

                <div className="flex justify-between">
                    {steps.map((s) => {
                        const isCompleted = step > s.id;
                        const isCurrent = step === s.id;
                        const isClickable = s.id < step; // Can go back to previous steps
                        return (
                            <div
                                key={s.id}
                                className={cn(
                                    "flex flex-col items-center gap-2 relative z-10",
                                    isClickable && "cursor-pointer"
                                )}
                                onClick={() => isClickable && setStep(s.id)}
                            >
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white",
                                        isCompleted ? "border-primary text-primary shadow-sm" :
                                            isCurrent ? "border-primary text-primary shadow-md ring-4 ring-primary/10" :
                                                "border-slate-200 text-slate-300"
                                    )}
                                >
                                    {isCompleted ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                                </div>
                                <span className={cn(
                                    "text-xs font-semibold whitespace-nowrap transition-colors duration-300",
                                    isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {s.title}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Form Card */}
            <Card className="border-0 shadow-sm rounded-[10px] overflow-hidden min-h-[500px]">
                <CardContent className="p-8">
                    <Form {...form}>
                        <form onKeyDown={handleKeyDown} onSubmit={(e) => e.preventDefault()} className="space-y-8">

                            {/* Step 1: Basic Details */}
                            {step === 1 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="mobile" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mobile Number</FormLabel>
                                                <FormControl><Input placeholder="03xxxxxxxxx" {...field} onBlur={(e) => { field.onBlur(); handleMobileBlur(e); }} className="h-12 border-slate-200" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Booker Name</FormLabel>
                                                <FormControl><Input placeholder="Full Name" {...field} className="h-12 border-slate-200" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email (Optional)</FormLabel>
                                            <FormControl><Input placeholder="email@example.com" {...field} className="h-12 border-slate-200" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="occasionDate" render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button variant={"outline"} className={cn("h-12 w-full pl-3 text-left font-normal border-slate-200", !field.value && "text-muted-foreground")}>
                                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="occasionTime" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Time</FormLabel>
                                                <FormControl><Input type="time" {...field} className="h-12 border-slate-200" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="space-y-2">
                                            <FormLabel className="text-slate-500">Hijri Date</FormLabel>
                                            <div className="relative h-12 flex items-center px-3 border border-slate-200 rounded-md bg-slate-50 gap-2">
                                                {isLoadingHijri ? (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Loader2 className="h-3 w-3 animate-spin" /> Calculating...
                                                    </div>
                                                ) : hijriDate ? (
                                                    <div className="flex items-center gap-2 w-full justify-end">
                                                        <span className="text-sm font-medium text-slate-700">{hijriDate.split("/")[0]}</span>
                                                        <span className="text-sm text-slate-400">/</span>
                                                        <span className="text-xl font-arabic text-emerald-700 pb-1">{hijriDate.split("/")[1]}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">Select a date</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Occasion Description</FormLabel>
                                            <FormControl><Input placeholder="e.g. Wedding, Fateha..." {...field} className="h-12 border-slate-200" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            )}

                            {/* Step 2: Venue & Caterer */}
                            {step === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <FormField control={form.control} name="hall" render={() => (
                                        <FormItem>
                                            <div className="mb-4">
                                                <FormLabel className="text-base font-semibold">Select Halls</FormLabel>
                                                <FormDescription>Choose one or more halls for the event.</FormDescription>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {availableHalls.length > 0 ? availableHalls.map((item) => (
                                                    <FormField key={item} control={form.control} name="hall" render={({ field }) => {
                                                        const isChecked = Array.isArray(field.value) ? field.value.includes(item) : field.value === item;
                                                        return (
                                                            <FormItem key={item} className={cn(
                                                                "flex flex-row items-center space-x-3 space-y-0 rounded-xl border p-4 transition-all cursor-pointer",
                                                                isChecked ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-indigo-200"
                                                            )}>
                                                                <FormControl>
                                                                    <Checkbox checked={isChecked} onCheckedChange={(checked) => {
                                                                        const current = Array.isArray(field.value) ? field.value : [];
                                                                        const updated = checked ? [...current, item] : current.filter((v) => v !== item);
                                                                        field.onChange(updated);
                                                                    }} />
                                                                </FormControl>
                                                                <FormLabel className={cn("font-medium cursor-pointer flex-1", isChecked ? "text-indigo-900" : "text-slate-700")}>
                                                                    {item}
                                                                </FormLabel>
                                                            </FormItem>
                                                        )
                                                    }} />
                                                )) : (
                                                    // Fallback if no master data
                                                    ["Maimoon Hall", "Qutbi Hall", "Fakhri Hall", "Najmi Hall"].map((item) => (
                                                        <FormField key={item} control={form.control} name="hall" render={({ field }) => {
                                                            const isChecked = Array.isArray(field.value) ? field.value.includes(item) : field.value === item;
                                                            return (
                                                                <FormItem key={item} className={cn(
                                                                    "flex flex-row items-center space-x-3 space-y-0 rounded-xl border p-4 transition-all cursor-pointer",
                                                                    isChecked ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-indigo-200"
                                                                )}>
                                                                    <FormControl>
                                                                        <Checkbox checked={isChecked} onCheckedChange={(checked) => {
                                                                            const current = Array.isArray(field.value) ? field.value : [];
                                                                            const updated = checked ? [...current, item] : current.filter((v) => v !== item);
                                                                            field.onChange(updated);
                                                                        }} />
                                                                    </FormControl>
                                                                    <FormLabel className="font-medium cursor-pointer flex-1">{item}</FormLabel>
                                                                </FormItem>
                                                            )
                                                        }} />
                                                    ))
                                                )}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                        <FormField control={form.control} name="catererName" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Caterer Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Select or type..."
                                                        {...field}
                                                        className="h-12 border-slate-200"
                                                        list="caterers-list"
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            const selected = availableCaterers.find((c: any) =>
                                                                (typeof c === 'string' ? c : c.name) === e.target.value
                                                            );
                                                            if (selected && typeof selected !== 'string' && selected.phone) {
                                                                form.setValue("catererPhone", selected.phone);
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <datalist id="caterers-list">
                                                    {availableCaterers.map((c: any, i) => (
                                                        <option key={i} value={typeof c === 'string' ? c : c.name} />
                                                    ))}
                                                </datalist>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="catererPhone" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Caterer Phone</FormLabel>
                                                <FormControl><Input placeholder="03xxxxxxxxx" {...field} className="h-12 border-slate-200" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Logistics & Menu */}
                            {step === 3 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    {/* Event Type Selection */}
                                    <FormField control={form.control} name="eventType" render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel>Event Type</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={(val: "PUBLIC" | "PRIVATE") => {
                                                        field.onChange(val);
                                                        // Reset counts when switching
                                                        if (val === "PRIVATE") {
                                                            form.setValue("hallCounts", {});
                                                            // Global count remains valid
                                                        } else {
                                                            form.setValue("thaalCount", 0); // Reset global, use hall counts
                                                        }
                                                    }}
                                                    value={field.value}
                                                    className="flex flex-col space-y-1"
                                                >
                                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="PRIVATE" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                            Private (Standard Thaal Count)
                                                        </FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="PUBLIC" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                            Public (Segregated Hall Counts)
                                                        </FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {/* Conditional Thaal Counts */}
                                    {form.watch("eventType") === "PUBLIC" ? (
                                        <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                                            <h3 className="font-semibold text-sm">Hall-wise Thaal Distribution</h3>
                                            {form.watch("hall").length > 0 ? (
                                                Array.isArray(form.watch("hall")) ? form.watch("hall").map((h: string) => (
                                                    <FormItem key={h}>
                                                        <FormLabel>{h}</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="Count"
                                                                className="bg-white"
                                                                onChange={(e) => {
                                                                    const count = Number(e.target.value) || 0;
                                                                    const currentMap = form.getValues("hallCounts") || {};
                                                                    const newMap = { ...currentMap, [h]: count };
                                                                    form.setValue("hallCounts", newMap);

                                                                    // Update total automatically
                                                                    const total = Object.values(newMap).reduce((a, b) => a + b, 0);
                                                                    form.setValue("thaalCount", total);
                                                                }}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )) : <p>Select halls first.</p>
                                            ) : (
                                                <div className="text-sm text-yellow-600 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" /> Please select halls in Step 2 first.
                                                </div>
                                            )}
                                            <div className="text-right text-sm font-bold pt-2">
                                                Total Thaals: {form.watch("thaalCount")}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <FormField control={form.control} name="thaalCount" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-center block mb-2">No. Of Thaal</FormLabel>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-12 w-12 rounded-xl border-slate-200 hover:bg-indigo-50 hover:border-indigo-200"
                                                            onClick={() => field.onChange(Math.max(0, Number(field.value) - 1))}
                                                        >
                                                            <span className="text-xl font-bold">−</span>
                                                        </Button>
                                                        <Input
                                                            type="number"
                                                            value={field.value}
                                                            onChange={(e) => field.onChange(Math.max(0, Number(e.target.value) || 0))}
                                                            className="w-20 h-12 text-center text-xl font-bold bg-indigo-50 border-indigo-200 text-indigo-700 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-12 w-12 rounded-xl border-slate-200 hover:bg-indigo-50 hover:border-indigo-200"
                                                            onClick={() => field.onChange(Number(field.value) + 1)}
                                                        >
                                                            <span className="text-xl font-bold">+</span>
                                                        </Button>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            {/* Remaining fields continue... */}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {/* Original Thaal Count slot occupied above, so we continue with others */}
                                        <FormField control={form.control} name="sarkariThaalSet" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-center block mb-2">Sarkari Sets</FormLabel>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-xl border-slate-200 hover:bg-amber-50 hover:border-amber-200"
                                                        onClick={() => field.onChange(Math.max(0, Number(field.value) - 1))}
                                                    >
                                                        <span className="text-xl font-bold">−</span>
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        value={field.value}
                                                        onChange={(e) => field.onChange(Math.max(0, Number(e.target.value) || 0))}
                                                        className="w-20 h-12 text-center text-xl font-bold bg-amber-50 border-amber-200 text-amber-700 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-xl border-slate-200 hover:bg-amber-50 hover:border-amber-200"
                                                        onClick={() => field.onChange(Number(field.value) + 1)}
                                                    >
                                                        <span className="text-xl font-bold">+</span>
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="extraChilamchiLota" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-center block mb-2">Ex. Chilamchi</FormLabel>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-xl border-slate-200 hover:bg-emerald-50 hover:border-emerald-200"
                                                        onClick={() => field.onChange(Math.max(0, Number(field.value) - 1))}
                                                    >
                                                        <span className="text-xl font-bold">−</span>
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        value={field.value}
                                                        onChange={(e) => field.onChange(Math.max(0, Number(e.target.value) || 0))}
                                                        className="w-20 h-12 text-center text-xl font-bold bg-emerald-50 border-emerald-200 text-emerald-700 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-xl border-slate-200 hover:bg-emerald-50 hover:border-emerald-200"
                                                        onClick={() => field.onChange(Number(field.value) + 1)}
                                                    >
                                                        <span className="text-xl font-bold">+</span>
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="tablesAndChairs" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-center block mb-2">Tables/Chairs</FormLabel>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-xl border-slate-200 hover:bg-violet-50 hover:border-violet-200"
                                                        onClick={() => field.onChange(Math.max(0, Number(field.value) - 1))}
                                                    >
                                                        <span className="text-xl font-bold">−</span>
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        value={field.value}
                                                        onChange={(e) => field.onChange(Math.max(0, Number(e.target.value) || 0))}
                                                        className="w-20 h-12 text-center text-xl font-bold bg-violet-50 border-violet-200 text-violet-700 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-xl border-slate-200 hover:bg-violet-50 hover:border-violet-200"
                                                        onClick={() => field.onChange(Number(field.value) + 1)}
                                                    >
                                                        <span className="text-xl font-bold">+</span>
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="menu" render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Menu Detail</FormLabel>
                                                <FormControl><Textarea placeholder="Enter menu items..." className="resize-none min-h-[120px] border-slate-200 rounded-xl" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Add-ons & Facilities */}
                            {step === 4 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {[
                                            { name: "bhaiSaabIzzan", label: "Bhai Saab Izzan" },
                                            { name: "benSaabIzzan", label: "Ben Saab Izzan" },
                                            { name: "mic", label: "Microphone" },
                                            { name: "crockeryRequired", label: "Crockery" },
                                            { name: "thaalForDevri", label: "Thaal For Devri" },
                                            { name: "paat", label: "PAAT" },
                                            { name: "masjidLight", label: "Masjid Light" },
                                        ].map((item) => (
                                            <FormField key={item.name} control={form.control} name={item.name as Path<FormValues>} render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition cursor-pointer">
                                                    <FormControl>
                                                        <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-medium cursor-pointer flex-1 text-slate-700">{item.label}</FormLabel>
                                                </FormItem>
                                            )} />
                                        ))}
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 grid md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="acStartTime" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>AC Start Time</FormLabel>
                                                <FormControl><Input type="time" {...field} className="h-12 border-slate-200 bg-white" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="partyTime" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Party Time</FormLabel>
                                                <FormControl><Input type="time" {...field} className="h-12 border-slate-200 bg-white" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="gasCount" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-center block mb-2">Gas Count</FormLabel>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-xl border-slate-200 hover:bg-slate-50"
                                                        onClick={() => field.onChange(Math.max(0, Number(field.value) - 1))}
                                                    >
                                                        <span className="text-xl font-bold">−</span>
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        value={field.value}
                                                        onChange={(e) => field.onChange(Math.max(0, Number(e.target.value) || 0))}
                                                        className="w-20 h-12 text-center text-xl font-bold bg-white border-slate-200 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-xl border-slate-200 hover:bg-slate-50"
                                                        onClick={() => field.onChange(Number(field.value) + 1)}
                                                    >
                                                        <span className="text-xl font-bold">+</span>
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="decorations" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition cursor-pointer">
                                                <FormControl>
                                                    <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} />
                                                </FormControl>
                                                <FormLabel className="font-medium cursor-pointer flex-1 text-slate-700">Decorations Required</FormLabel>
                                            </FormItem>
                                        )} />
                                    </div>


                                </div>
                            )}

                            {/* Step 5: Review */}
                            {step === 5 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">

                                    {/* Booker & Event Info */}
                                    <div className="bg-slate-50 rounded-lg p-6 space-y-4 border border-slate-100">
                                        <h3 className="font-semibold text-lg border-b pb-2 mb-4">Event & Contact Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                            <div>
                                                <p className="text-slate-500 text-xs uppercase tracking-wide">Booker Name</p>
                                                <p className="font-medium text-base">{formValues.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs uppercase tracking-wide">Mobile</p>
                                                <p className="font-medium text-base">{formValues.mobile}</p>
                                            </div>
                                            {formValues.email && (
                                                <div className="col-span-2">
                                                    <p className="text-slate-500 text-xs uppercase tracking-wide">Email</p>
                                                    <p className="font-medium text-base">{formValues.email}</p>
                                                </div>
                                            )}
                                            <div className="col-span-2">
                                                <p className="text-slate-500 text-xs uppercase tracking-wide">Occasion / Description</p>
                                                <p className="font-medium text-base">{formValues.description}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs uppercase tracking-wide">Date</p>
                                                <p className="font-medium text-base">{formValues.occasionDate ? format(formValues.occasionDate, "PPP") : "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs uppercase tracking-wide">Time</p>
                                                <p className="font-medium text-base">{formValues.occasionTime}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Venue & Caterer */}
                                    <div className="bg-slate-50 rounded-lg p-6 space-y-4 border border-slate-100">
                                        <h3 className="font-semibold text-lg border-b pb-2 mb-4">Venue & Catering</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                            <div className="col-span-2">
                                                <p className="text-slate-500 text-xs uppercase tracking-wide">Halls Selected</p>
                                                <p className="font-medium text-base">
                                                    {Array.isArray(formValues.hall) ? formValues.hall.join(", ") : formValues.hall}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs uppercase tracking-wide">Caterer Name</p>
                                                <p className="font-medium text-base">{formValues.catererName || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs uppercase tracking-wide">Caterer Phone</p>
                                                <p className="font-medium text-base">{formValues.catererPhone || "-"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Essentials & Requirements */}
                                    <div className="bg-slate-50 rounded-lg p-6 space-y-4 border border-slate-100">
                                        <h3 className="font-semibold text-lg border-b pb-2 mb-4">Requirements & Facilities</h3>

                                        {/* Counts */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
                                            <div className="bg-white p-3 rounded-lg border shadow-sm">
                                                <p className="text-slate-500 text-xs uppercase">Thaals</p>
                                                <p className="font-bold text-xl text-amber-600">{formValues.thaalCount}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border shadow-sm">
                                                <p className="text-slate-500 text-xs uppercase">Sarkari Sets</p>
                                                <p className="font-bold text-xl text-amber-600">{formValues.sarkariThaalSet}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border shadow-sm">
                                                <p className="text-slate-500 text-xs uppercase">Ex. Chilamchi</p>
                                                <p className="font-bold text-xl text-amber-600">{formValues.extraChilamchiLota}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border shadow-sm">
                                                <p className="text-slate-500 text-xs uppercase">Tables</p>
                                                <p className="font-bold text-xl text-amber-600">{formValues.tablesAndChairs}</p>
                                            </div>
                                        </div>

                                        {/* Checkbox Extras */}
                                        <div className="mb-6">
                                            <p className="text-slate-500 text-xs uppercase tracking-wide mb-3">Facility Requirements</p>
                                            <div className="flex flex-wrap gap-2">
                                                {formValues.bhaiSaabIzzan && <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">Bhai Saab Izzan</span>}
                                                {formValues.benSaabIzzan && <span className="text-xs font-medium bg-pink-50 text-pink-700 px-2 py-1 rounded border border-pink-100">Ben Saab Izzan</span>}
                                                {formValues.mic && <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">Microphone</span>}
                                                {formValues.crockeryRequired && <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100">Crockery</span>}
                                                {formValues.thaalForDevri && <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">Thaal for Devri</span>}
                                                {formValues.paat && <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">PAAT</span>}
                                                {formValues.masjidLight && <span className="text-xs font-medium bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100">Masjid Light</span>}

                                                {!formValues.bhaiSaabIzzan && !formValues.benSaabIzzan && !formValues.mic && !formValues.crockeryRequired && !formValues.thaalForDevri && !formValues.paat && !formValues.masjidLight && (
                                                    <span className="text-sm text-slate-400 italic">No special facilities selected</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Add-ons Section */}
                                        <div>
                                            <p className="text-slate-500 text-xs uppercase tracking-wide mb-3">Add-ons</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white p-4 rounded-lg border">
                                                <div>
                                                    <p className="text-slate-500 text-xs">AC Start Time</p>
                                                    <p className="font-medium">{formValues.acStartTime || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 text-xs">Party Time</p>
                                                    <p className="font-medium">{formValues.partyTime || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 text-xs">Gas Count</p>
                                                    <p className="font-medium">{formValues.gasCount}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 text-xs">Decorations</p>
                                                    <p className={cn("font-medium", formValues.decorations ? "text-green-600" : "text-slate-400")}>
                                                        {formValues.decorations ? "Yes" : "No"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Menu */}
                                        {formValues.menu && (
                                            <div className="mt-6 pt-4 border-t border-slate-100">
                                                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Menu</p>
                                                <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 whitespace-pre-wrap font-mono">
                                                    {formValues.menu}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Nav Buttons */}
                            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={prevStep}
                                    disabled={step === 1}
                                    className="h-11 px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                </Button>

                                {step < 5 ? (
                                    <Button
                                        type="button"
                                        onClick={nextStep}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 rounded-lg shadow-sm"
                                    >
                                        Next Step <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        id="btn-event-create-submit" // RBAC ID
                                        type="button"
                                        onClick={() => setIsConfirmOpen(true)}
                                        className="h-11 px-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                    >
                                        <Check className="mr-2 h-4 w-4" /> Confirm & Create
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Confirmation Drawer */}
            <Drawer open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DrawerContent className="px-4 pb-8">
                    <DrawerHeader className="text-center pt-6">
                        <DrawerTitle className="text-xl font-bold">Confirm Booking</DrawerTitle>
                        <DrawerDescription className="text-slate-500 mt-2">
                            Are you sure you want to create this event for <strong className="text-slate-900">{formValues.name}</strong> on <strong className="text-slate-900">{formValues.occasionDate ? format(formValues.occasionDate, "MMM do") : ""}</strong>?
                        </DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter className="flex flex-col gap-3 mt-4">
                        <Button
                            onClick={form.handleSubmit(onSubmit)}
                            className="w-full h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                            <Check className="mr-2 h-4 w-4" /> Yes, Create Event
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full h-12 rounded-xl border-slate-300">
                                Cancel
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* Status Dialog */}
            <Dialog open={statusOpen} onOpenChange={(open) => {
                if (status === "error") setStatusOpen(open);
            }}>
                <DialogContent className="sm:max-w-md rounded-2xl" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="text-center font-bold text-xl">
                            {status === "creating" && "Creating Event..."}
                            {status === "success" && "Booking Confirmed!"}
                            {status === "error" && "Error Creating Event"}
                        </DialogTitle>
                        <DialogDescription className="text-center pt-6 pb-2">
                            {status === "creating" && (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-slate-600">{statusMessage}</p>
                                </div>
                            )}
                            {status === "success" && (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                        <Check className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-medium text-slate-900">{statusMessage}</p>
                                        <p className="text-sm text-slate-500 mt-2">Redirecting to print page in {countdown}s...</p>
                                    </div>
                                </div>
                            )}
                            {status === "error" && (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                        <AlertCircle className="w-8 h-8" />
                                    </div>
                                    <p className="text-red-600 font-medium px-4">{statusMessage}</p>
                                    <Button onClick={() => setStatusOpen(false)} variant="outline" className="rounded-xl">Close & Fix</Button>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div >
    );
}
