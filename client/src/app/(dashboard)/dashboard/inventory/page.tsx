"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, AlertTriangle, Package, Check, Edit2 } from "lucide-react";
import { Button, Card, Badge, Input, Select, Modal, ModalHeader, ModalBody, ModalFooter, Table, TableColumn, Pagination } from "@/components/ui";
import { authGet, authPut } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types";

export const dynamic = "force-dynamic";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface VariantWithProduct extends ProductVariant {
  product?: Product;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [editingVariant, setEditingVariant] = useState<VariantWithProduct | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", "inventory"],
    queryFn: () => authGet<{ data: Product[] }>("/products", { params: { limit: 100 } }),
  });

  const updateStock = useMutation({
    mutationFn: ({ variantId, stockQty }: { variantId: string; stockQty: number }) =>
      authPut(`/products/variants/${variantId}`, { stockQty }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditingVariant(null);
    },
  });

  const products = (productsData?.data || []) as Product[];
  
  const allVariants: VariantWithProduct[] = products.flatMap((product) =>
    (product.variants || []).map((variant) => ({ ...variant, product }))
  );

  const filteredVariants = allVariants.filter((variant) => {
    const matchesSearch = variant.product?.name.toLowerCase().includes(search.toLowerCase()) ||
      variant.sku.toLowerCase().includes(search.toLowerCase());
    
    const matchesStock = stockFilter === "all" ||
      (stockFilter === "low" && variant.stockQty > 0 && variant.stockQty <= variant.minStockQty) ||
      (stockFilter === "out" && variant.stockQty === 0);
    
    return matchesSearch && matchesStock;
  });

  const lowStockCount = allVariants.filter((v) => v.stockQty > 0 && v.stockQty <= v.minStockQty).length;
  const outOfStockCount = allVariants.filter((v) => v.stockQty === 0).length;

  const totalPages = Math.ceil(filteredVariants.length / limit);
  const paginatedVariants = filteredVariants.slice((page - 1) * limit, page * limit);

  const columns: TableColumn<VariantWithProduct>[] = [
    {
      key: "product",
      header: "Product",
      render: (variant) => (
        <div>
          <p className="font-medium text-brand-950">{variant.product?.name}</p>
          <p className="text-xs text-brand-500">{variant.product?.brand}</p>
        </div>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      render: (variant) => (
        <span className="font-mono text-sm text-brand-600">{variant.sku}</span>
      ),
    },
    {
      key: "variant",
      header: "Variant",
      render: (variant) => (
        <div className="flex items-center gap-2">
          {variant.colorHex && (
            <span
              className="w-4 h-4 rounded-full border border-brand-200"
              style={{ backgroundColor: variant.colorHex }}
            />
          )}
          <span className="text-sm text-brand-700">
            {variant.colorName || variant.sizeLabel || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "stockQty",
      header: "Stock",
      render: (variant) => {
        const isLow = variant.stockQty > 0 && variant.stockQty <= variant.minStockQty;
        const isOut = variant.stockQty === 0;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-brand-950"}`}>
              {variant.stockQty}
            </span>
            {isOut && <Badge variant="danger" size="sm">Out</Badge>}
            {isLow && <Badge variant="warning" size="sm">Low</Badge>}
          </div>
        );
      },
    },
    {
      key: "minStockQty",
      header: "Min Stock",
      render: (variant) => variant.minStockQty,
    },
    {
      key: "actions",
      header: "",
      render: (variant) => (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Edit2 className="w-4 h-4" />}
          onClick={() => {
            setEditingVariant(variant);
            setNewStock(variant.stockQty);
          }}
        >
          Edit
        </Button>
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
        <h1 className="text-2xl font-serif font-semibold text-brand-950">Inventory</h1>
        <p className="text-brand-600">Manage product stock and availability</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-brand-950">{lowStockCount}</p>
            <p className="text-sm text-brand-500">Low Stock</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-xl text-red-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-brand-950">{outOfStockCount}</p>
            <p className="text-sm text-brand-500">Out of Stock</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl text-green-600">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-brand-950">
              {allVariants.length - lowStockCount - outOfStockCount}
            </p>
            <p className="text-sm text-brand-500">In Stock</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="w-full sm:w-2/3">
            <Input
              placeholder="Search by product name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="h-12 w-full"
            />
          </div>
          <div className="w-full sm:w-1/3">
            <Select
              options={[
                { value: "all", label: "All Stock Status" },
                { value: "low", label: "Low Stock" },
                { value: "out", label: "Out of Stock" },
              ]}
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as "all" | "low" | "out")}
              className="w-full h-12"
            />
          </div>
        </div>

        <Table columns={columns} data={paginatedVariants} isLoading={isLoading} emptyMessage="No variants found" />
      </Card>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={!!editingVariant} onClose={() => setEditingVariant(null)}>
        <ModalHeader>
          <h2 className="text-lg font-semibold">Update Stock</h2>
        </ModalHeader>
        <ModalBody>
          {editingVariant && (
            <div className="space-y-4">
              <div>
                <p className="font-medium text-brand-950">{editingVariant.product?.name}</p>
                <p className="text-sm text-brand-500">
                  {editingVariant.sku} - {editingVariant.colorName || editingVariant.sizeLabel}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">New Stock Quantity</label>
                <Input
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setEditingVariant(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (editingVariant) {
                updateStock.mutate({ variantId: editingVariant.id, stockQty: newStock });
              }
            }}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </Modal>
    </motion.div>
  );
}