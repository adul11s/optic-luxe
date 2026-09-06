"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, StatCard, Badge } from "@/components/ui";
import { authGet } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface AnalyticsResponse {
  monthlyRevenue: number;
  topProducts: Array<{
    id: string;
    name: string;
    brand: string;
    basePrice: number;
    totalSold: number;
    images?: Array<{ url: string }>;
  }>;
  ordersByStatus: Array<{
    status: string;
    _count: number;
  }>;
}

export default function AnalyticsPage() {
  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ["dashboard", "analytics"],
    queryFn: () => authGet<{ data: AnalyticsResponse }>("/dashboard/analytics"),
  });

  const data = analyticsResponse?.data;

  const totalOrders = data?.ordersByStatus?.reduce((sum, s) => sum + s._count, 0) || 0;
  const avgOrderValue = totalOrders > 0 ? (data?.monthlyRevenue || 0) / totalOrders : 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-serif font-semibold text-brand-950">Analytics</h1>
        <p className="text-brand-600">Overview of your store performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Monthly Revenue"
          value={formatPrice(data?.monthlyRevenue || 0)}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={<ShoppingBag className="w-6 h-6" />}
        />
        <StatCard
          title="Avg. Order Value"
          value={formatPrice(avgOrderValue)}
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.ordersByStatus?.map((status) => {
                const percentage = totalOrders > 0 ? ((status._count / totalOrders) * 100).toFixed(1) : "0";
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
                  <div key={status.status} className="flex items-center justify-between">
                    <Badge variant={variants[status.status] || "default"}>{status.status}</Badge>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-brand-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-950 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-brand-950 w-20 text-right">
                        {status._count} ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
              {(!data?.ordersByStatus || data.ordersByStatus.length === 0) && (
                <p className="text-brand-500 text-sm">No order data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.topProducts?.map((product, index) => (
                <div key={product.id} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-brand-500 w-6">{index + 1}</span>
                  <div className="w-10 h-10 bg-brand-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product.images?.[0] && (
                      <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-brand-950 text-sm truncate">{product.name}</p>
                    <p className="text-xs text-brand-500">{product.brand}</p>
                  </div>
                  <span className="text-sm font-medium text-brand-950">{product.totalSold} sold</span>
                </div>
              ))}
              {(!data?.topProducts || data.topProducts.length === 0) && (
                <p className="text-brand-500 text-sm">No product data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}