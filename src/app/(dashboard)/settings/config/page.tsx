
"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Plus, Trash2, Building2, Utensils, Database, FileSpreadsheet, FileJson, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ConfigPage() {
    const [activeTab, setActiveTab] = useState("general");
    const [isLoading, setIsLoading] = useState(true);

    // General Settings
    const [bookingWindow, setBookingWindow] = useState<number>(60);
    const [isSavingGeneral, setIsSavingGeneral] = useState(false);

    // Master Data
    const [halls, setHalls] = useState<string[]>([]);
    const [caterers, setCaterers] = useState<any[]>([]);
    const [newHall, setNewHall] = useState("");
    const [newCaterer, setNewCaterer] = useState("");
    const [newCatererPhone, setNewCatererPhone] = useState("");
    const [isSavingMaster, setIsSavingMaster] = useState(false);

    // Data Management
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Config
                const configRes = await fetch("/api/config");
                const configData = await configRes.json();
                if (configData.bookingWindow) setBookingWindow(configData.bookingWindow);

                // Fetch Master Data
                const masterRes = await fetch("/api/settings/master-data");
                const masterData = await masterRes.json();
                setHalls(masterData.halls || []);
                setCaterers(masterData.caterers || []);

            } catch (error) {
                toast.error("Failed to load settings");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSaveGeneral = async () => {
        setIsSavingGeneral(true);
        try {
            const res = await fetch("/api/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingWindow: Number(bookingWindow) }),
            });

            if (res.ok) toast.success("Configuration saved");
            else throw new Error("Failed to save");
        } catch (error) {
            toast.error("Failed to save configuration");
        } finally {
            setIsSavingGeneral(false);
        }
    };

    const handleAddMasterData = async (type: "hall" | "caterer", value: any) => {
        if (typeof value === 'string' && !value.trim()) return;
        if (typeof value === 'object' && !value.name.trim()) return;

        setIsSavingMaster(true);
        try {
            const res = await fetch("/api/settings/master-data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, value }),
            });

            if (res.ok) {
                toast.success(`${type === "hall" ? "Hall" : "Caterer"} added`);
                if (type === "hall") {
                    setHalls([...halls, value]);
                    setNewHall("");
                } else {
                    setCaterers([...caterers, value]);
                    setNewCaterer("");
                    setNewCatererPhone("");
                }
            } else throw new Error("Failed to add");
        } catch (error) {
            toast.error("Failed to add item");
        } finally {
            setIsSavingMaster(false);
        }
    };

    const handleDeleteMasterData = async (type: "hall" | "caterer", value: string) => {
        if (!confirm(`Are you sure you want to remove "${value}"?`)) return;
        try {
            const res = await fetch("/api/settings/master-data", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, value }),
            });

            if (res.ok) {
                toast.success("Item removed");
                if (type === "hall") setHalls(halls.filter(h => h !== value));
                else setCaterers(caterers.filter(c => c !== value));
            } else throw new Error("Failed to delete");
        } catch (error) {
            toast.error("Failed to delete item");
        }
    };

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

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-amber-600" /></div>;

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <PageHeader
                title="Settings"
                description="Manage system configuration and master data."
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="master-data">Master Data</TabsTrigger>
                    <TabsTrigger value="data">Data Management</TabsTrigger>
                    <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Booking Configuration</CardTitle>
                            <CardDescription>Configure global settings for event bookings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Booking Conflict Window (Minutes)
                                </label>
                                <p className="text-xs text-slate-500 mb-2">
                                    Buffer time around an event to check for conflicts.
                                </p>
                                <Input
                                    type="number"
                                    value={bookingWindow}
                                    onChange={(e) => setBookingWindow(Number(e.target.value))}
                                    min={0}
                                    className="max-w-xs"
                                />
                            </div>

                            <Button onClick={handleSaveGeneral} disabled={isSavingGeneral} className="bg-amber-600 hover:bg-amber-700">
                                {isSavingGeneral ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="master-data" className="space-y-6">
                    {/* Halls Management */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-amber-600" />
                                <CardTitle>Halls & Venues</CardTitle>
                            </div>
                            <CardDescription>Manage the list of available halls for booking.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter hall name..."
                                    value={newHall}
                                    onChange={(e) => setNewHall(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddMasterData("hall", newHall)}
                                />
                                <Button onClick={() => handleAddMasterData("hall", newHall)} disabled={!newHall.trim() || isSavingMaster}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {halls.map((hall, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 group">
                                        {hall}
                                        <button onClick={() => handleDeleteMasterData("hall", hall)} className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {halls.length === 0 && <p className="text-sm text-slate-400 italic">No halls added yet.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Caterers Management */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Utensils className="h-5 w-5 text-amber-600" />
                                <CardTitle>Caterers</CardTitle>
                            </div>
                            <CardDescription>Manage the list of approved caterers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-2">
                                <Input
                                    placeholder="Caterer Name..."
                                    value={newCaterer}
                                    onChange={(e) => setNewCaterer(e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="Phone Number..."
                                    value={newCatererPhone}
                                    onChange={(e) => setNewCatererPhone(e.target.value)}
                                    className="flex-1"
                                    onKeyDown={(e) => e.key === "Enter" && handleAddMasterData("caterer", { name: newCaterer, phone: newCatererPhone })}
                                />
                                <Button onClick={() => handleAddMasterData("caterer", { name: newCaterer, phone: newCatererPhone })} disabled={!newCaterer.trim() || isSavingMaster}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {caterers.map((caterer: any, i) => {
                                    const name = typeof caterer === 'string' ? caterer : caterer.name;
                                    const phone = typeof caterer === 'string' ? '' : caterer.phone;
                                    return (
                                        <div key={i} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 group">
                                            <span>{name} {phone && <span className="text-slate-400 font-normal">({phone})</span>}</span>
                                            <button onClick={() => handleDeleteMasterData("caterer", name)} className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                                {caterers.length === 0 && <p className="text-sm text-slate-400 italic">No caterers added yet.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="data" className="space-y-6">
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
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button disabled={!restoreFile || isRestoring} className="w-full sm:w-auto">
                                            {isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                            Restore Data
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to restore data from <strong>{restoreFile?.name}</strong>?
                                                <br /><br />
                                                This will merge/overwrite existing data in the database. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleRestore} className="bg-orange-600 hover:bg-orange-700">
                                                Yes, Restore
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
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
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">Reset System</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will permanently delete all:
                        <ul className="list-disc pl-5 mt-2 mb-2">
                            <li>Events</li>
                            <li>Inventory Items</li>
                            <li>System Logs</li>
                            <li>Users (except your account)</li>
                        </ul>
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
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
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleReset}
                        disabled={confirmText !== "DELETE" || isResetting}
                    >
                        {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Permanently Delete Data"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
