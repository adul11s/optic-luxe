"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Filter, CreditCard } from "lucide-react";
import { Card, Badge, Input, Select, Pagination, Table, TableColumn } from "@/components/ui";
import { authGet } from "@/lib/api";
import type { PaginatedResponse } from "@/lib/api";
import { formatPrice, formatDate, formatPaymentStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

interface Payment {
  id: string;
  orderId: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  createdAt: string;
  order?: {
    orderNumber: string;
    user?: { name: string; email: string };
  };
}

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 10;

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["payments", page, statusFilter],
    queryFn: () =>
      authGet<PaginatedResponse<Payment>>("/payments", {
        params: { page, limit, status: statusFilter || undefined },
      }),
  });

  const payments = paymentsData?.data || [];
  const pagination = paymentsData?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };

  const columns: TableColumn<Payment>[] = [
    {
      key: "order",
      header: "Order",
      render: (payment) => (
        <div>
          <p className="font-medium text-brand-950">{payment.order?.orderNumber || "-"}</p>
          <p className="text-xs text-brand-500">{payment.order?.user?.name}</p>
        </div>
      ),
    },
    {
      key: "paymentMethod",
      header: "Method",
      render: (payment) => (
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-brand-500" />
          <span className="text-sm">{payment.paymentMethod.replace("_", " ")}</span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (payment) => (
        <span className="font-semibold text-brand-950">{formatPrice(payment.amount)}</span>
      ),
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (payment) => {
        const variants: Record<string, "default" | "success" | "warning" | "danger"> = {
          PENDING: "warning",
          VERIFIED: "success",
          FAILED: "danger",
          REFUNDED: "danger",
        };
        return (
          <Badge variant={variants[payment.paymentStatus] || "default"} dot>
            {formatPaymentStatus(payment.paymentStatus)}
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      header: "Date",
      render: (payment) => formatDate(payment.createdAt),
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
        <h1 className="text-2xl font-serif font-semibold text-brand-950">Payments</h1>
        <p className="text-brand-600">Track and manage all payments</p>
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

        <Table columns={columns} data={payments} isLoading={isLoading} emptyMessage="No payments found" />
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
