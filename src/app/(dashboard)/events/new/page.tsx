
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Path } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, ChevronRight, ChevronLeft, Check, User, MapPin, Utensils, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    thaalCount: z.coerce.number().min(0),
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
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
    { id: 1, title: "Basic Details", icon: User },
    { id: 2, title: "Venue & Caterer", icon: MapPin },
    { id: 3, title: "Essentials & Menu", icon: Utensils },
];

export default function NewEventPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    // Confirmation & Status State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [status, setStatus] = useState<"idle" | "creating" | "success" | "error">("idle");
    const [statusMessage, setStatusMessage] = useState("");
    const [countdown, setCountdown] = useState(3);

    // Master Data
    const [availableHalls, setAvailableHalls] = useState<string[]>(["1st Floor (Gents Sehan)", "2nd Floor", "Main Hall"]);
    const [availableCaterers, setAvailableCaterers] = useState<any[]>([]);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const res = await fetch("/api/settings/master-data");
                if (res.ok) {
                    const data = await res.json();
                    if (data.halls && data.halls.length > 0) setAvailableHalls(data.halls);
                    if (data.caterers) setAvailableCaterers(data.caterers);
                }
            } catch (error) {
                console.error("Failed to fetch master data", error);
            }
        };
        fetchMasterData();
    }, []);

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
            menu: "",
        },
    });

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
        }

        const isValid = await form.trigger(fieldsToValidate);
        if (isValid) {
            setStep((prev) => prev + 1);
        }
    };

    const prevStep = () => setStep((prev) => prev - 1);

    // Prevent Enter key submission
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
            e.preventDefault();
        }
    };

    async function onSubmit(values: FormValues) {
        // Close confirmation, open status dialog
        setIsConfirmOpen(false);
        setStatusOpen(true);
        setStatus("creating");
        setStatusMessage("Checking for conflicts and creating event...");

        try {
            // 1. Check for conflicts
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
                setStatusMessage(conflictData.conflictMessage);
                return;
            }

            if (conflictData.conflictType === "soft") {
                // For soft conflicts, we might need a way to ask inside the flow.
                // But since we are already in a "Creating" flow, let's just show the error and ask user to retry if they really want to force it?
                // Or better, we should have checked this BEFORE the confirmation dialog.
                // For now, let's treat it as an error the user needs to acknowledge.
                // Ideally, we'd move conflict check to before the "Confirm" dialog.
                // But to keep it simple as per request:
                const confirmed = window.confirm(`WARNING: ${conflictData.conflictMessage}\n\nDo you want to proceed despite this conflict?`);
                if (!confirmed) {
                    setStatusOpen(false);
                    return;
                }
                // If confirmed, continue
            }

            // 2. Create Event
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create event");
            }

            // Success
            setStatus("success");
            setStatusMessage("Event created successfully!");

            // Start countdown
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
            setStatus("error");
            setStatusMessage(error.message || "Failed to create event");
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Event Booking</h1>
                    <p className="text-slate-500 mt-2">Fill in the details below to create a new event.</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex justify-between items-center relative">
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-amber-500 -z-10 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>

                        {steps.map((s) => (
                            <div key={s.id} className="flex flex-col items-center bg-slate-50 px-2">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                    step >= s.id ? "bg-amber-500 border-amber-500 text-white shadow-lg scale-110" : "bg-white border-slate-300 text-slate-400"
                                )}>
                                    {step > s.id ? <Check className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                                </div>
                                <span className={cn(
                                    "text-xs font-medium mt-2 transition-colors duration-300",
                                    step >= s.id ? "text-slate-900" : "text-slate-400"
                                )}>{s.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Card */}
                <Card className="border-none shadow-xl bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                        <Form {...form}>
                            <form onKeyDown={handleKeyDown} onSubmit={(e) => e.preventDefault()} className="space-y-6">

                                {/* Step 1: Basic Details */}
                                {step === 1 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField control={form.control} name="mobile" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Mobile Number</FormLabel>
                                                    <FormControl><Input placeholder="99480..." {...field} onBlur={(e) => { field.onBlur(); handleMobileBlur(e); }} className="h-12" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="name" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Booker Name</FormLabel>
                                                    <FormControl><Input placeholder="Murtazabhai..." {...field} className="h-12" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <FormField control={form.control} name="email" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email (Optional)</FormLabel>
                                                <FormControl><Input placeholder="For event confirmation..." {...field} className="h-12" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField control={form.control} name="occasionDate" render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Occasion Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button variant={"outline"} className={cn("h-12 w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="occasionTime" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Time</FormLabel>
                                                    <FormControl><Input type="time" {...field} className="h-12" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <FormField control={form.control} name="description" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Event Description / Occasion</FormLabel>
                                                <FormControl><Input placeholder="Fateha, Wedding, etc." {...field} className="h-12" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                )}

                                {/* Step 2: Venue & Caterer */}
                                {step === 2 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <FormField control={form.control} name="hall" render={() => (
                                            <FormItem>
                                                <div className="mb-4">
                                                    <FormLabel className="text-base">Select Halls</FormLabel>
                                                    <FormDescription>Choose one or more halls for the event.</FormDescription>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {availableHalls.length > 0 ? availableHalls.map((item) => (
                                                        <FormField key={item} control={form.control} name="hall" render={({ field }) => {
                                                            const isChecked = Array.isArray(field.value) ? field.value.includes(item) : field.value === item;
                                                            return (
                                                                <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 hover:bg-slate-50 transition">
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
                                                    )) : (
                                                        <p className="text-sm text-slate-500 col-span-3">No halls configured. Please add them in Settings.</p>
                                                    )}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField control={form.control} name="catererName" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Caterer Name</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="Super Caterers"
                                                                {...field}
                                                                list="caterers-list"
                                                                className="h-12"
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
                                                            <datalist id="caterers-list">
                                                                {availableCaterers.map((c: any, i) => (
                                                                    <option key={i} value={typeof c === 'string' ? c : c.name} />
                                                                ))}
                                                            </datalist>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="catererPhone" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Caterer Phone</FormLabel>
                                                    <FormControl><Input placeholder="970..." {...field} className="h-12" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Essentials & Menu */}
                                {step === 3 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <FormField control={form.control} name="thaalCount" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>No. Of Thaal</FormLabel>
                                                    <FormControl><Input type="number" {...field} className="h-12" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="sarkariThaalSet" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sarkari Sets</FormLabel>
                                                    <FormControl><Input type="number" {...field} className="h-12" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="extraChilamchiLota" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Extra Chilamchi</FormLabel>
                                                    <FormControl><Input type="number" {...field} className="h-12" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="tablesAndChairs" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tables & Chairs</FormLabel>
                                                    <FormControl><Input type="number" {...field} className="h-12" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {/* Checkboxes */}
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
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border p-4 hover:bg-slate-50 transition">
                                                        <FormControl>
                                                            <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                        <FormLabel className="font-medium cursor-pointer flex-1">{item.label}</FormLabel>
                                                    </FormItem>
                                                )} />
                                            ))}
                                        </div>

                                        <FormField control={form.control} name="menu" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Menu</FormLabel>
                                                <FormControl><Textarea placeholder="Namak, Malido..." className="resize-none min-h-[100px]" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between pt-6 border-t border-slate-100 mt-8">
                                    <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1} className="h-12 px-6">
                                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>

                                    {step < 3 ? (
                                        <Button type="button" onClick={nextStep} className="h-12 px-6 bg-amber-600 hover:bg-amber-700">
                                            Next Step <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button type="button" onClick={() => setIsConfirmOpen(true)} className="h-12 px-8 bg-green-600 hover:bg-green-700 text-lg shadow-lg hover:shadow-xl transition-all">
                                            Confirm Booking
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Booking Details</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to create this event? Please verify all details, especially the date and hall selection.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={form.handleSubmit(onSubmit)} className="bg-green-600 hover:bg-green-700">
                            Yes, Create Event
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Status Dialog (Creating / Success / Error) */}
            <Dialog open={statusOpen} onOpenChange={(open) => {
                // Only allow closing if error or success (though success redirects anyway)
                if (status === "error") setStatusOpen(open);
            }}>
                <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            {status === "creating" && "Creating Event..."}
                            {status === "success" && "Booking Confirmed!"}
                            {status === "error" && "Error Creating Event"}
                        </DialogTitle>
                        <DialogDescription className="text-center pt-4">
                            {status === "creating" && (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
                                    <p>{statusMessage}</p>
                                </div>
                            )}
                            {status === "success" && (
                                <div className="flex flex-col items-center gap-4">
                                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                                    <p className="text-lg font-medium text-green-700">{statusMessage}</p>
                                    <p className="text-sm text-slate-500">Redirecting to print page in {countdown} seconds...</p>
                                </div>
                            )}
                            {status === "error" && (
                                <div className="flex flex-col items-center gap-4">
                                    <AlertCircle className="h-12 w-12 text-red-500" />
                                    <p className="text-red-600">{statusMessage}</p>
                                    <Button onClick={() => setStatusOpen(false)} variant="outline">Close & Fix</Button>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    );
}
