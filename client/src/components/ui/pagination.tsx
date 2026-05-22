"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 2
  );

  const renderPageButton = (page: number) => {
    const isActive = page === currentPage;
    return (
      <button
        key={page}
        onClick={() => onPageChange(page)}
        className={cn(
          "w-10 h-10 rounded-full text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-brand-950 text-white"
            : "text-brand-600 hover:bg-brand-100"
        )}
      >
        {page}
      </button>
    );
  };

  const renderEllipsis = (key: string) => (
    <span key={key} className="px-2 text-brand-400">
      ...
    </span>
  );

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-full text-brand-600 hover:bg-brand-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {visiblePages.map((page, index) => (
        <>
          {index > 0 && visiblePages[index - 1] !== page - 1 && renderEllipsis(`ellipsis-${page}`)}
          {renderPageButton(page)}
        </>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-full text-brand-600 hover:bg-brand-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}