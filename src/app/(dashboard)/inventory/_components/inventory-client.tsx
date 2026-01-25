
"use client";

import { useState, useMemo } from "react";
import { Plus, Upload, MoreHorizontal, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { InventoryItem } from "@/types";
import { InventoryStats } from "../inventory-stats";
import { DataTable } from "@/components/ui/data-table-revamp";
import { useCurrentRole } from "@/hooks/use-current-role";

interface InventoryClientProps {
    initialItems: InventoryItem[];
}

export default function InventoryClient({ initialItems }: InventoryClientProps) {
    const role = useCurrentRole();
    const canManage = role === "ADMIN" || role === "MANAGER";
    const [items, setItems] = useState<InventoryItem[]>(initialItems);
    const [bulkData, setBulkData] = useState("");
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // New Item State
    const [newItem, setNewItem] = useState({
        name: "",
        category: "",
        quantity: "",
        unit: "pieces"
    });

    const fetchInventory = async () => {
        try {
            const res = await fetch("/api/inventory");
            const data = await res.json();
            setItems(data);
        } catch (error) {
            toast.error("Failed to load inventory");
        }
    };

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.category || !newItem.quantity) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsAdding(true);
        try {
            const res = await fetch("/api/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newItem.name,
                    category: newItem.category,
                    totalQuantity: Number(newItem.quantity),
                    unit: newItem.unit
                }),
            });

            if (!res.ok) throw new Error("Failed to add item");

            toast.success("Item added successfully");
            setNewItem({ name: "", category: "", quantity: "", unit: "pieces" });
            setIsAddSheetOpen(false);
            fetchInventory();
        } catch (error) {
            toast.error("Failed to add item");
        } finally {
            setIsAdding(false);
        }
    };

    const handleBulkUpload = async () => {
        if (!bulkData.trim()) return;
        setIsBulkLoading(true);
        try {
            const lines = bulkData.trim().split("\n");
            const parsedItems = lines.map(line => {
                const [name, category, quantity, unit] = line.split(",").map(s => s.trim());
                if (!name || !quantity) throw new Error("Invalid format");
                return { name, category: category || "General", totalQuantity: Number(quantity), unit: unit || "pieces" };
            });

            const res = await fetch("/api/inventory/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: parsedItems }),
            });

            if (!res.ok) throw new Error("Failed to upload");

            toast.success("Bulk upload successful");
            setBulkData("");
            setIsBulkOpen(false);
            fetchInventory();
        } catch (error) {
            toast.error("Failed to upload. Check format: Name, Category, Quantity, Unit");
        } finally {
            setIsBulkLoading(false);
        }
    };

    const columns = [
        {
            header: "Item Name",
            accessorKey: "name" as keyof InventoryItem,
            cell: (item: InventoryItem) => (
                <div className="flex flex-col">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{item.name}</span>
                    <span className="text-xs text-neutral-500">{item.category}</span>
                </div>
            )
        },
        {
            header: "Status",
            accessorKey: "availableQuantity" as keyof InventoryItem,
            cell: (item: InventoryItem) => {
                if (item.availableQuantity === 0)
                    return <Badge variant="destructive" className="flex w-fit items-center gap-1"><AlertCircle className="w-3 h-3" /> Out of Stock</Badge>;
                if (item.availableQuantity < 20)
                    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 flex w-fit items-center gap-1"><ShieldAlert className="w-3 h-3" /> Low Stock</Badge>;
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 flex w-fit items-center gap-1"><CheckCircle2 className="w-3 h-3" /> In Stock</Badge>;
            }
        },
        {
            header: "Total",
            accessorKey: "totalQuantity" as keyof InventoryItem,
            cell: (item: InventoryItem) => (
                <div className="font-mono text-sm">{item.totalQuantity} <span className="text-xs text-neutral-400">{item.unit}</span></div>
            )
        },
        {
            header: "Available",
            accessorKey: "availableQuantity" as keyof InventoryItem,
            cell: (item: InventoryItem) => (
                <div className="font-mono font-bold text-sm text-neutral-900 dark:text-white">{item.availableQuantity}</div>
            )
        },
        {
            header: "",
            cell: (item: InventoryItem) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.name)}>
                            Copy Name
                        </DropdownMenuItem>
                        {canManage && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Edit Item</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Delete Item</DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            className: "w-[50px] text-right"
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <InventoryStats items={items} />

            <DataTable
                title="Inventory Items"
                description="Manage your stock, track items, and handle reorders."
                data={items}
                columns={columns}
                searchKey="name"
                action={
                    canManage && (
                        <div className="flex gap-2">
                            <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="h-10">
                                        <Upload className="mr-2 h-4 w-4" /> Bulk Import
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Bulk Import Items</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <p className="text-sm text-neutral-500">
                                            Format: <code>Name, Category, Quantity, Unit</code> (one per line)
                                        </p>
                                        <Textarea
                                            placeholder="Plate, Crockery, 100, pieces&#10;Spoon, Cutlery, 200, pieces"
                                            rows={10}
                                            value={bulkData}
                                            onChange={(e) => setBulkData(e.target.value)}
                                            className="font-mono text-sm"
                                        />
                                        <Button onClick={handleBulkUpload} disabled={isBulkLoading} className="w-full">
                                            {isBulkLoading ? "Importing..." : "Import Items"}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                                        <Plus className="mr-2 h-4 w-4" /> Add Item
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="sm:max-w-lg w-full p-6">
                                    <SheetHeader className="mb-8 pb-4 border-b border-slate-200">
                                        <SheetTitle className="text-xl font-bold text-slate-900">Add New Item</SheetTitle>
                                        <SheetDescription className="text-slate-500">
                                            Add a new item to the inventory.
                                        </SheetDescription>
                                    </SheetHeader>

                                    <div className="space-y-6">
                                        {/* Item Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium text-slate-700">Item Name</Label>
                                            <Input
                                                id="name"
                                                value={newItem.name}
                                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                                placeholder="e.g. Dinner Plate"
                                                className="w-full h-11 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                        </div>

                                        {/* Category */}
                                        <div className="space-y-2">
                                            <Label htmlFor="category" className="text-sm font-medium text-slate-700">Category</Label>
                                            <Select
                                                value={newItem.category}
                                                onValueChange={(val) => setNewItem({ ...newItem, category: val })}
                                            >
                                                <SelectTrigger className="w-full h-11 rounded-lg border-slate-300">
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

                                        {/* Quantity & Unit Row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="quantity" className="text-sm font-medium text-slate-700">Quantity</Label>
                                                <Input
                                                    id="quantity"
                                                    type="number"
                                                    value={newItem.quantity}
                                                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                                                    placeholder="0"
                                                    className="w-full h-11 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="unit" className="text-sm font-medium text-slate-700">Unit</Label>
                                                <Select
                                                    value={newItem.unit}
                                                    onValueChange={(val) => setNewItem({ ...newItem, unit: val })}
                                                >
                                                    <SelectTrigger className="w-full h-11 rounded-lg border-slate-300">
                                                        <SelectValue placeholder="Unit" />
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
                                    </div>

                                    {/* Footer */}
                                    <SheetFooter className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                                        <SheetClose asChild>
                                            <Button variant="outline" className="w-full sm:w-auto h-11 rounded-lg border-slate-300">
                                                Cancel
                                            </Button>
                                        </SheetClose>
                                        <Button
                                            onClick={handleAddItem}
                                            disabled={isAdding}
                                            className="w-full sm:flex-1 h-11 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md"
                                        >
                                            {isAdding ? "Saving..." : "Save Item"}
                                        </Button>
                                    </SheetFooter>
                                </SheetContent>
                            </Sheet>
                        </div>
                    )
                }
            />
        </div>
    );
}
