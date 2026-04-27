"use client";
"use no memo";

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { exportToCSV, cn } from "@/lib/utils";
import { LeadDetailsSheet, type LeadStatus } from "./LeadDetailsSheet";
interface Lead {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  lastMessage: string;
  transcript: Array<{ text: string; sender: "user" | "bot" }>;
  status: LeadStatus;
  createdAt: string;
  botId?: { _id: string; name: string };
}

interface LeadsTableProps {
  data: Lead[];
}

export function LeadsTable({ data }: LeadsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const highlightText = (text: string | undefined, highlight: string) => {
    if (!text) return "N/A";
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-blue-100 text-blue-700 font-bold px-0 rounded-sm">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent font-semibold"
          >
            Name
            {column.getIsSorted() === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === "desc" ? <ChevronDown className="ml-2 h-4 w-4" /> : null}
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium">{highlightText(row.getValue("name"), globalFilter)}</div>,
    },
    {
      id: "contact",
      header: "Contact Info",
      cell: ({ row }) => {
        const phone = row.original.phone;
        const email = row.original.email;
        return (
          <div className="flex flex-col text-sm text-slate-500">
            {email && <span>{highlightText(email, globalFilter)}</span>}
            {phone && <span>{highlightText(phone, globalFilter)}</span>}
            {!email && !phone && <span className="text-slate-300">N/A</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "botId.name",
      id: "bot",
      header: "Source Bot",
      cell: ({ row }) => {
        const botName = row.original.botId?.name || "Unknown Agent";
        return <div className="text-sm">{highlightText(botName, globalFilter)}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const variants: Record<string, string> = {
          new: "bg-blue-100 text-blue-700 border-blue-200",
          contacted: "bg-amber-100 text-amber-700 border-amber-200",
          qualified: "bg-indigo-100 text-indigo-700 border-indigo-200",
          closed: "bg-emerald-100 text-emerald-700 border-emerald-200",
          resolved: "bg-slate-100 text-slate-700 border-slate-200",
        };
        return (
          <Badge className={cn("uppercase text-[10px] font-bold border", variants[status] || "bg-slate-100")}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Follow Up",
      cell: ({ row }) => {
        const phone = row.original.phone;
        if (!phone) return null;
        return (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 text-brand hover:text-brand-dark hover:bg-brand/10"
            onClick={(e) => {
                e.stopPropagation();
                const cleanPhone = phone.replace(/\D/g, "");
                window.open(`https://wa.me/${cleanPhone}`, "_blank");
            }}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent font-semibold"
          >
            Date
             {column.getIsSorted() === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === "desc" ? <ChevronDown className="ml-2 h-4 w-4" /> : null}
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="text-sm text-slate-500">{new Date(row.getValue("createdAt")).toLocaleDateString()}</div>;
      },
    },
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  const handleExportCSV = () => {
    const exportData = table.getFilteredRowModel().rows.map(row => {
        return {
            Name: row.original.name || "Unknown",
            Email: row.original.email || "",
            Phone: row.original.phone || "",
            Bot: row.original.botId?.name || "Unknown Agent",
            Status: row.original.status,
            Date: new Date(row.original.createdAt).toLocaleString(),
        }
    });
    exportToCSV(exportData, "HeyPixi_Leads");
  };

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 w-full max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search all columns..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-brand focus-visible:border-brand"
          />
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2 font-medium">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-slate-600 font-semibold h-12">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => setSelectedLead(row.original)}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                  No leads found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>

      {/* Slide-over Detail Panel */}
      <LeadDetailsSheet
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </div>
  );
}
