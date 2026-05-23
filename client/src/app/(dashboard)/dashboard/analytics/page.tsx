"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Calendar,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, StatCard, Badge } from "@/components/ui";
import { authGet } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { AnalyticsData } from "@/types";

export const dynamic = "force-dynamic";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AnalyticsPage() {
  const { data: analyticsResponse } = useQuery({
    queryKey: ["dashboard", "analytics"],
    queryFn: () => authGet<{ data: AnalyticsData }>("/dashboard/analytics"),
  });

  const data = analyticsResponse?.data as AnalyticsData | undefined;

  const monthlyRevenue = data?.monthlyRevenue || [];
  const maxRevenue = monthlyRevenue.length > 0 ? Math.max(...monthlyRevenue.map((m) => m.revenue), 1) : 1;

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatPrice(125000000)}
          icon={<DollarSign className="w-6 h-6" />}
          trend={{ value: 12.5, label: "vs last month" }}
        />
        <StatCard
          title="Total Orders"
          value={342}
          icon={<ShoppingBag className="w-6 h-6" />}
          trend={{ value: 8.2, label: "vs last month" }}
        />
        <StatCard
          title="Total Users"
          value={158}
          icon={<Users className="w-6 h-6" />}
          trend={{ value: 5.1, label: "vs last month" }}
        />
        <StatCard
          title="Avg. Order Value"
          value={formatPrice(365000)}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: 3.2, label: "vs last month" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {monthlyRevenue.map((month, index) => (
                <motion.div
                  key={month.month}
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0, height: 0 },
                    visible: { opacity: 1, height: "100%", transition: { delay: index * 0.1 } },
                  }}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className="w-full bg-accent-gold/20 rounded-t-lg relative"
                    style={{ height: `${(month.revenue / maxRevenue) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-accent-gold rounded-t-lg transition-all hover:bg-accent-gold/40" />
                  </div>
                  <span className="text-xs text-brand-500 mt-2">{month.month}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.ordersByStatus?.map((status) => {
                const total = data?.ordersByStatus?.reduce((sum, s) => sum + s.count, 0) || 1;
                const percentage = ((status.count / total) * 100).toFixed(1);
                return (
                  <div key={status.status} className="flex items-center justify-between">
                    <Badge variant="default">{status.status}</Badge>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-brand-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-950 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-brand-950 w-16 text-right">
                        {status.count} ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              }) || (
                <>
                  {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED"].map((status, i) => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge variant="default">{status}</Badge>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-brand-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-950 rounded-full"
                            style={{ width: `${[15, 20, 25, 20, 20][i]}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-brand-950 w-16 text-right">
                          {[45, 68, 85, 58, 86][i]}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {data?.topProducts?.map((product, index) => (
              <div key={product.id} className="text-center">
                <div className="w-16 h-16 bg-brand-100 rounded-xl mx-auto mb-2 overflow-hidden">
                  {product.images?.[0] && (
                    <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="font-medium text-brand-950 text-sm line-clamp-1">{product.name}</p>
                <p className="text-xs text-brand-500">{product.brand}</p>
              </div>
            )) || (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="text-center">
                    <div className="w-16 h-16 bg-brand-100 rounded-xl mx-auto mb-2" />
                    <p className="font-medium text-brand-950 text-sm">Product {i}</p>
                    <p className="text-xs text-brand-500">Brand</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}