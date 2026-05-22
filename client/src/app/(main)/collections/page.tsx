"use client";
export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Category, Product } from "@/types";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function CollectionsPage() {
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ data: Category[] }>("/categories"),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => api.get<{ data: Product[] }>("/products", { params: { limit: 50 } }),
  });

  const categories = (categoriesData?.data?.data || []) as Category[];
  const products = (productsData?.data?.data || []) as Product[];

  return (
    <div className="min-h-screen bg-brand-50">
      <section className="py-20 bg-gradient-to-br from-brand-50 via-white to-brand-100">
        <div className="container-wide text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <Badge variant="outline" className="mb-4">Collections</Badge>
            <h1 className="text-5xl md:text-7xl font-serif font-semibold text-brand-950 mb-6">
              Our Collections
            </h1>
            <p className="text-lg text-brand-600 max-w-2xl mx-auto leading-relaxed">
              Explore our carefully curated eyewear collections. Each piece is selected for its
              exceptional design, premium materials, and timeless appeal.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ ...fadeInUp, visible: { ...fadeInUp.visible, transition: { delay: index * 0.15 } } }}
              >
                <Link href={`/shop?category=${category.id}`}>
                  <Card hover padding="none" className="overflow-hidden group">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-200 flex items-center justify-center text-brand-400">
                          {category.name}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-brand-950/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-8">
                        <h2 className="text-3xl font-serif font-semibold text-white mb-2">
                          {category.name}
                        </h2>
                        <p className="text-white/80 text-sm mb-4">{category.description}</p>
                        <span className="inline-flex items-center gap-2 text-accent-gold text-sm font-medium">
                          Shop {category.name} <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-12"
          >
            <h2 className="text-4xl font-serif font-semibold text-brand-950 text-center mb-4">
              Complete Catalog
            </h2>
            <p className="text-brand-600 text-center max-w-xl mx-auto mb-12">
              Browse our entire selection of premium frames
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => {
              const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
              return (
                <motion.div
                  key={product.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                >
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
                        {product.isNewArrival && (
                          <Badge className="absolute top-3 left-3" variant="info">New</Badge>
                        )}
                        {product.discountPrice && (
                          <Badge className="absolute top-3 right-3" variant="danger">Sale</Badge>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-brand-500 uppercase tracking-wider mb-1">
                          {product.category?.name || product.gender}
                        </p>
                        <h3 className="font-medium text-brand-950 mb-2 line-clamp-1">{product.name}</h3>
                        <div className="flex items-center gap-2">
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
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/shop">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}