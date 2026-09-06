"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  className?: string;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function Table<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  className,
  emptyMessage = "No data available",
  isLoading = false,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("bg-brand-100 rounded-2xl border border-brand-100 overflow-hidden", className)}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-brand-50 border-b border-brand-100">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-6 py-4 text-left text-xs font-semibold text-brand-600 uppercase tracking-wider",
                      column.className
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-brand-100 rounded-2xl border border-brand-100 p-12 text-center">
        <p className="text-brand-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("bg-brand-100 rounded-2xl border border-brand-100 overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-50 border-b border-brand-100">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-6 py-4 text-left text-xs font-semibold text-brand-600 uppercase tracking-wider",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {data.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "transition-colors hover:bg-brand-50",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-6 py-4 text-sm text-brand-950", column.className)}
                  >
                    {column.render
                      ? column.render(row)
                      : (row as Record<string, unknown>)[column.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}