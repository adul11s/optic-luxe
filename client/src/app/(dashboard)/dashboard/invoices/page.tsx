"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { Card, Badge, Select, Pagination, Table, TableColumn } from "@/components/ui";
import { authGet } from "@/lib/api";
import type { PaginatedResponse } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "ISSUED", label: "Issued" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "VOID", label: "Void" },
];

interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  issuedAt: string;
  dueDate: string | null;
  paidAt: string | null;
  order?: {
    orderNumber: string;
    user?: { name: string; email: string };
  };
}

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 10;

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["invoices", page, statusFilter],
    queryFn: () =>
      authGet<PaginatedResponse<Invoice>>("/invoices", {
        params: { page, limit, status: statusFilter || undefined },
      }),
  });

  const invoices = invoicesData?.data || [];
  const pagination = invoicesData?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };

  const columns: TableColumn<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice",
      render: (invoice) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-500" />
          <div>
            <p className="font-medium text-brand-950">{invoice.invoiceNumber}</p>
            <p className="text-xs text-brand-500">{invoice.order?.orderNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (invoice) => (
        <div>
          <p className="text-sm text-brand-950">{invoice.order?.user?.name || "-"}</p>
          <p className="text-xs text-brand-500">{invoice.order?.user?.email}</p>
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Amount",
      render: (invoice) => (
        <span className="font-semibold text-brand-950">{formatPrice(invoice.totalAmount)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (invoice) => {
        const variants: Record<string, "default" | "success" | "warning" | "danger"> = {
          ISSUED: "default",
          PAID: "success",
          OVERDUE: "danger",
          VOID: "danger",
        };
        return (
          <Badge variant={variants[invoice.status] || "default"} dot>
            {invoice.status}
          </Badge>
        );
      },
    },
    {
      key: "issuedAt",
      header: "Issued",
      render: (invoice) => formatDate(invoice.issuedAt),
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-serif font-semibold text-brand-950">Invoices</h1>
        <p className="text-brand-600">Manage all invoices</p>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-48"
          />
        </div>

        <Table columns={columns} data={invoices} isLoading={isLoading} emptyMessage="No invoices found" />
      </Card>

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </motion.div>
  );
}
