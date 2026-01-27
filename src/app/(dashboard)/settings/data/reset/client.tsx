"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

export default function ResetSystemClient() {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async () => {
        if (confirmText !== "DELETE") return;
        setIsResetting(true);
        try {
            const res = await fetch("/api/admin/reset", { method: "POST" });
            if (res.ok) {
                toast.success("System reset successfully");
                setIsOpen(false);
                window.location.reload();
            } else {
                throw new Error("Reset failed");
            }
        } catch (error) {
            toast.error("Failed to reset system");
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <PageHeader
                title="System Reset"
                description="Reset system data to a clean state."
                backUrl="/settings"
            />

            <Card className="border-red-200">
                <CardHeader className="bg-red-50 border-b border-red-100">
                    <CardTitle className="text-red-700">Danger Zone</CardTitle>
                    <CardDescription className="text-red-600/80">Irreversible actions. Proceed with caution.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-slate-900">Reset System Data</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Permanently delete all events, inventory, logs, and other users.
                                <br />
                                <span className="font-bold">This action cannot be undone.</span>
                            </p>
                        </div>
                        <Drawer open={isOpen} onOpenChange={setIsOpen}>
                            <DrawerTrigger asChild>
                                <Button id="btn-data-reset" variant="destructive">Reset System</Button>
                            </DrawerTrigger>
                            <DrawerContent className="px-4 pb-8">
                                <DrawerHeader className="text-center pt-6">
                                    <DrawerTitle className="text-xl font-bold text-red-600">Reset System Data</DrawerTitle>
                                    <DrawerDescription className="text-slate-500 mt-2">
                                        This action will permanently delete all:
                                        <ul className="list-disc text-left pl-8 mt-2 mb-2 text-slate-600">
                                            <li>Events</li>
                                            <li>Inventory Items</li>
                                            <li>System Logs</li>
                                            <li>Users (except your account)</li>
                                        </ul>
                                        This action cannot be undone.
                                    </DrawerDescription>
                                </DrawerHeader>
                                <div className="py-4 px-4">
                                    <label className="text-sm font-medium text-slate-700 block mb-2">
                                        Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                                    </label>
                                    <Input
                                        id="input-data-reset-confirm"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        placeholder="DELETE"
                                        className="border-red-200 focus-visible:ring-red-500"
                                    />
                                </div>
                                <DrawerFooter className="flex flex-col gap-3">
                                    <Button
                                        id="btn-data-reset-confirm"
                                        variant="destructive"
                                        onClick={handleReset}
                                        disabled={confirmText !== "DELETE" || isResetting}
                                        className="w-full h-12 rounded-xl"
                                    >
                                        {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Permanently Delete Data"}
                                    </Button>
                                    <DrawerClose asChild>
                                        <Button id="btn-data-reset-cancel" variant="outline" className="w-full h-12 rounded-xl border-slate-300">
                                            Cancel
                                        </Button>
                                    </DrawerClose>
                                </DrawerFooter>
                            </DrawerContent>
                        </Drawer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
