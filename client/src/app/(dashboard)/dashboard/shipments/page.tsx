"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Truck, Package } from "lucide-react";
import { Card, Badge, Select, Pagination, Table, TableColumn } from "@/components/ui";
import { authGet } from "@/lib/api";
import type { PaginatedResponse } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "PICKED_UP", label: "Picked Up" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "RETURNED", label: "Returned" },
];

interface Shipment {
  id: string;
  orderId: string;
  courier: string | null;
  trackingNumber: string | null;
  status: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  order?: {
    orderNumber: string;
    user?: { name: string; email: string };
  };
}

export default function ShipmentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 10;

  const { data: shipmentsData, isLoading } = useQuery({
    queryKey: ["shipments", page, statusFilter],
    queryFn: () =>
      authGet<PaginatedResponse<Shipment>>("/orders", {
        params: { page, limit, status: statusFilter || undefined },
      }),
  });

  const shipments = shipmentsData?.data || [];
  const pagination = shipmentsData?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };

  const columns: TableColumn<Shipment>[] = [
    {
      key: "order",
      header: "Order",
      render: (shipment) => (
        <div>
          <p className="font-medium text-brand-950">{shipment.order?.orderNumber || "-"}</p>
          <p className="text-xs text-brand-500">{shipment.order?.user?.name}</p>
        </div>
      ),
    },
    {
      key: "courier",
      header: "Courier",
      render: (shipment) => (
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-brand-500" />
          <span className="text-sm">{shipment.courier || "Not assigned"}</span>
        </div>
      ),
    },
    {
      key: "trackingNumber",
      header: "Tracking",
      render: (shipment) => (
        <span className="text-sm font-mono">{shipment.trackingNumber || "-"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (shipment) => {
        const variants: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
          PENDING: "warning",
          PICKED_UP: "info",
          IN_TRANSIT: "info",
          OUT_FOR_DELIVERY: "info",
          DELIVERED: "success",
          RETURNED: "danger",
        };
        return (
          <Badge variant={variants[shipment.status] || "default"} dot>
            {shipment.status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      header: "Date",
      render: (shipment) => formatDate(shipment.createdAt),
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
        <h1 className="text-2xl font-serif font-semibold text-brand-950">Shipments</h1>
        <p className="text-brand-600">Track and manage all shipments</p>
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

        <Table columns={columns} data={shipments} isLoading={isLoading} emptyMessage="No shipments found" />
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
