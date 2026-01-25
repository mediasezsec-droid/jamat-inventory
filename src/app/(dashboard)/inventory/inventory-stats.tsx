import { InventoryItem } from "@/types";
import { Package, AlertTriangle, XCircle, Layers } from "lucide-react";

interface InventoryStatsProps {
    items: InventoryItem[];
}

export function InventoryStats({ items }: InventoryStatsProps) {
    const totalProducts = items.length;
    const outOfStock = items.filter((i) => i.availableQuantity === 0).length;
    const lowStock = items.filter((i) => i.availableQuantity > 0 && i.availableQuantity < 20).length;
    const categories = new Set(items.map((i) => i.category)).size;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Products - Indigo */}
            <div className="stat-card stat-card-indigo">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-600">Total Products</p>
                    <div className="icon-container-indigo">
                        <Package className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{totalProducts}</p>
                <p className="text-xs text-slate-400 mt-1">Across {categories} categories</p>
            </div>

            {/* Low Stock - Amber */}
            <div className="stat-card stat-card-amber">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-600">Low Stock</p>
                    <div className="icon-container-amber">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{lowStock}</p>
                <p className="text-xs text-slate-400 mt-1">Items below 20 units</p>
            </div>

            {/* Out of Stock - Rose */}
            <div className="stat-card stat-card-rose">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-600">Out of Stock</p>
                    <div className="icon-container-rose">
                        <XCircle className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{outOfStock}</p>
                <p className="text-xs text-slate-400 mt-1">Needs reordering</p>
            </div>

            {/* Categories - Emerald */}
            <div className="stat-card stat-card-emerald">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-600">Categories</p>
                    <div className="icon-container-emerald">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{categories}</p>
                <p className="text-xs text-slate-400 mt-1">Active categories</p>
            </div>
        </div>
    );
}
