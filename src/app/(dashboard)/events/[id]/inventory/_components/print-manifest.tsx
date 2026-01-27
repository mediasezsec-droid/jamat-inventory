import { Event, InventoryItem } from "@/types";
import { format } from "date-fns";

interface PrintManifestProps {
    event: Event;
    inventory: InventoryItem[];
    // We pass the pre-calculated stats map to avoid re-calc
    itemStats: Map<string, { issued: number; returned: number; lost: number; deficit: number }>;
}

export function PrintManifest({ event, inventory, itemStats }: PrintManifestProps) {
    // Filter to only active items for the manifest
    const activeItems = inventory.filter(item => {
        const stats = itemStats.get(item.id);
        return (stats?.issued || 0) > 0 || (stats?.returned || 0) > 0;
    });

    const totalIssued = activeItems.reduce((sum, item) => sum + (itemStats.get(item.id)?.issued || 0), 0);
    const totalReturned = activeItems.reduce((sum, item) => sum + (itemStats.get(item.id)?.returned || 0), 0);

    return (
        <div className="hidden print:block font-sans text-black p-0 bg-white w-full max-w-[210mm] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 uppercase">Manifest</h1>
                    <p className="text-slate-500 font-medium mt-1 tracking-wide">Inventory Control Document</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-slate-900">{event.name}</h2>
                    <p className="text-slate-600 mt-1">{format(new Date(event.occasionDate), "PPP")}</p>
                    <p className="text-slate-400 text-sm mt-1">Generated: {format(new Date(), "PP p")}</p>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-6 mb-8 border border-slate-200 rounded-lg p-4 bg-slate-50/50 print:bg-transparent print:border-slate-300">
                <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Total Items</p>
                    <p className="text-2xl font-bold text-slate-900">{activeItems.length}</p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Total Issued</p>
                    <p className="text-2xl font-bold text-slate-900">{totalIssued}</p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Total Returned</p>
                    <p className="text-2xl font-bold text-slate-900">{totalReturned}</p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Status</p>
                    <p className="text-2xl font-bold text-slate-900">
                        {totalIssued === totalReturned ? "Settled" : "Pending"}
                    </p>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="mb-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-900">
                            <th className="py-3 text-sm font-bold uppercase tracking-wider text-slate-900">Item Name</th>
                            <th className="py-3 text-sm font-bold uppercase tracking-wider text-slate-900 text-center w-24">Category</th>
                            <th className="py-3 text-sm font-bold uppercase tracking-wider text-slate-900 text-center w-24">Issued</th>
                            <th className="py-3 text-sm font-bold uppercase tracking-wider text-slate-900 text-center w-24">Returned</th>
                            <th className="py-3 text-sm font-bold uppercase tracking-wider text-slate-900 text-center w-24">Variance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {activeItems.map((item, idx) => {
                            const stats = itemStats.get(item.id)!;
                            const variance = stats.issued - stats.returned - stats.lost;
                            return (
                                <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50 print:bg-slate-100"}>
                                    <td className="py-3 pl-2 text-sm font-medium text-slate-900">{item.name}</td>
                                    <td className="py-3 text-sm text-slate-600 text-center">{item.category}</td>
                                    <td className="py-3 text-sm font-bold text-slate-900 text-center">{stats.issued}</td>
                                    <td className="py-3 text-sm font-bold text-slate-900 text-center">{stats.returned}</td>
                                    <td className="py-3 text-sm font-bold text-center">
                                        {variance !== 0 ? (
                                            <span className="text-red-600">{variance > 0 ? `-${variance}` : `+${Math.abs(variance)}`}</span>
                                        ) : (
                                            <span className="text-emerald-600">Considered</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer / Signatures */}
            <div className="mt-16 page-break-inside-avoid">
                <div className="grid grid-cols-2 gap-16">
                    <div>
                        <div className="h-24 border border-slate-300 rounded-lg mb-2"></div>
                        <div className="border-t-2 border-slate-900 pt-2">
                            <p className="font-bold text-slate-900 uppercase text-sm">Dispatched By</p>
                            <p className="text-xs text-slate-500">Authorized Signature & Date</p>
                        </div>
                    </div>
                    <div>
                        <div className="h-24 border border-slate-300 rounded-lg mb-2"></div>
                        <div className="border-t-2 border-slate-900 pt-2">
                            <p className="font-bold text-slate-900 uppercase text-sm">Received By</p>
                            <p className="text-xs text-slate-500">Authorized Signature & Date</p>
                        </div>
                    </div>
                </div>
                <div className="mt-12 text-center border-t border-slate-200 pt-4">
                    <p className="text-xs text-slate-400">Inventory Management System • Jamaat Inventory Control</p>
                </div>
            </div>
        </div>
    );
}
