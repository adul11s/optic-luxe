"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, Search } from "lucide-react";
import { Card, Badge, Table, TableColumn, Input, Pagination } from "@/components/ui";
import { authGet } from "@/lib/api";
import type { PaginatedResponse } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  _count?: { products: number };
}

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["categories", page],
    queryFn: () => authGet<PaginatedResponse<Category>>("/categories", { params: { page, limit } }),
  });

  const categories = categoriesData?.data || [];
  const pagination = categoriesData?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };

  const filtered = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  const columns: TableColumn<Category>[] = [
    {
      key: "name",
      header: "Category",
      render: (category) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center overflow-hidden">
            {category.image ? (
              <img src={category.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <Package className="w-5 h-5 text-brand-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-brand-950">{category.name}</p>
            <p className="text-xs text-brand-500">{category.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "products",
      header: "Products",
      render: (category) => (
        <span className="text-sm font-medium text-brand-950">{category._count?.products || 0}</span>
      ),
    },
    {
      key: "sortOrder",
      header: "Sort",
      render: (category) => (
        <span className="text-sm text-brand-600">{category.sortOrder}</span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (category) => (
        <Badge variant={category.isActive ? "success" : "default"} dot>
          {category.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (category) => formatDate(category.createdAt),
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
        <h1 className="text-2xl font-serif font-semibold text-brand-950">Categories</h1>
        <p className="text-brand-600">Manage product categories</p>
      </div>

      <Card>
        <div className="mb-6">
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-12 w-full"
          />
        </div>
        <Table columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No categories found" />
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
