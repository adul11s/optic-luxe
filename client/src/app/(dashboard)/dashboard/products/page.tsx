"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Plus, Edit2, Trash2, Image as ImageIcon } from "lucide-react";
import { Button, Card, Badge, Input, Select, Pagination, Table, TableColumn, Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import { authGet, authDelete } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Product, Category } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const limit = 10;

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", page, categoryFilter, search],
    queryFn: () =>
      authGet<{ data: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>("/products", {
        params: { page, limit, search: search || undefined, categoryId: categoryFilter || undefined },
      }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => authGet<{ data: Category[] }>("/categories"),
  });

  const deleteProduct = useMutation({
    mutationFn: (productId: string) => authDelete(`/products/${productId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const products = (productsData?.data?.data || []) as Product[];
  const pagination = productsData?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
  const categories = (categoriesData?.data?.data || []) as Category[];

  const columns: TableColumn<Product>[] = [
    {
      key: "images",
      header: "",
      render: (product) => (
        <div className="w-12 h-12 bg-brand-100 rounded-lg overflow-hidden">
          {product.images?.[0] ? (
            <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brand-300">
              <ImageIcon className="w-5 h-5" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Product",
      render: (product) => (
        <div>
          <p className="font-medium text-brand-950 line-clamp-1">{product.name}</p>
          <p className="text-xs text-brand-500">{product.brand}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (product) => product.category?.name || "-",
    },
    {
      key: "price",
      header: "Price",
      render: (product) => (
        <div>
          {product.discountPrice ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-brand-950">{formatPrice(product.discountPrice)}</span>
              <span className="text-sm text-brand-400 line-through">{formatPrice(product.basePrice)}</span>
            </div>
          ) : (
            <span className="font-semibold text-brand-950">{formatPrice(product.basePrice)}</span>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      render: (product) => {
        const totalStock = product.variants?.reduce((sum, v) => sum + v.stockQty, 0) || 0;
        return totalStock;
      },
    },
    {
      key: "badges",
      header: "Status",
      render: (product) => (
        <div className="flex gap-1">
          {product.isFeatured && <Badge variant="warning" size="sm">Featured</Badge>}
          {product.isNewArrival && <Badge variant="info" size="sm">New</Badge>}
          {product.isBestSeller && <Badge variant="success" size="sm">Best</Badge>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (product) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
            className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this product?")) {
                deleteProduct.mutate(product.id);
              }
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-brand-950">Products</h1>
          <p className="text-brand-600">Manage your product catalog</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => router.push("/dashboard/products/new")}>
          Add Product
        </Button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            options={[{ value: "", label: "All Categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-48"
          />
        </div>

        <Table columns={columns} data={products} isLoading={isLoading} emptyMessage="No products found" />
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