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
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface Venue {
    id: string;
    name: string;
}

interface VenuesClientProps {
    initialVenues: Venue[];
}

export function VenuesClient({ initialVenues }: VenuesClientProps) {
    const router = useRouter();
    const [venues, setVenues] = useState<Venue[]>(initialVenues);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
    const [venueName, setVenueName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenDialog = (venue?: Venue) => {
        if (venue) {
            setEditingVenue(venue);
            setVenueName(venue.name);
        } else {
            setEditingVenue(null);
            setVenueName("");
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!venueName.trim()) return;

        setIsSaving(true);
        try {
            const method = editingVenue ? "PUT" : "POST";
            const body = editingVenue
                ? { id: editingVenue.id, name: venueName }
                : { id: uuidv4(), name: venueName };

            const res = await fetch("/api/settings/venues", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success(editingVenue ? "Venue updated" : "Venue added");
            setVenueName("");
            setIsDialogOpen(false);

            // Optimistic update
            if (editingVenue) {
                setVenues(venues.map(v => v.id === editingVenue.id ? { ...v, name: venueName } : v));
            } else {
                setVenues([...venues, body as Venue]);
            }
            router.refresh(); // Sync with server
        } catch (error) {
            toast.error("Operation failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const res = await fetch("/api/settings/venues", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Venue deleted");
            setVenues(venues.filter(v => v.id !== id));
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete venue");
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <PageHeader
                title="Venues Management"
                description="Add or edit halls and locations for events."
                backUrl="/settings"
            />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Registered Venues</CardTitle>
                        <CardDescription>List of all available venues.</CardDescription>
                    </div>
                    <Button id="btn-venue-add" onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" /> Add Venue
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {venues.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">No venues found. Add one to get started.</p>
                        ) : (
                            venues.map((venue) => (
                                <div key={venue.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors group">
                                    <span className="font-medium text-slate-900">{venue.name}</span>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button id={`btn-venue-edit-${venue.id}`} variant="ghost" size="icon" onClick={() => handleOpenDialog(venue)}>
                                            <Pencil className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                        </Button>
                                        <Button id={`btn-venue-delete-${venue.id}`} variant="ghost" size="icon" onClick={() => handleDelete(venue.id, venue.name)}>
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
                        <DialogTitle>{editingVenue ? "Edit Venue" : "Add New Venue"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Venue Name</label>
                            <Input
                                placeholder="e.g. Main Hall"
                                value={venueName}
                                onChange={(e) => setVenueName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button id="btn-venue-create-save" onClick={handleSave} disabled={isSaving || !venueName.trim()}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
