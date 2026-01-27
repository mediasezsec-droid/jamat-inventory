
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Clock, Save } from "lucide-react";
import { useRouter } from "next/navigation";

interface ConfigClientProps {
    initialBookingWindow: number;
}

export default function ConfigClient({ initialBookingWindow }: ConfigClientProps) {
    const router = useRouter();
    const [bookingWindow, setBookingWindow] = useState<number>(initialBookingWindow);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveConfig = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingWindow: Number(bookingWindow) }),
            });
            if (res.ok) {
                toast.success("Configuration saved");
                router.refresh();
            } else {
                throw new Error("Failed");
            }
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl space-y-6">
            <PageHeader
                title="General Configuration"
                description="Manage global system rules and preferences."
                backUrl="/settings"
            />

            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-5 w-5 text-indigo-600" />
                        Booking Rules
                    </CardTitle>
                    <CardDescription>Global rules applied to all event bookings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="bookingWindow" className="text-sm font-medium text-slate-700">
                                Conflict Window (Minutes)
                            </label>
                            <p className="text-xs text-slate-500">
                                Buffer time around an event to detect conflicts during booking.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Input
                                id="bookingWindow"
                                type="number"
                                value={bookingWindow}
                                onChange={(e) => setBookingWindow(Number(e.target.value))}
                                className="w-full h-11"
                                min={0}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <Button
                            id="btn-config-save" // RBAC ID
                            onClick={handleSaveConfig}
                            disabled={isSaving}
                            className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Configuration
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
