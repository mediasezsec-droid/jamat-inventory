"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Database, FileSpreadsheet, FileJson, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRole } from "@/hooks/use-role";
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

export default function DataManagementPage() {
    const router = useRouter();
    const { isAdmin, isLoading: isRoleLoading } = useRole();
    const [activeTab, setActiveTab] = useState("export");

    // Data Management State
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    useEffect(() => {
        if (!isRoleLoading && !isAdmin) {
            toast.error("Unauthorized access");
            router.push("/");
        }
    }, [isAdmin, isRoleLoading, router]);

    if (isRoleLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
    if (!isAdmin) return null;

    const handleExport = (type: string, format: string) => {
        window.open(`/api/admin/export?type=${type}&format=${format}`, "_blank");
    };

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
                title="Data Management"
                description="Export system data, restore from backups, or reset the system."
                backUrl="/settings"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="export">Export Data</TabsTrigger>
                    <TabsTrigger value="restore">Restore Backup</TabsTrigger>
                    <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                </TabsList>

                <TabsContent value="export" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-blue-600" />
                                <CardTitle>Export Data</CardTitle>
                            </div>
                            <CardDescription>Download system data in Excel or JSON format.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { id: "master", label: "Full System Backup", desc: "All users, events, inventory, and logs." },
                                    { id: "users", label: "Users", desc: "Registered system users and roles." },
                                    { id: "events", label: "Events", desc: "All booked and past events." },
                                    { id: "inventory", label: "Inventory", desc: "Current stock items and levels." },
                                    { id: "logs", label: "System Logs", desc: "Audit trail of all actions." },
                                    { id: "ledger", label: "Ledger", desc: "Financial/Transaction records." },
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                        <div>
                                            <h4 className="font-medium text-slate-900">{item.label}</h4>
                                            <p className="text-xs text-slate-500">{item.desc}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleExport(item.id, "excel")} className="h-8">
                                                <FileSpreadsheet className="mr-2 h-3.5 w-3.5 text-green-600" /> Excel
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleExport(item.id, "json")} className="h-8">
                                                <FileJson className="mr-2 h-3.5 w-3.5 text-orange-600" /> JSON
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="restore">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Upload className="h-5 w-5 text-orange-600" />
                                <CardTitle>Restore Data</CardTitle>
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
                                        <Button disabled={!restoreFile || isRestoring} className="w-full sm:w-auto">
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
                                            <Button onClick={handleRestore} className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white">
                                                Yes, Restore
                                            </Button>
                                            <DrawerClose asChild>
                                                <Button variant="outline" className="w-full h-12 rounded-xl border-slate-300">
                                                    Cancel
                                                </Button>
                                            </DrawerClose>
                                        </DrawerFooter>
                                    </DrawerContent>
                                </Drawer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="danger">
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
                                <ResetSystemButton />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ResetSystemButton() {
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
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Button variant="destructive">Reset System</Button>
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
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="border-red-200 focus-visible:ring-red-500"
                    />
                </div>
                <DrawerFooter className="flex flex-col gap-3">
                    <Button
                        variant="destructive"
                        onClick={handleReset}
                        disabled={confirmText !== "DELETE" || isResetting}
                        className="w-full h-12 rounded-xl"
                    >
                        {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Permanently Delete Data"}
                    </Button>
                    <DrawerClose asChild>
                        <Button variant="outline" className="w-full h-12 rounded-xl border-slate-300">
                            Cancel
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
