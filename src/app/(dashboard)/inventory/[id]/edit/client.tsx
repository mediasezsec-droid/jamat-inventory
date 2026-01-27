
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Save } from "lucide-react";
import { InventoryItem } from "@/generated/prisma/client";

interface EditInventoryClientProps {
    initialItem: InventoryItem;
}

export default function EditInventoryClient({ initialItem }: EditInventoryClientProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [item, setItem] = useState({
        name: initialItem.name,
        category: initialItem.category,
        totalQuantity: initialItem.totalQuantity.toString(),
        unit: initialItem.unit,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch(`/api/inventory/${initialItem.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...item,
                    totalQuantity: parseInt(item.totalQuantity, 10),
                }),
            });

            if (!res.ok) throw new Error("Failed to update item");

            toast.success("Inventory item updated");
            router.push("/inventory");
            router.refresh();
        } catch (error) {
            toast.error("Failed to update item");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl space-y-6">
            <PageHeader
                title="Edit Item"
                description={`Modify details for ${initialItem.name}`}
                backUrl="/inventory"
            />

            <Card>
                <CardHeader>
                    <CardTitle>Item Details</CardTitle>
                    <CardDescription>Update the item's information below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Item Name</Label>
                            <Input
                                id="name"
                                value={item.name}
                                onChange={(e) => setItem({ ...item, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={item.category}
                                onValueChange={(val) => setItem({ ...item, category: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Utensils">Utensils</SelectItem>
                                    <SelectItem value="Furniture">Furniture</SelectItem>
                                    <SelectItem value="Electronics">Electronics</SelectItem>
                                    <SelectItem value="General">General</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="totalQuantity">Total Quantity</Label>
                                <Input
                                    id="totalQuantity"
                                    type="number"
                                    value={item.totalQuantity}
                                    onChange={(e) => setItem({ ...item, totalQuantity: e.target.value })}
                                    required
                                    min="0"
                                />
                                <p className="text-xs text-slate-500">
                                    Changing total quantity will adjust available quantity by the difference.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unit</Label>
                                <Select
                                    value={item.unit}
                                    onValueChange={(val) => setItem({ ...item, unit: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pieces">Pieces</SelectItem>
                                        <SelectItem value="sets">Sets</SelectItem>
                                        <SelectItem value="kg">Kg</SelectItem>
                                        <SelectItem value="liters">Liters</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button id="btn-inventory-update-save" type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
