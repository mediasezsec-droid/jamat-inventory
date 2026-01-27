"use client";

import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function RestoreDataClient() {
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    const handleRestore = async () => {
        if (!restoreFile) return;
        setIsRestoring(true);
        const formData = new FormData();
        formData.append("file", restoreFile);

        try {
            const res = await fetch("/api/admin/restore", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                toast.success("Data restored successfully");
                setRestoreFile(null);
                window.location.reload();
            } else {
                throw new Error("Restore failed");
            }
        } catch (error) {
            toast.error("Failed to restore data");
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <PageHeader
                title="Restore Data"
                description="Restore system data from a backup file."
                backUrl="/settings"
            />

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-orange-600" />
                        <CardTitle>Restore Options</CardTitle>
                    </div>
                    <CardDescription>Restore data from a backup file. Existing data may be overwritten.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-end border p-4 rounded-lg bg-slate-50/50">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="restore-file">Select Backup File</Label>
                            <Input id="restore-file" type="file" accept=".json,.xlsx,.xls" onChange={(e) => setRestoreFile(e.target.files?.[0] || null)} className="bg-white" />
                        </div>
                        <Drawer>
                            <DrawerTrigger asChild>
                                <Button id="btn-data-restore" disabled={!restoreFile || isRestoring} className="w-full sm:w-auto">
                                    {isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    Restore Data
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent className="px-4 pb-8">
                                <DrawerHeader className="text-center pt-6">
                                    <DrawerTitle className="text-xl font-bold">Confirm Restore</DrawerTitle>
                                    <DrawerDescription className="text-slate-500 mt-2">
                                        Are you sure you want to restore data from <strong className="text-slate-900">{restoreFile?.name}</strong>?
                                        <br /><br />
                                        This will merge/overwrite existing data. This action cannot be undone.
                                    </DrawerDescription>
                                </DrawerHeader>
                                <DrawerFooter className="flex flex-col gap-3 mt-4">
                                    <Button id="btn-data-restore-confirm" onClick={handleRestore} className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white">
                                        Yes, Restore
                                    </Button>
                                    <DrawerClose asChild>
                                        <Button id="btn-data-restore-cancel" variant="outline" className="w-full h-12 rounded-xl border-slate-300">
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
