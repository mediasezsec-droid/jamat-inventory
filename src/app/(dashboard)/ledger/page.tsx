
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Search, Filter, ArrowDownUp, Package, User, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";

interface LogEntry {
    id: string;
    action: string;
    details: any;
    userId: string;
    userName: string;
    timestamp: number;
}

export default function LedgerPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
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
        if (action.includes("REMOVED") || action === "ISSUE") return <Badge variant="destructive">Issue</Badge>;
        if (action.includes("RETURNED") || action === "RETURN") return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Return</Badge>;
        if (action.includes("CREATED")) return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Create</Badge>;
        if (action.includes("UPDATED")) return <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">Update</Badge>;
        return <Badge variant="secondary">{action}</Badge>;
    };

    if (isLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-amber-600" /></div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl space-y-6">
            <PageHeader
                title="Inventory Ledger"
                description="Complete history of all inventory transactions and system actions."
            />

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search by user, item, or event..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by Action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Actions</SelectItem>
                        <SelectItem value="ISSUE">Issues</SelectItem>
                        <SelectItem value="RETURN">Returns</SelectItem>
                        <SelectItem value="EVENT_CREATED">Event Created</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="w-[180px]">Date & Time</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                    No records found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-slate-500 text-sm">
                                        {format(new Date(log.timestamp), "PP p")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                {log.userName.charAt(0)}
                                            </div>
                                            <span className="font-medium text-sm">{log.userName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getActionBadge(log.action)}</TableCell>
                                    <TableCell className="text-sm">
                                        {log.details?.itemName && (
                                            <span className="font-medium">{log.details.quantity} x {log.details.itemName}</span>
                                        )}
                                        {log.details?.eventName && (
                                            <span className="text-slate-500 ml-2">for {log.details.eventName}</span>
                                        )}
                                        {!log.details?.itemName && JSON.stringify(log.details)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {filteredLogs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No records found.</div>
                ) : (
                    filteredLogs.map((log) => (
                        <Card key={log.id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                            {log.userName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{log.userName}</p>
                                            <p className="text-xs text-slate-500 flex items-center">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {format(new Date(log.timestamp), "PP p")}
                                            </p>
                                        </div>
                                    </div>
                                    {getActionBadge(log.action)}
                                </div>
                                <div className="bg-slate-50 p-3 rounded text-sm">
                                    {log.details?.itemName ? (
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-slate-400" />
                                            <span>
                                                <span className="font-bold">{log.details.quantity}</span> {log.details.itemName}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-600">{JSON.stringify(log.details)}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
