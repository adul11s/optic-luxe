"use client";

import { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { SlidersHorizontal, X, Grid, List } from "lucide-react";
import { Button, Card, Badge, Input, Select, Pagination, ProductSkeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Product, Category, FilterOptions } from "@/types";

export const dynamic = "force-dynamic";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function ShopContent() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  const [filters, setFilters] = useState({
    search: searchParams?.get("search") || "",
    gender: searchParams?.get("gender") || "",
    category: searchParams?.get("category") || "",
    shape: searchParams?.get("shape") || "",
    material: searchParams?.get("material") || "",
    minPrice: searchParams?.get("minPrice") || "",
    maxPrice: searchParams?.get("maxPrice") || "",
    sort: searchParams?.get("sort") || "newest",
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", page, filters],
    queryFn: () =>
      api.get<{ data: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>("/products", {
        params: {
          page,
          limit,
          search: filters.search || undefined,
          gender: filters.gender || undefined,
          categoryId: filters.category || undefined,
          frameShape: filters.shape || undefined,
          material: filters.material || undefined,
          minPrice: filters.minPrice || undefined,
          maxPrice: filters.maxPrice || undefined,
          sort: filters.sort,
        },
      }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ data: Category[] }>("/categories"),
  });

  const { data: filterOptions } = useQuery({
    queryKey: ["products", "filters"],
    queryFn: () => api.get<FilterOptions>("/products/filters"),
  });

  const categories = (categoriesData?.data?.data || []) as Category[];
  const products = (productsData?.data?.data || []) as Product[];
  const pagination = productsData?.data?.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 };

  const genderOptions = (filterOptions?.data?.genders || []) as FilterOptions["genders"];
  const shapeOptions = (filterOptions?.data?.shapes || []) as FilterOptions["shapes"];
  const materialOptions = (filterOptions?.data?.materials || []) as FilterOptions["materials"];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "popular", label: "Most Popular" },
  ];

  const activeFiltersCount = Object.values(filters).filter(Boolean).length - 1;

  const clearFilters = () => {
    setFilters({
      search: "",
      gender: "",
      category: "",
      shape: "",
      material: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    });
    setPage(1);
  };

  const applyFilters = () => {
    setIsFilterOpen(false);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-brand-50">
      <div className="container-wide py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-semibold text-brand-950">Shop All Frames</h1>
            <p className="text-brand-600 mt-1">{pagination.total} products</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-brand-950 text-white" : "text-brand-600 hover:bg-brand-100"}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-brand-950 text-white" : "text-brand-600 hover:bg-brand-100"}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            <Select
              options={sortOptions}
              value={filters.sort}
              onChange={(e) => {
                setFilters({ ...filters, sort: e.target.value });
                setPage(1);
              }}
              className="w-40"
            />

            <Button
              variant="outline"
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="relative"
            >
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-gold text-brand-950 text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-brand-600">Active filters:</span>
            {filters.gender && (
              <Badge
                variant="default"
                onClick={() => setFilters({ ...filters, gender: "" })}
              >
                {filters.gender} <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.category && (
              <Badge
                variant="default"
                onClick={() => setFilters({ ...filters, category: "" })}
              >
                {categories.find((c) => c.id === filters.category)?.name} <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.shape && (
              <Badge
                variant="default"
                onClick={() => setFilters({ ...filters, shape: "" })}
              >
                {filters.shape} <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.material && (
              <Badge
                variant="default"
                onClick={() => setFilters({ ...filters, material: "" })}
              >
                {filters.material} <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            <button onClick={clearFilters} className="text-sm text-brand-500 hover:text-brand-700">
              Clear all
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className={`lg:block ${isFilterOpen ? "block" : "hidden"}`}>
            <Card className="sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-brand-950">Filters</h3>
                <button onClick={clearFilters} className="text-sm text-brand-500 hover:text-brand-700">
                  Clear all
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">Search</label>
                  <Input
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">Category</label>
                  <Select
                    options={[{ value: "", label: "All Categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">Gender</label>
                  <div className="space-y-2">
                    {genderOptions.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value={option.value}
                          checked={filters.gender === option.value}
                          onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                          className="w-4 h-4 text-brand-950 border-brand-300 focus:ring-brand-950"
                        />
                        <span className="text-sm text-brand-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">Frame Shape</label>
                  <div className="space-y-2">
                    {shapeOptions.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="shape"
                          value={option.value}
                          checked={filters.shape === option.value}
                          onChange={(e) => setFilters({ ...filters, shape: e.target.value })}
                          className="w-4 h-4 text-brand-950 border-brand-300 focus:ring-brand-950"
                        />
                        <span className="text-sm text-brand-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">Material</label>
                  <div className="space-y-2">
                    {materialOptions.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="material"
                          value={option.value}
                          checked={filters.material === option.value}
                          onChange={(e) => setFilters({ ...filters, material: e.target.value })}
                          className="w-4 h-4 text-brand-950 border-brand-300 focus:ring-brand-950"
                        />
                        <span className="text-sm text-brand-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">Price Range</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      className="w-full"
                    />
                    <span className="text-brand-400">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>

                <Button onClick={applyFilters} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </Card>
          </aside>

          <main className="lg:col-span-3">
            {isLoading ? (
              <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6" : "space-y-4"}>
                {Array.from({ length: limit }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <Card className="text-center py-12">
                <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-brand-950 mb-2">No products found</h3>
                <p className="text-brand-500 mb-4">Try adjusting your filters or search terms</p>
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              </Card>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6" : "space-y-4"}
              >
                {products.map((product) => (
                  <motion.div key={product.id} variants={fadeInUp}>
                    <ProductCard product={product} viewMode={viewMode} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {pagination.totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, viewMode }: { product: Product; viewMode: "grid" | "list" }) {
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

  if (viewMode === "list") {
    return (
      <Link href={`/product/${product.slug}`}>
        <Card hover className="flex gap-4 overflow-hidden group">
          <div className="relative w-40 h-40 flex-shrink-0 bg-brand-100 overflow-hidden">
            {primaryImage && (
              <img
                src={primaryImage.url}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
          </div>
          <div className="flex flex-col justify-center flex-1 p-4">
            <p className="text-xs text-brand-500 uppercase tracking-wider mb-1">{product.brand}</p>
            <h3 className="font-semibold text-brand-950 mb-2">{product.name}</h3>
            <p className="text-sm text-brand-600 line-clamp-2 mb-4">{product.description}</p>
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-brand-950">
                {formatPrice(product.discountPrice || product.basePrice)}
              </span>
              {product.discountPrice && (
                <span className="text-sm text-brand-400 line-through">
                  {formatPrice(product.basePrice)}
                </span>
              )}
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/product/${product.slug}`}>
      <Card hover padding="none" className="overflow-hidden group">
        <div className="relative aspect-square bg-brand-100 overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brand-300">No Image</div>
          )}
          {product.isNewArrival && <Badge className="absolute top-3 left-3" variant="info">New</Badge>}
          {product.isBestSeller && <Badge className="absolute top-3 left-3" variant="warning">Best Seller</Badge>}
          {product.discountPrice && <Badge className="absolute top-3 right-3" variant="danger">Sale</Badge>}
        </div>
        <div className="p-4">
          <p className="text-xs text-brand-500 uppercase tracking-wider mb-1">{product.brand}</p>
          <h3 className="font-medium text-brand-950 mb-2 line-clamp-1">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-brand-950">
              {formatPrice(product.discountPrice || product.basePrice)}
            </span>
            {product.discountPrice && (
              <span className="text-sm text-brand-400 line-through">{formatPrice(product.basePrice)}</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-brand-950 border-t-transparent rounded-full" /></div>}>
      <ShopContent />
    </Suspense>
  );
}