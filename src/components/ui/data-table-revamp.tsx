"use client";

import React, { useState } from "react";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Filter,
    ArrowUpDown,
    Package,
    ChevronsLeft,
    ChevronsRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    searchKey?: keyof T;
    onRowClick?: (item: T) => void;
    title?: string;
    description?: string;
    action?: React.ReactNode;
    emptyIcon?: React.ReactNode;
    emptyTitle?: string;
    emptyDescription?: string;
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    searchKey,
    onRowClick,
    title,
    description,
    action,
    emptyIcon,
    emptyTitle = "No results found",
    emptyDescription = "Try adjusting your search terms"
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter
    const filteredData = data.filter((item) => {
        if (!searchKey) return true;
        const value = item[searchKey];
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-4">
            {/* Header / Actions Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-1">
                {(title || description) && (
                    <div>
                        {title && <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>}
                        {description && <p className="text-sm text-slate-500">{description}</p>}
                    </div>
                )}

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {searchKey && (
                        <div className="relative flex-1 sm:w-[280px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-9 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                    )}
                    {/* Filter Button */}
                    <Button variant="outline" size="icon" className="shrink-0 h-10 w-10 rounded-lg border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700">
                        <Filter className="h-4 w-4" />
                    </Button>

                    {action && <div className="ml-2">{action}</div>}
                </div>
            </div>

            {/* Table Container */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30 hover:bg-slate-50 border-b border-slate-200 dark:border-slate-700">
                            {columns.map((col, idx) => (
                                <TableHead
                                    key={idx}
                                    className={cn(
                                        "h-12 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400",
                                        col.className
                                    )}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {col.header}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item, rowIdx) => (
                                <TableRow
                                    key={rowIdx}
                                    className={cn(
                                        "border-b border-slate-100 dark:border-slate-800 transition-all duration-150",
                                        "hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-violet-50/30 dark:hover:from-slate-800/80 dark:hover:to-slate-800/50",
                                        rowIdx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/30 dark:bg-slate-900/50",
                                        onRowClick && "cursor-pointer"
                                    )}
                                    onClick={() => onRowClick && onRowClick(item)}
                                >
                                    {columns.map((col, colIdx) => (
                                        <TableCell
                                            key={colIdx}
                                            className={cn(
                                                "py-4 px-4 text-sm text-slate-700 dark:text-slate-300",
                                                col.className
                                            )}
                                        >
                                            {col.cell ? col.cell(item) : item[col.accessorKey as string]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                        <div className="h-16 w-16 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                                            {emptyIcon || <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />}
                                        </div>
                                        <p className="font-semibold text-slate-700 dark:text-slate-300">{emptyTitle}</p>
                                        <p className="text-sm mt-1 text-slate-400">{emptyDescription}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-1">
                    <p className="text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{startIndex + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> of <span className="font-semibold text-slate-700">{filteredData.length}</span>
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="h-9 w-9 p-0 rounded-lg border-slate-200"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="h-9 w-9 p-0 rounded-lg border-slate-200"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1 mx-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={cn(
                                            "h-9 w-9 p-0 rounded-lg text-sm font-medium",
                                            currentPage === pageNum
                                                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                                                : "text-slate-600 hover:bg-slate-100"
                                        )}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="h-9 w-9 p-0 rounded-lg border-slate-200"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="h-9 w-9 p-0 rounded-lg border-slate-200"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
