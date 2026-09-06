"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Plus, Edit2, Trash2, Image as ImageIcon } from "lucide-react";
import { Button, Card, Badge, Input, Select, Pagination, Table, TableColumn, Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import { authGet, authDelete } from "@/lib/api";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { swalConfirm, swalError, swalSuccess } from "@/lib/swal";
import type { PaginatedResponse } from "@/lib/api";
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
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", page, categoryFilter, debouncedSearch],
    queryFn: () =>
      authGet<PaginatedResponse<Product>>("/products", {
        params: { page, limit, search: debouncedSearch || undefined, categoryId: categoryFilter || undefined },
      }),
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => authGet<{ data: Category[] }>("/categories"),
  });

  const deleteProduct = useMutation({
    mutationFn: (productId: string) => authDelete(`/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      swalSuccess("Product deleted");
    },
    onError: (err: any) => {
      swalError(err?.response?.data?.message || err?.message || "Something went wrong");
    },
  });

  const products = (productsData?.data || []) as Product[];
  const pagination = productsData?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };
  const categories = (categoriesData?.data || []) as Category[];

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
            onClick={async () => {
              const ok = await swalConfirm({
                title: "Delete product?",
                text: "This action cannot be undone.",
                danger: true,
                confirmText: "Yes, delete",
              });
              if (!ok) return;
              deleteProduct.mutate(product.id);
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="w-full sm:w-2/3">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="h-12 w-full"
            />
          </div>
          <div className="w-full sm:w-1/3">
            <Select
              options={[{ value: "", label: "All Categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-12"
            />
          </div>
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