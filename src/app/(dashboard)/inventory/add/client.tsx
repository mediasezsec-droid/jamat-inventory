"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, PackagePlus, Tag, Layers, Scale, Calculator } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const itemSchema = z.object({
    name: z.string().min(2, "Name is required"),
    category: z.string().min(2, "Category is required"),
    totalQuantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    unit: z.string().min(1, "Unit is required"),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export default function AddInventoryPageClient() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ItemFormValues>({
        resolver: zodResolver(itemSchema) as any,
        defaultValues: {
            name: "",
            category: "General",
            totalQuantity: 0,
            unit: "pieces",
        },
    });

    const onSubmit = async (values: z.infer<typeof itemSchema>) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/inventory/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to add item");
            }

            toast.success(`${values.name} added to inventory`);
            router.push("/inventory");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 md:p-8 max-w-2xl space-y-8">
            <PageHeader
                title="Add Inventory"
                description="Register new items to the global inventory system."
                backUrl="/inventory"
            />

            <Card className="border-0 shadow-md ring-1 ring-slate-900/5">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <PackagePlus className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-800">New Item Details</CardTitle>
                            <CardDescription>Enter the specifications below.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control as any}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700 font-semibold">Item Name</FormLabel>
                                        <FormControl>
                                            <div className="relative group">
                                                <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                <Input className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all" placeholder="e.g. Large Thaal" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control as any}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 font-semibold">Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Layers className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 z-10" />
                                                        <SelectTrigger className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white">
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                    </div>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="General">General</SelectItem>
                                                    <SelectItem value="Utensils">Utensils</SelectItem>
                                                    <SelectItem value="Furniture">Furniture</SelectItem>
                                                    <SelectItem value="Electronics">Electronics</SelectItem>
                                                    <SelectItem value="Decor">Decor</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="unit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 font-semibold">Unit</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Scale className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 z-10" />
                                                        <SelectTrigger className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white">
                                                            <SelectValue placeholder="Select unit" />
                                                        </SelectTrigger>
                                                    </div>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="pieces">Pieces</SelectItem>
                                                    <SelectItem value="sets">Sets</SelectItem>
                                                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                                    <SelectItem value="liters">Liters (l)</SelectItem>
                                                    <SelectItem value="meters">Meters (m)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control as any}
                                name="totalQuantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700 font-semibold">Total Stock</FormLabel>
                                        <div className="flex gap-4 items-center">
                                            <FormControl>
                                                <div className="relative group flex-1">
                                                    <Calculator className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        className="pl-10 h-11 font-mono text-lg bg-white border-slate-200 focus:ring-indigo-500"
                                                        placeholder="0"
                                                        value={field.value || ""}
                                                        onChange={(e) => {
                                                            if (/^[0-9]*$/.test(e.target.value)) {
                                                                field.onChange(Number(e.target.value) || 0);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </FormControl>
                                            <div className="text-slate-500 text-sm font-medium w-16">
                                                {form.watch("unit")}
                                            </div>
                                        </div>
                                        <FormDescription className="text-xs">Initial available quantity.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-6 flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => router.back()}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    id="btn-inventory-create-save"
                                    type="submit"
                                    className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 min-w-[140px]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save New Item"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
