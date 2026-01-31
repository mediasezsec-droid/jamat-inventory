"use client";

import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";

interface LagatDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    amounts: Record<string, string>;
    onChange: (key: string, value: string) => void;
    counts: {
        thaalCount: number;
        sarkariCount: number;
    };
    halls: string[];
    grandTotal: number;
}

export function LagatDrawer({
    open,
    onOpenChange,
    amounts,
    onChange,
    counts,
    halls,
    grandTotal,
}: LagatDrawerProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-md max-h-[85vh] overflow-y-auto">
                    <DrawerHeader>
                        <DrawerTitle className="flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                            Lagat Details
                        </DrawerTitle>
                        <DrawerDescription>
                            Enter rates per unit. Totals are calculated automatically based on counts.
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-6">
                        {/* Section 1: Variable Costs (Rate based) */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Variable Items</h4>

                            {/* Thaal (Rate * Qty) */}
                            <div className="space-y-2">
                                <Label>Thaal Cost</Label>
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Rate (Per Thaal)</span>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="Rate"
                                            className="h-9"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (!/^[0-9]*$/.test(value)) return;
                                                const rate = Number(value);
                                                const count = counts.thaalCount || 0;
                                                onChange("thaal", String(rate * count));
                                            }}
                                            defaultValue={
                                                Number(amounts.thaal) > 0 && (counts.thaalCount || 0) > 0
                                                    ? Number(amounts.thaal) / (counts.thaalCount || 1)
                                                    : ""
                                            }
                                        />
                                    </div>
                                    <div className="text-slate-400 font-medium pt-4">×</div>
                                    <div className="flex-none w-16 text-center">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Qty</span>
                                        <div className="h-9 flex items-center justify-center font-medium bg-slate-50 rounded border text-sm text-slate-600">
                                            {counts.thaalCount || 0}
                                        </div>
                                    </div>
                                    <div className="text-slate-400 font-medium pt-4">=</div>
                                    <div className="flex-1">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Total</span>
                                        <div className="h-9 flex items-center justify-end px-3 font-bold bg-slate-100 rounded border text-sm text-emerald-600">
                                            {formatCurrency(Number(amounts.thaal) || 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sarkari (Rate * Qty) */}
                            <div className="space-y-2">
                                <Label>Sarkari Thaal Cost</Label>
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Rate (Per Set)</span>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="Rate"
                                            className="h-9"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (!/^[0-9]*$/.test(value)) return;
                                                const rate = Number(value);
                                                const count = counts.sarkariCount || 0;
                                                onChange("sarkari", String(rate * count));
                                            }}
                                            defaultValue={
                                                Number(amounts.sarkari) > 0 && (counts.sarkariCount || 0) > 0
                                                    ? Number(amounts.sarkari) / (counts.sarkariCount || 1)
                                                    : ""
                                            }
                                        />
                                    </div>
                                    <div className="text-slate-400 font-medium pt-4">×</div>
                                    <div className="flex-none w-16 text-center">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Qty</span>
                                        <div className="h-9 flex items-center justify-center font-medium bg-slate-50 rounded border text-sm text-slate-600">
                                            {counts.sarkariCount || 0}
                                        </div>
                                    </div>
                                    <div className="text-slate-400 font-medium pt-4">=</div>
                                    <div className="flex-1">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Total</span>
                                        <div className="h-9 flex items-center justify-end px-3 font-bold bg-slate-100 rounded border text-sm text-emerald-600">
                                            {formatCurrency(Number(amounts.sarkari) || 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Fixed Costs */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Fixed Items</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Kitchen Charge</Label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={amounts.kitchen || ""}
                                        onChange={(e) => {
                                            if (/^[0-9]*$/.test(e.target.value)) onChange("kitchen", e.target.value);
                                        }}
                                        placeholder="₹ 0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Decoration</Label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={amounts.decoration || ""}
                                        onChange={(e) => {
                                            if (/^[0-9]*$/.test(e.target.value)) onChange("decoration", e.target.value);
                                        }}
                                        placeholder="₹ 0"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Other Misc Costs</Label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={amounts.other || ""}
                                        onChange={(e) => {
                                            if (/^[0-9]*$/.test(e.target.value)) onChange("other", e.target.value);
                                        }}
                                        placeholder="₹ 0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Hall Costs */}
                        {halls && halls.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Hall Charges</h4>
                                <div className="space-y-3">
                                    {halls.map((hallName) => {
                                        const key = `cost_hall_${hallName}`;
                                        return (
                                            <div className="space-y-2" key={key}>
                                                <Label>{hallName}</Label>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    value={amounts[key] || ""}
                                                    onChange={(e) => {
                                                        if (/^[0-9]*$/.test(e.target.value)) onChange(key, e.target.value);
                                                    }}
                                                    placeholder="₹ 0"
                                                    className="border-indigo-200 text-indigo-700 font-semibold"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Section 4: Deposit */}
                        <div className="space-y-4 pt-2">
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-indigo-800 font-bold">Refundable Deposit</Label>
                                    <span className="text-[10px] uppercase text-indigo-400 font-bold tracking-wider">Separate</span>
                                </div>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={amounts.deposit || ""}
                                    onChange={(e) => {
                                        if (/^[0-9]*$/.test(e.target.value)) onChange("deposit", e.target.value);
                                    }}
                                    placeholder="Enter deposit amount..."
                                    className="border-indigo-300 ring-indigo-200 bg-white text-lg font-bold text-indigo-900"
                                />
                                <p className="text-xs text-indigo-600/80">
                                    This amount is refundable and included in the grand total calculation below.
                                </p>
                            </div>
                        </div>

                        {/* Total Footer */}
                        <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-lg shadow-lg mt-2">
                            <span className="font-bold uppercase tracking-wider text-sm text-slate-300">Total Estimate</span>
                            <span className="font-bold text-2xl text-emerald-400">{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </div>
                <DrawerFooter>
                    <Button onClick={() => onOpenChange(false)} size="lg" className="w-full">Done</Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
