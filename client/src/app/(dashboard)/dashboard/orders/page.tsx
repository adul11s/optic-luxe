"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Eye, Search, Filter, Download, Check, X } from "lucide-react";
import { Button, Card, Badge, Input, Select, Pagination, Table, TableColumn, Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import { api } from "@/lib/api";
import { formatPrice, formatOrderStatus, formatDate, formatPaymentStatus } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "PACKED", label: "Packed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const orderStatusSteps: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "COMPLETED"];

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const limit = 10;

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders", page, statusFilter, search],
    queryFn: () =>
      api.get<{ data: Order[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>("/orders", {
        params: { page, limit, status: statusFilter || undefined, search: search || undefined },
      }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      api.put(`/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setSelectedOrder(null);
    },
  });

  const orders = ordersData?.data?.data || [];
  const pagination = ordersData?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  const columns: TableColumn<Order>[] = [
    {
      key: "orderNumber",
      header: "Order",
      render: (order) => (
        <div>
          <p className="font-medium text-brand-950">{order.orderNumber}</p>
          <p className="text-xs text-brand-500">{order.user?.name}</p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      render: (order) => `${order.items?.length || 0} item(s)`,
    },
    {
      key: "totalAmount",
      header: "Total",
      render: (order) => (
        <span className="font-semibold text-brand-950">{formatPrice(order.totalAmount)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (order) => {
        const variants: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
          PENDING: "warning",
          CONFIRMED: "info",
          PROCESSING: "info",
          PACKED: "info",
          SHIPPED: "info",
          COMPLETED: "success",
          CANCELLED: "danger",
        };
        return (
          <Badge variant={variants[order.status] || "default"} dot>
            {formatOrderStatus(order.status)}
          </Badge>
        );
      },
    },
    {
      key: "payment",
      header: "Payment",
      render: (order) => {
        const paymentStatus = order.payment?.paymentStatus;
        return (
          <Badge variant={paymentStatus === "VERIFIED" ? "success" : paymentStatus === "FAILED" ? "danger" : "warning"} dot>
            {formatPaymentStatus(paymentStatus || "PENDING")}
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      header: "Date",
      render: (order) => formatDate(order.createdAt),
    },
    {
      key: "actions",
      header: "",
      render: (order) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedOrder(order)}
            className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
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
        <h1 className="text-2xl font-serif font-semibold text-brand-950">Orders</h1>
        <p className="text-brand-600">Manage and track all orders</p>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by order number or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
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

        <Table columns={columns} data={orders} isLoading={isLoading} emptyMessage="No orders found" />
      </Card>

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}

      {selectedOrder && (
        <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} size="lg">
          <ModalHeader>
            <h2 className="text-lg font-semibold">Order {selectedOrder.orderNumber}</h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-brand-500">Customer</p>
                  <p className="font-medium text-brand-950">{selectedOrder.user?.name}</p>
                  <p className="text-sm text-brand-600">{selectedOrder.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-brand-500">Date</p>
                  <p className="font-medium text-brand-950">{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-brand-500 mb-2">Order Items</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between py-2 border-b border-brand-100">
                      <div>
                        <p className="font-medium text-brand-950">{item.product?.name}</p>
                        <p className="text-sm text-brand-500">
                          {item.variant?.colorName && `${item.variant.colorName} - `}
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-brand-950">{formatPrice(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between py-2 border-t border-brand-100">
                <div>
                  <p className="text-sm text-brand-500">Subtotal</p>
                  <p className="text-sm text-brand-500">Shipping</p>
                  {selectedOrder.discountAmount > 0 && (
                    <p className="text-sm text-brand-500">Discount</p>
                  )}
                  <p className="font-semibold text-brand-950">Total</p>
                </div>
                <div className="text-right">
                  <p className="text-brand-950">{formatPrice(selectedOrder.subtotal)}</p>
                  <p className="text-brand-950">{formatPrice(selectedOrder.shippingCost)}</p>
                  {selectedOrder.discountAmount > 0 && (
                    <p className="text-green-600">-{formatPrice(selectedOrder.discountAmount)}</p>
                  )}
                  <p className="font-semibold text-brand-950">{formatPrice(selectedOrder.totalAmount)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-brand-500 mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {orderStatusSteps.map((step) => (
                    <button
                      key={step}
                      onClick={() => updateStatus.mutate({ orderId: selectedOrder.id, status: step })}
                      disabled={step === selectedOrder.status}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        step === selectedOrder.status
                          ? "bg-brand-950 text-white"
                          : "bg-brand-100 text-brand-700 hover:bg-brand-200 disabled:opacity-50"
                      }`}
                    >
                      {formatOrderStatus(step)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
              Close
            </Button>
            <Link href={`/dashboard/orders/${selectedOrder.id}`}>
              <Button>View Details</Button>
            </Link>
          </ModalFooter>
        </Modal>
      )}
    </motion.div>
  );
}