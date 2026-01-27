"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface Caterer {
    id: string;
    name: string;
    phone: string;
}

interface CaterersClientProps {
    initialCaterers: Caterer[];
}

export function CaterersClient({ initialCaterers }: CaterersClientProps) {
    const router = useRouter();
    const [caterers, setCaterers] = useState<Caterer[]>(initialCaterers);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCaterer, setEditingCaterer] = useState<Caterer | null>(null);
    const [formData, setFormData] = useState({ name: "", phone: "" });
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenDialog = (caterer?: Caterer) => {
        if (caterer) {
            setEditingCaterer(caterer);
            setFormData({ name: caterer.name, phone: caterer.phone });
        } else {
            setEditingCaterer(null);
            setFormData({ name: "", phone: "" });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;

        setIsSaving(true);
        try {
            const method = editingCaterer ? "PUT" : "POST";
            const body = editingCaterer
                ? { id: editingCaterer.id, ...formData }
                : { id: uuidv4(), ...formData };

            const res = await fetch("/api/settings/caterers", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success(editingCaterer ? "Caterer updated" : "Caterer added");
            setIsDialogOpen(false);

            // Optimistic update
            if (editingCaterer) {
                setCaterers(caterers.map(c => c.id === editingCaterer.id ? { ...c, ...formData } : c));
            } else {
                setCaterers([...caterers, body as Caterer]);
            }
            router.refresh();
        } catch (error) {
            toast.error("Operation failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const res = await fetch("/api/settings/caterers", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Caterer deleted");
            setCaterers(caterers.filter(c => c.id !== id));
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete caterer");
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <PageHeader
                title="Caterers Management"
                description="Manage approved food providers and contact details."
                backUrl="/settings"
            />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Registered Caterers</CardTitle>
                        <CardDescription>List of available caterers.</CardDescription>
                    </div>
                    <Button id="btn-caterer-add" onClick={() => handleOpenDialog()} className="bg-amber-600 hover:bg-amber-700">
                        <Plus className="mr-2 h-4 w-4" /> Add Caterer
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {caterers.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">No caterers found. Add one to get started.</p>
                        ) : (
                            caterers.map((caterer) => (
                                <div key={caterer.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors group">
                                    <div>
                                        <p className="font-medium text-slate-900">{caterer.name}</p>
                                        <p className="text-sm text-slate-500">{caterer.phone || "No phone number"}</p>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button id={`btn-caterer-edit-${caterer.id}`} variant="ghost" size="icon" onClick={() => handleOpenDialog(caterer)}>
                                            <Pencil className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                        </Button>
                                        <Button id={`btn-caterer-delete-${caterer.id}`} variant="ghost" size="icon" onClick={() => handleDelete(caterer.id, caterer.name)}>
                                            <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCaterer ? "Edit Caterer" : "Add New Caterer"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Caterer Name</label>
                            <Input
                                placeholder="e.g. Al-Nour Catering"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone Number</label>
                            <Input
                                placeholder="e.g. 050-1234567"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button id="btn-caterer-create-save" onClick={handleSave} disabled={isSaving || !formData.name.trim()}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
