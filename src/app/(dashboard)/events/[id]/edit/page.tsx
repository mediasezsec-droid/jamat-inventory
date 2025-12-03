"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Event } from "@/types";

// Schema (Same as New Event)
const formSchema = z.object({
    mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
    name: z.string().min(2, "Name is required"),
    occasionDate: z.date(),
    occasionTime: z.string().min(1, "Time is required"),
    description: z.string().min(1, "Description is required"),
    hall: z.array(z.string()).refine((value) => value.some((item) => item), {
        message: "You have to select at least one hall.",
    }),
    catererName: z.string().default(""),
    catererPhone: z.string().default(""),
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

export default function EditEventPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            mobile: "",
            name: "",
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

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/events/${eventId}`);
                if (!res.ok) throw new Error("Event not found");
                const event: Event = await res.json();

                form.reset({
                    mobile: event.mobile,
                    name: event.name,
                    occasionDate: new Date(event.occasionDate),
                    occasionTime: event.occasionTime,
                    description: event.description,
                    hall: Array.isArray(event.hall) ? event.hall : [event.hall],
                    catererName: event.catererName,
                    catererPhone: event.catererPhone,
                    thaalCount: event.thaalCount,
                    sarkariThaalSet: event.sarkariThaalSet,
                    extraChilamchiLota: event.extraChilamchiLota,
                    tablesAndChairs: event.tablesAndChairs,
                    bhaiSaabIzzan: event.bhaiSaabIzzan,
                    benSaabIzzan: event.benSaabIzzan,
                    mic: event.mic,
                    crockeryRequired: event.crockeryRequired,
                    thaalForDevri: event.thaalForDevri,
                    paat: event.paat,
                    masjidLight: event.masjidLight,
                    menu: event.menu,
                });
            } catch (error) {
                toast.error("Failed to load event");
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvent();
    }, [eventId, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/events/${eventId}`, {
                method: "PATCH", // Using PATCH for update
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!res.ok) throw new Error("Failed to update event");

            toast.success("Event updated successfully");
            router.push(`/events/${eventId}`);
        } catch (error) {
            toast.error("Failed to update event");
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Edit Event</h1>
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Reusing the same card structure as New Event - simplified for brevity */}
                    <Card className="border-t-4 border-t-amber-500 shadow-lg">
                        <CardHeader className="bg-slate-50"><CardTitle>Event Details</CardTitle></CardHeader>
                        <CardContent className="p-6 grid gap-6 md:grid-cols-2">
                            <FormField control={form.control} name="mobile" render={({ field }) => (
                                <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="occasionDate" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date("2000-01-01")} initialFocus /></PopoverContent>
                                    </Popover>
                                    <FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="occasionTime" render={({ field }) => (
                                <FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem className="md:col-span-2"><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </CardContent>
                    </Card>

                    {/* Essentials - simplified */}
                    <Card className="border-t-4 border-t-green-500 shadow-lg">
                        <CardHeader className="bg-slate-50"><CardTitle>Requirements</CardTitle></CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <FormField control={form.control} name="thaalCount" render={({ field }) => (<FormItem><FormLabel>Thaal Count</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="sarkariThaalSet" render={({ field }) => (<FormItem><FormLabel>Sarkari Sets</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="tablesAndChairs" render={({ field }) => (<FormItem><FormLabel>Tables/Chairs</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                                <FormField control={form.control} name="mic" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Mic</FormLabel></FormItem>)} />
                                <FormField control={form.control} name="crockeryRequired" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Crockery</FormLabel></FormItem>)} />
                            </div>
                            <div className="mt-6">
                                <FormField control={form.control} name="menu" render={({ field }) => (<FormItem><FormLabel>Menu</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-lg py-6" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Event"}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
