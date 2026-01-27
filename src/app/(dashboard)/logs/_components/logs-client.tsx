"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, ScrollText, Search, RefreshCw, AlertCircle, CheckCircle, Edit, Trash2, Plus, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";

interface Log {
    id: string;
    action: string;
    details: any;
    userId: string;
    userName: string;
    timestamp: string;
}

interface LogsClientProps {
    initialLogs: Log[];
}

export function LogsClient({ initialLogs }: LogsClientProps) {
    const router = useRouter();
    const [logs, setLogs] = useState<Log[]>(initialLogs);
    const [filteredLogs, setFilteredLogs] = useState<Log[]>(initialLogs);
    const [searchQuery, setSearchQuery] = useState("");
    const [actionFilter, setActionFilter] = useState("ALL");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Sync props to state for router.refresh()
    useEffect(() => {
        setLogs(initialLogs);
    }, [initialLogs]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.refresh();
        setTimeout(() => setIsRefreshing(false), 1000); // Visual feedback
    };

    useEffect(() => {
        let result = logs;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(log =>
                log.userName.toLowerCase().includes(query) ||
                log.action.toLowerCase().includes(query) ||
                JSON.stringify(log.details).toLowerCase().includes(query)
            );
        }

        if (actionFilter !== "ALL") {
            result = result.filter(log => log.action.includes(actionFilter));
        }

        setFilteredLogs(result);
    }, [searchQuery, actionFilter, logs]);

    const getActionIcon = (action: string) => {
        if (action.includes("ERROR") || action.includes("FAIL")) return <AlertCircle className="h-4 w-4" />;
        if (action.includes("CREATE")) return <Plus className="h-4 w-4" />;
        if (action.includes("UPDATE")) return <Edit className="h-4 w-4" />;
        if (action.includes("DELETE")) return <Trash2 className="h-4 w-4" />;
        return <CheckCircle className="h-4 w-4" />;
    };

    const getActionBadge = (action: string) => {
        if (action.includes("ERROR") || action.includes("FAIL")) {
            return (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border border-red-200">
                    {getActionIcon(action)} <span className="ml-1">{action}</span>
                </Badge>
            );
        }
        if (action.includes("CREATE")) {
            return (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                    {getActionIcon(action)} <span className="ml-1">{action}</span>
                </Badge>
            );
        }
        if (action.includes("UPDATE")) {
            return (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200">
                    {getActionIcon(action)} <span className="ml-1">{action}</span>
                </Badge>
            );
        }
        if (action.includes("DELETE")) {
            return (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border border-red-200">
                    {getActionIcon(action)} <span className="ml-1">{action}</span>
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600">
                {getActionIcon(action)} <span className="ml-1">{action}</span>
            </Badge>
        );
    };

    const renderDetails = (details: any) => {
        if (!details) return <span className="text-slate-400">-</span>;

        if (details.itemName && details.quantity) {
            return (
                <span className="text-sm">
                    {details.quantity} × <strong>{details.itemName}</strong>
                </span>
            );
        }
        if (details.eventName) {
            return <span className="text-sm">Event: <strong>{details.eventName}</strong></span>;
        }
        if (details.field && (details.oldValue || details.newValue)) {
            return (
                <span className="text-sm">
                    <strong>{details.field}</strong>:
                    <span className="line-through text-slate-400 mx-1">{details.oldValue || "empty"}</span>
                    → <span className="text-indigo-600 font-medium">{details.newValue}</span>
                </span>
            );
        }

        const str = JSON.stringify(details);
        return (
            <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                {str.substring(0, 60)}{str.length > 60 ? "..." : ""}
            </code>
        );
    };

    return (
        <div className="container mx-auto p-6 md:p-10 max-w-[1600px] space-y-10">
            <PageHeader
                title="System Logs"
                description="Real-time activity log of all system actions and events."
                actions={
                    <Button
                        id="btn-log-refresh"
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="rounded-lg"
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                        Refresh
                    </Button>
                }
            />

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        id="input-log-search"
                        placeholder="Search logs by user, action, or details..."
                        className="pl-9 h-11 rounded-lg bg-white border-slate-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger id="select-log-filter" className="w-full md:w-[180px] h-11 rounded-lg border-slate-200">
                        <SelectValue placeholder="Filter by Action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Actions</SelectItem>
                        <SelectItem value="CREATE">Creates</SelectItem>
                        <SelectItem value="UPDATE">Updates</SelectItem>
                        <SelectItem value="DELETE">Deletes</SelectItem>
                        <SelectItem value="ERROR">Errors</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Auto-refreshes every 10s
                </span>
                <span>•</span>
                <span><strong className="text-slate-700">{filteredLogs.length}</strong> logs</span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                            <TableHead className="h-14 font-semibold text-slate-700 w-[180px] pl-6">Timestamp</TableHead>
                            <TableHead className="h-14 font-semibold text-slate-700 w-[200px]">User</TableHead>
                            <TableHead className="h-14 font-semibold text-slate-700 w-[150px]">Action</TableHead>
                            <TableHead className="h-14 font-semibold text-slate-700 pl-6">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                            <ScrollText className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="font-semibold text-slate-700">No logs found</p>
                                        <p className="text-sm text-slate-400">System activity will appear here</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLogs.slice(0, 100).map((log, idx) => (
                                <TableRow
                                    key={log.id}
                                    className={cn(
                                        "border-b border-slate-100 transition-colors hover:bg-slate-50",
                                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                                    )}
                                >
                                    <TableCell className="py-5 pl-6">
                                        <div>
                                            <p className="font-medium text-slate-900 text-sm">{format(new Date(log.timestamp), "MMM d, yyyy")}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{format(new Date(log.timestamp), "h:mm:ss a")}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                                                {log.userName?.charAt(0).toUpperCase() || "?"}
                                            </div>
                                            <span className="font-medium text-slate-800 text-sm">{log.userName || "System"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">{getActionBadge(log.action)}</TableCell>
                                    <TableCell className="py-5 pl-6">{renderDetails(log.details)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {filteredLogs.length > 100 && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center text-sm text-slate-500">
                        Showing first 100 of {filteredLogs.length} logs
                    </div>
                )}
            </div>
        </div>
    );
}
