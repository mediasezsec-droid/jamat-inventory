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
    Sparkles,
    Calculator
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, getISTDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LagatDrawer } from "@/components/events/lagat-drawer";
import { Label } from "@/components/ui/label";
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

    // Lagat/Cost Drawer State (New)
    const [isLagatDrawerOpen, setIsLagatDrawerOpen] = useState(false);
    const [lagatAmounts, setLagatAmounts] = useState<Record<string, string>>({
        thaal: "",
        sarkari: "",
        kitchen: "",
        decoration: "",
        other: "",
    });

    const handleLagatChange = (key: string, value: string) => {
        setLagatAmounts(prev => ({ ...prev, [key]: value }));
    };

    // Calculate Grand Total for Preview
    const grandTotal = Object.values(lagatAmounts).reduce((acc, curr) => acc + (Number(curr) || 0), 0);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);
    };

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const res = await fetch("/api/settings/master-data");
                if (res.ok) {
                    const data = await res.json();
                    if (data.halls) setAvailableHalls(data.halls);
                    if (data.caterers) setAvailableCaterers(data.caterers); // Assuming simplified array
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
                        hall: event.hall ? (Array.isArray(event.hall) ? event.hall : [event.hall]) : [],
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

            if (!conflictRes.ok) {
                // Should probably inspect payload even if not ok?
                // Assuming normal conflict endpoint returns 200 with conflict data
            }
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
                    const query = new URLSearchParams();
                    query.set("cost_thaal", lagatAmounts.thaal);
                    query.set("cost_sarkari", lagatAmounts.sarkari);
                    query.set("cost_kitchen", lagatAmounts.kitchen);
                    query.set("cost_decoration", lagatAmounts.decoration);
                    query.set("cost_other", lagatAmounts.other);
                    query.set("cost_deposit", lagatAmounts.deposit);

                    // Add Hall Costs
                    Object.keys(lagatAmounts).forEach(key => {
                        if (key.startsWith("cost_hall_")) {
                            query.set(key, lagatAmounts[key]);
                        }
                    });

                    router.push(`/events/${data.id}/print?${query.toString()}`);
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
                        <p className="text-muted-foreground text-sm">Step {step} of {steps.length} • {format(getISTDate(new Date()), "EEEE, MMMM d")}</p>
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
                                        <FormField control={form.control} name="email" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email (Optional)</FormLabel>
                                                <FormControl><Input placeholder="user@ example.com" {...field} className="h-12 border-slate-200" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="occasionDate" render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Occasion Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full h-12 pl-3 text-left font-normal border-slate-200",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) =>
                                                                date < new Date(new Date().setHours(0, 0, 0, 0))
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                {hijriDate && (
                                                    <FormDescription className="text-xs text-indigo-600 font-medium">
                                                        Hijri: {hijriDate}
                                                    </FormDescription>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="occasionTime" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Time</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} className="h-12 border-slate-200" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Occasion Description</FormLabel>
                                            <FormControl><Textarea placeholder="e.g. Wedding Reception for..." {...field} className="min-h-[100px] border-slate-200" /></FormControl>
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
                                                )) : <p>Select halls in Step 2 first.</p>
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

                            {/* Step 4: Facilities/Add-ons */}
                            {step === 4 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="grid grid-cols-2 gap-6">
                                        <FormField control={form.control} name="acStartTime" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>AC Start Time</FormLabel>
                                                <FormControl><Input type="time" {...field} className="h-12 border-slate-200" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="partyTime" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Party Time</FormLabel>
                                                <FormControl><Input type="time" {...field} className="h-12 border-slate-200" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { name: "bhaiSaabIzzan", label: "Bhai Saab Izzan" },
                                            { name: "benSaabIzzan", label: "Ben Saab Izzan" },
                                            { name: "mic", label: "Microphone" },
                                            { name: "crockeryRequired", label: "Crockery" },
                                            { name: "thaalForDevri", label: "Thaal for Devri" },
                                            { name: "paat", label: "PAAT" },
                                            { name: "masjidLight", label: "Masjid Light" },
                                            { name: "decorations", label: "Decorations" },
                                        ].map((item: any) => (
                                            <FormField
                                                key={item.name}
                                                control={form.control}
                                                name={item.name}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel>{item.label}</FormLabel>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <FormField control={form.control} name="gasCount" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gas Count</FormLabel>
                                            <FormControl><Input type="number" {...field} className="h-12 border-slate-200" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            )}

                            {/* Step 5: Confirmation */}
                            {step === 5 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="rounded-lg border bg-slate-50 p-6 space-y-4">
                                        <div className="flex justify-between items-start border-b pb-4">
                                            <div>
                                                <h3 className="font-semibold text-lg">{form.getValues("name")}</h3>
                                                <p className="text-slate-500">{form.getValues("mobile")}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{format(form.getValues("occasionDate"), "PPP")}</p>
                                                <p className="text-slate-500">{form.getValues("occasionTime")}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-slate-500 block">Hall</span>
                                                <span className="font-medium">{form.getValues("hall").join(", ")}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Event Description</span>
                                                <span className="font-medium">{form.getValues("description")}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Thaal Count</span>
                                                <span className="font-medium">{form.getValues("thaalCount")}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Caterer</span>
                                                <span className="font-medium">{form.getValues("catererName") || "NA"}</span>
                                            </div>
                                        </div>

                                        {/* Added Lagat Preview Section */}
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Financials</span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsLagatDrawerOpen(true)}
                                                    className="h-8 text-xs gap-1"
                                                >
                                                    <Calculator className="w-3 h-3" />
                                                    {grandTotal > 0 ? "Edit Costs" : "Add Costs"}
                                                </Button>
                                            </div>
                                            {grandTotal > 0 ? (
                                                <div className="bg-white p-3 rounded border border-slate-200">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium">Estimated Total</span>
                                                        <span className="text-lg font-bold text-emerald-600">{formatCurrency(grandTotal)}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center p-3 text-sm text-slate-400 italic bg-white border border-dashed rounded">
                                                    No costs added yet.
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                            <p className="text-xs text-slate-500">
                                                Please review all details carefully. Once created, a PDF booking form will be generated automatically.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={prevStep}
                                    disabled={step === 1}
                                    className="pl-0"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                                </Button>

                                {step < 5 ? (
                                    <Button type="button" onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-700">
                                        Next Step <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button type="button" onClick={form.handleSubmit(onSubmit)} className="bg-green-600 hover:bg-green-700 min-w-[150px]">
                                        Confirm & Create <Check className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Status Dialog (Success/Error) */}
            <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className={cn(
                            "text-xl flex items-center gap-2",
                            status === "success" ? "text-green-600" : status === "error" ? "text-red-600" : "text-sky-600"
                        )}>
                            {status === "creating" && <Loader2 className="w-6 h-6 animate-spin" />}
                            {status === "success" && <CheckCircle2 className="w-6 h-6" />}
                            {status === "error" && <AlertCircle className="w-6 h-6" />}
                            {status === "creating" ? "Creating Event..." : status === "success" ? "Booking Confirmed!" : "Something went wrong"}
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            {statusMessage}
                            {status === "success" && (
                                <div className="mt-4 p-3 bg-slate-50 rounded text-center font-medium text-slate-700">
                                    Redirecting to print page in {countdown}s...
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

            {/* Lagat Drawer */}
            <LagatDrawer
                open={isLagatDrawerOpen}
                onOpenChange={setIsLagatDrawerOpen}
                amounts={lagatAmounts}
                onChange={handleLagatChange}
                counts={{
                    thaalCount: form.getValues("thaalCount") || 0,
                    sarkariCount: form.getValues("sarkariThaalSet") || 0,
                }}
                halls={(form.getValues("hall") as string[]) || []}
                grandTotal={grandTotal}
            />
        </div>
    );
}
