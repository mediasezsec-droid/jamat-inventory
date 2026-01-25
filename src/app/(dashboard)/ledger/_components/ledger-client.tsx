"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Search, Package, User, Calendar, ArrowUpRight, ArrowDownRight, RefreshCw, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface LedgerEntry {
    id: string;
    action: string;
    details: any;
    userId: string;
    userName: string;
    timestamp: number;
}

export function LedgerClient() {
    const [logs, setLogs] = useState<LedgerEntry[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<LedgerEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [actionFilter, setActionFilter] = useState("ALL");

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch("/api/ledger");
                const data = await res.json();
                setLogs(data);
                setFilteredLogs(data);
            } catch (error) {
                console.error("Failed to fetch ledger", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, []);

    useEffect(() => {
        let result = logs;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(log =>
                log.userName.toLowerCase().includes(query) ||
                (log.details?.itemName && log.details.itemName.toLowerCase().includes(query)) ||
                (log.details?.eventName && log.details.eventName.toLowerCase().includes(query))
            );
        }

        if (actionFilter !== "ALL") {
            result = result.filter(log => {
                if (actionFilter === "ISSUE") return log.action.includes("REMOVED") || log.action === "ISSUE";
                if (actionFilter === "RETURN") return log.action.includes("RETURNED") || log.action === "RETURN";
                return log.action === actionFilter;
            });
        }

        setFilteredLogs(result);
    }, [searchQuery, actionFilter, logs]);

    const getActionBadge = (action: string) => {
        const isIssue = action.includes("REMOVED") || action === "ISSUE";
        const isReturn = action.includes("RETURNED") || action === "RETURN";

        if (isIssue) {
            return (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border border-red-200">
                    <ArrowUpRight className="h-3 w-3 mr-1" /> Issue
                </Badge>
            );
        }
        if (isReturn) {
            return (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                    <ArrowDownRight className="h-3 w-3 mr-1" /> Return
                </Badge>
            );
        }
        if (action.includes("CREATED")) {
            return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Created</Badge>;
        }
        if (action.includes("UPDATED")) {
            return <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">Updated</Badge>;
        }
        return <Badge variant="secondary">{action}</Badge>;
    };

    const renderDetails = (entry: LedgerEntry) => {
        const details = entry.details;
        if (!details) return <span className="text-slate-400">-</span>;

        const isIssue = entry.action.includes("REMOVED") || entry.action === "ISSUE";

        if (details.itemName && details.quantity) {
            return (
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center",
                        isIssue ? "bg-red-100" : "bg-emerald-100"
                    )}>
                        <Package className={cn("h-4 w-4", isIssue ? "text-red-600" : "text-emerald-600")} />
                    </div>
                    <div>
                        <span className={cn("font-bold", isIssue ? "text-red-600" : "text-emerald-600")}>
                            {isIssue ? "-" : "+"}{details.quantity}
                        </span>
                        <span className="text-slate-700 ml-1">{details.itemName}</span>
                        {details.eventName && (
                            <span className="text-slate-400 text-xs block">for {details.eventName}</span>
                        )}
                    </div>
                </div>
            );
        }

        if (details.eventName) {
            return (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Event: <strong>{details.eventName}</strong></span>
                </div>
            );
        }

        return (
            <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                {JSON.stringify(details).substring(0, 50)}{JSON.stringify(details).length > 50 ? "..." : ""}
            </code>
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-slate-500">Loading ledger...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl space-y-6">
            <PageHeader
                title="Inventory Ledger"
                description="Complete history of all inventory movements and transactions."
            />

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by user, item, or event..."
                        className="pl-9 h-11 rounded-lg bg-white border-slate-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-full md:w-[180px] h-11 rounded-lg border-slate-200">
                        <SelectValue placeholder="Filter by Action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Actions</SelectItem>
                        <SelectItem value="ISSUE">Issues Only</SelectItem>
                        <SelectItem value="RETURN">Returns Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Total Transactions</p>
                    <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Issues</p>
                    <p className="text-2xl font-bold text-red-600">
                        {logs.filter(l => l.action.includes("REMOVED") || l.action === "ISSUE").length}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Returns</p>
                    <p className="text-2xl font-bold text-emerald-600">
                        {logs.filter(l => l.action.includes("RETURNED") || l.action === "RETURN").length}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Filtered Results</p>
                    <p className="text-2xl font-bold text-indigo-600">{filteredLogs.length}</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 hover:bg-slate-50">
                            <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-slate-600">Date & Time</TableHead>
                            <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-slate-600">User</TableHead>
                            <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-slate-600">Action</TableHead>
                            <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-slate-600">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                            <BookOpen className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="font-semibold text-slate-700">No transactions found</p>
                                        <p className="text-sm text-slate-400">Try adjusting your filters</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLogs.slice(0, 50).map((log, idx) => (
                                <TableRow
                                    key={log.id}
                                    className={cn(
                                        "border-b border-slate-100 transition-colors",
                                        "hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-violet-50/30",
                                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                                    )}
                                >
                                    <TableCell className="text-slate-500 text-sm py-4">
                                        <div>
                                            <p className="font-medium text-slate-700">{format(new Date(log.timestamp), "MMM d, yyyy")}</p>
                                            <p className="text-xs text-slate-400">{format(new Date(log.timestamp), "h:mm a")}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                                                {log.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-slate-800">{log.userName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">{getActionBadge(log.action)}</TableCell>
                                    <TableCell className="py-4">{renderDetails(log)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {filteredLogs.length > 50 && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center text-sm text-slate-500">
                        Showing first 50 of {filteredLogs.length} results
                    </div>
                )}
            </div>
        </div>
    );
}
