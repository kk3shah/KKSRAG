"use client";

import { useState, useMemo } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper,
    type SortingState,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps {
    data: Record<string, unknown>[];
}

function formatCell(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") {
        // Format with locale-aware separators
        if (Number.isInteger(value)) return value.toLocaleString();
        // Round to 2 decimal places for floats
        return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
}

const PAGE_SIZE = 25;

export function DataTable({ data }: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const columns = useMemo(() => {
        if (!data.length) return [];
        const helper = createColumnHelper<Record<string, unknown>>();
        return Object.keys(data[0]).map((key) =>
            helper.accessor((row) => row[key], {
                id: key,
                header: key,
                cell: (info) => formatCell(info.getValue()),
                sortingFn: "auto",
            })
        );
    }, [data]);

    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: { pageSize: PAGE_SIZE },
        },
    });

    if (!data.length) return null;

    const pageCount = table.getPageCount();
    const currentPage = table.getState().pagination.pageIndex;

    return (
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Raw Dataset</h4>
                </div>
                <span className="text-xs text-white/30 font-medium">
                    {data.length.toLocaleString()} row{data.length !== 1 ? "s" : ""}
                </span>
            </div>

            <div className="rounded-[2.5rem] border border-white/5 overflow-hidden bg-white/[0.02] shadow-3xl">
                <div className="overflow-x-auto max-h-[600px] scrollbar-hide">
                    <table className="w-full text-[13px] text-left">
                        <thead className="bg-white/5 text-white/40 sticky top-0 z-10 backdrop-blur-3xl">
                            <tr>
                                {table.getHeaderGroups().map(headerGroup =>
                                    headerGroup.headers.map(header => (
                                        <th
                                            key={header.id}
                                            className="px-6 py-5 font-black uppercase tracking-tighter border-b border-white/5 cursor-pointer select-none hover:text-white/60 transition-colors whitespace-nowrap"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-2">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                <span className="w-4 h-4 inline-flex items-center justify-center">
                                                    {header.column.getIsSorted() === "asc" && <ChevronUp className="w-3.5 h-3.5" />}
                                                    {header.column.getIsSorted() === "desc" && <ChevronDown className="w-3.5 h-3.5" />}
                                                </span>
                                            </div>
                                        </th>
                                    ))
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {table.getRowModel().rows.map(row => (
                                <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-6 py-5 text-white/50 group-hover:text-white transition-colors whitespace-nowrap">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pageCount > 1 && (
                    <div className="flex items-center justify-between px-8 py-4 border-t border-white/5 bg-white/[0.02]">
                        <span className="text-xs text-white/30">
                            Page {currentPage + 1} of {pageCount}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsLeft className="w-4 h-4 text-white/50" />
                            </button>
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-white/50" />
                            </button>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-white/50" />
                            </button>
                            <button
                                onClick={() => table.setPageIndex(pageCount - 1)}
                                disabled={!table.getCanNextPage()}
                                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsRight className="w-4 h-4 text-white/50" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
