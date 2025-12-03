
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Upload, Search, Filter, MoreHorizontal, ArrowUpDown, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { InventoryItem } from "@/types";
import { InventoryStats } from "./inventory-stats";

import { useCurrentRole } from "@/hooks/use-current-role";

export default function InventoryPage() {
    const role = useCurrentRole();
    const canManage = role === "ADMIN" || role === "MANAGER";
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
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

    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "in-stock" | "low-stock" | "out-of-stock">("all");

    const fetchInventory = async () => {
        try {
            const res = await fetch("/api/inventory");
            const data = await res.json();
            setItems(data);
        } catch (error) {
            toast.error("Failed to load inventory");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

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

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesStatus = true;
            if (statusFilter === "in-stock") matchesStatus = item.availableQuantity >= 20;
            if (statusFilter === "low-stock") matchesStatus = item.availableQuantity > 0 && item.availableQuantity < 20;
            if (statusFilter === "out-of-stock") matchesStatus = item.availableQuantity === 0;

            return matchesSearch && matchesStatus;
        });
    }, [items, searchQuery, statusFilter]);

    const getStatusBadge = (quantity: number) => {
        if (quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>;
        if (quantity < 20) return <Badge className="bg-amber-500 hover:bg-amber-600">Low Stock</Badge>;
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">In Stock</Badge>;
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventory</h1>
                    <p className="text-slate-500 mt-1">Manage your stock, track items, and handle reorders.</p>
                </div>
                {canManage && (
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
                                    <p className="text-sm text-slate-500">
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
                                <Button className="h-10 bg-slate-900 hover:bg-slate-800">
                                    <Plus className="mr-2 h-4 w-4" /> Add Item
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Add New Item</SheetTitle>
                                    <SheetDescription>
                                        Add a new item to your inventory. Click save when you're done.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Item Name</Label>
                                        <Input
                                            id="name"
                                            value={newItem.name}
                                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                            placeholder="e.g. Dinner Plate"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Input
                                            id="category"
                                            value={newItem.category}
                                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                            placeholder="e.g. Crockery"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="quantity">Total Quantity</Label>
                                            <Input
                                                id="quantity"
                                                type="number"
                                                value={newItem.quantity}
                                                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="unit">Unit</Label>
                                            <Input
                                                id="unit"
                                                value={newItem.unit}
                                                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                                placeholder="pieces"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <SheetFooter>
                                    <SheetClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </SheetClose>
                                    <Button onClick={handleAddItem} disabled={isAdding}>
                                        {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Item
                                    </Button>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>
                )}
            </div>

            <InventoryStats items={items} />

            <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search items..."
                                className="pl-9 bg-slate-50 border-slate-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full md:w-auto">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filter: {statusFilter === "all" ? "All Status" : statusFilter.replace("-", " ")}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Status</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter("in-stock")}>In Stock</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter("low-stock")}>Low Stock</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter("out-of-stock")}>Out of Stock</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-100">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[300px]">Item Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Available</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Loading inventory...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                            No items found matching your filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{item.name}</span>
                                                    <span className="text-xs text-slate-500 md:hidden">{item.category}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-600 hover:bg-slate-200">
                                                    {item.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(item.availableQuantity)}</TableCell>
                                            <TableCell className="text-right font-medium text-slate-600">
                                                {item.totalQuantity} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-900">
                                                {item.availableQuantity}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
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
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="mt-4 text-xs text-slate-400 text-center">
                        Showing {filteredItems.length} of {items.length} items
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
