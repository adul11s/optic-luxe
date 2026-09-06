"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Package,
  Truck,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, StatCard, Table, TableColumn } from "@/components/ui";
import { authGet } from "@/lib/api";
import type { ApiResponse } from "@/lib/api";
import { formatPrice, formatOrderStatus, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-provider";
import Link from "next/link";
import type { Order, DashboardStats } from "@/types";

export const dynamic = "force-dynamic";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => authGet<ApiResponse<DashboardStats>>("/dashboard"),
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["orders", "recent"],
    queryFn: () => authGet<ApiResponse<Order[]>>("/orders", { params: { limit: 5 } }),
  });

  const data = stats?.data;
  const orders = recentOrders?.data || [];

  const orderColumns: TableColumn<Order>[] = [
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
      key: "totalAmount",
      header: "Total",
      render: (order) => formatPrice(order.totalAmount),
    },
    {
      key: "status",
      header: "Status",
      render: (order) => (
        <Badge
          variant={
            order.status === "COMPLETED"
              ? "success"
              : order.status === "CANCELLED"
              ? "danger"
              : order.status === "PENDING"
              ? "warning"
              : "default"
          }
          dot
        >
          {formatOrderStatus(order.status)}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (order) => formatDate(order.createdAt),
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
        <h1 className="text-2xl font-serif font-semibold text-brand-950">Admin Dashboard</h1>
        <p className="text-brand-600">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatPrice(data?.totalRevenue || 0)}
          icon={<DollarSign className="w-6 h-6" />}
          trend={{ value: 12.5, label: "vs last month" }}
        />
        <StatCard
          title="Total Orders"
          value={data?.totalOrders || 0}
          icon={<ShoppingCart className="w-6 h-6" />}
          trend={{ value: 8.2, label: "vs last month" }}
        />
        <StatCard
          title="Products"
          value={data?.totalProducts || 0}
          icon={<Package className="w-6 h-6" />}
        />
        <StatCard
          title="Users"
          value={data?.totalUsers || 0}
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Pending Orders"
          value={data?.pendingOrders || 0}
          icon={<Clock className="w-6 h-6" />}
          className="border-amber-200 bg-amber-50/50"
        />
        <StatCard
          title="Low Stock Alerts"
          value={data?.lowStockAlerts || 0}
          icon={<AlertCircle className="w-6 h-6" />}
          className="border-red-200 bg-red-50/50"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table columns={orderColumns} data={orders} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StaffDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => authGet<ApiResponse<DashboardStats>>("/dashboard"),
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["orders", "recent"],
    queryFn: () => authGet<ApiResponse<Order[]>>("/orders", { params: { limit: 5 } }),
  });

  const data = stats?.data;
  const orders = recentOrders?.data || [];

  const orderColumns: TableColumn<Order>[] = [
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
      key: "status",
      header: "Status",
      render: (order) => (
        <Badge
          variant={
            order.status === "COMPLETED"
              ? "success"
              : order.status === "PENDING"
              ? "warning"
              : "default"
          }
          dot
        >
          {formatOrderStatus(order.status)}
        </Badge>
      ),
    },
    {
      key: "totalAmount",
      header: "Total",
      render: (order) => formatPrice(order.totalAmount),
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
        <h1 className="text-2xl font-serif font-semibold text-brand-950">Staff Dashboard</h1>
        <p className="text-brand-600">Here's your work overview for today.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Pending Orders"
          value={data?.pendingOrders || 0}
          icon={<ShoppingCart className="w-6 h-6" />}
          className="border-amber-200 bg-amber-50/50"
        />
        <StatCard
          title="In Processing"
          value={3}
          icon={<Package className="w-6 h-6" />}
        />
        <StatCard
          title="Shipped Today"
          value={5}
          icon={<Truck className="w-6 h-6" />}
        />
        <StatCard
          title="Low Stock"
          value={data?.lowStockAlerts || 0}
          icon={<AlertCircle className="w-6 h-6" />}
          className="border-red-200 bg-red-50/50"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table columns={orderColumns} data={orders} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CustomerDashboard() {
  const { data: ordersData } = useQuery({
    queryKey: ["orders", "my"],
    queryFn: () => authGet<ApiResponse<Order[]>>("/orders"),
  });

  const orders = ordersData?.data || [];
  const activeOrders = orders.filter((o: Order) => !["COMPLETED", "CANCELLED"].includes(o.status));

  const orderColumns: TableColumn<Order>[] = [
    {
      key: "orderNumber",
      header: "Order",
      render: (order) => order.orderNumber,
    },
    {
      key: "totalAmount",
      header: "Total",
      render: (order) => formatPrice(order.totalAmount),
    },
    {
      key: "status",
      header: "Status",
      render: (order) => (
        <Badge
          variant={
            order.status === "COMPLETED"
              ? "success"
              : order.status === "CANCELLED"
              ? "danger"
              : order.status === "PENDING"
              ? "warning"
              : "info"
          }
          dot
        >
          {formatOrderStatus(order.status)}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (order) => formatDate(order.createdAt),
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
        <h1 className="text-2xl font-serif font-semibold text-brand-950">My Account</h1>
        <p className="text-brand-600">Welcome back! Here are your recent activities.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-950">{ordersData?.meta?.total || 0}</p>
          <p className="text-sm text-brand-500">Total Orders</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-950">{activeOrders.length}</p>
          <p className="text-sm text-brand-500">Active Orders</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-950">
            {formatPrice(orders.reduce((sum: number, o: Order) => sum + o.totalAmount, 0))}
          </p>
          <p className="text-sm text-brand-500">Total Spent</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table columns={orderColumns} data={orders.slice(0, 5)} emptyMessage="No orders yet" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "ADMIN":
      return <AdminDashboard />;
    case "STAFF":
      return <StaffDashboard />;
    default:
      return <CustomerDashboard />;
  }
}