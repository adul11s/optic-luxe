"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Minus, Plus, Star, Truck, Shield, RotateCcw } from "lucide-react";
import { Button, Card, Badge, Input, Select, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Product, Review } from "@/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.get<{ data: Product }>(`/products/${slug}`),
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["reviews", product?.data?.data?.id],
    queryFn: () => api.get<{ data: Review[] }>(`/reviews/product/${product?.data?.data?.id}`),
    enabled: !!product?.data?.data?.id,
  });

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  const p = product?.data?.data as Product | undefined;
  
  if (!p) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <Card className="text-center py-12 px-8">
          <h2 className="text-xl font-semibold text-brand-950 mb-2">Product not found</h2>
          <p className="text-brand-500 mb-4">The product you're looking for doesn't exist.</p>
          <Link href="/shop">
            <Button>Back to Shop</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const images = p.images.length > 0 ? p.images : [{ id: "1", url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800", isPrimary: true, sortOrder: 0 }];
  const variants = p.variants || [];
  const reviews = (reviewsData?.data?.data || []) as Review[];

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const handleAddToCart = async () => {
    if (variants.length > 0 && !selectedVariant) {
      alert("Please select a variant");
      return;
    }
    // Add to cart logic here
    alert("Added to cart!");
  };

  return (
    <div className="min-h-screen bg-brand-50">
      <div className="container-wide py-8">
        <nav className="flex items-center gap-2 text-sm text-brand-500 mb-8">
          <Link href="/home" className="hover:text-brand-700">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-brand-700">Shop</Link>
          <span>/</span>
          <span className="text-brand-950">{p.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="space-y-4"
          >
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm">
              <img
                src={images[selectedImage]?.url || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800"}
                alt={p.name}
                className="w-full h-full object-cover"
              />
              {p.isNewArrival && (
                <Badge className="absolute top-4 left-4" variant="info">New Arrival</Badge>
              )}
              {p.discountPrice && (
                <Badge className="absolute top-4 right-4" variant="danger">Sale</Badge>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? "border-brand-950" : "border-transparent hover:border-brand-200"
                    }`}
                  >
                    <img src={image.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div>
              <p className="text-sm text-brand-500 uppercase tracking-wider mb-2">{p.brand}</p>
              <h1 className="text-3xl md:text-4xl font-serif font-semibold text-brand-950 mb-4">{p.name}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= Number(averageRating) ? "fill-accent-gold text-accent-gold" : "text-brand-300"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-brand-600">{averageRating} ({reviews.length} reviews)</span>
              </div>

              <div className="flex items-center gap-4">
                {p.discountPrice ? (
                  <>
                    <span className="text-3xl font-bold text-brand-950">{formatPrice(p.discountPrice)}</span>
                    <span className="text-xl text-brand-400 line-through">{formatPrice(p.basePrice)}</span>
                    <Badge variant="danger">{Math.round((1 - p.discountPrice / p.basePrice) * 100)}% OFF</Badge>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-brand-950">{formatPrice(p.basePrice)}</span>
                )}
              </div>
            </div>

            <div className="prose prose-brand max-w-none">
              <p className="text-brand-600 leading-relaxed">{p.description}</p>
            </div>

            {variants.length > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-3">Select Color</label>
                  <div className="flex flex-wrap gap-3">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        className={`px-4 py-2 rounded-full border-2 transition-all ${
                          selectedVariant === variant.id
                            ? "border-brand-950 bg-brand-950 text-white"
                            : "border-brand-200 hover:border-brand-400"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {variant.colorHex && (
                            <span
                              className="w-4 h-4 rounded-full border border-white/30"
                              style={{ backgroundColor: variant.colorHex }}
                            />
                          )}
                          {variant.colorName || variant.sizeLabel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-brand-700">Quantity:</span>
                  <div className="flex items-center border border-brand-200 rounded-full">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 text-brand-600 hover:text-brand-950 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 text-brand-600 hover:text-brand-950 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedVariant && (
                    <span className="text-sm text-brand-500">
                      {variants.find((v) => v.id === selectedVariant)?.stockQty || 0} in stock
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                Add to Cart
              </Button>
              <Button variant="outline" size="lg" leftIcon={<Heart className="w-5 h-5" />}>
                Wishlist
              </Button>
            </div>

            <Card className="bg-brand-50 border-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-brand-600" />
                  <div>
                    <p className="text-sm font-medium text-brand-950">Free Shipping</p>
                    <p className="text-xs text-brand-500">Orders over Rp 500.000</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-brand-600" />
                  <div>
                    <p className="text-sm font-medium text-brand-950">2 Year Warranty</p>
                    <p className="text-xs text-brand-500">On all frames</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-brand-600" />
                  <div>
                    <p className="text-sm font-medium text-brand-950">30 Day Returns</p>
                    <p className="text-xs text-brand-500">Hassle-free</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="border-t border-brand-100 pt-6">
              <h3 className="font-semibold text-brand-950 mb-4">Frame Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {p.frameShape && (
                  <div>
                    <span className="text-brand-500">Shape:</span>
                    <span className="ml-2 text-brand-950">{p.frameShape.replace("_", " ")}</span>
                  </div>
                )}
                {p.material && (
                  <div>
                    <span className="text-brand-500">Material:</span>
                    <span className="ml-2 text-brand-950">{p.material}</span>
                  </div>
                )}
                {p.gender && (
                  <div>
                    <span className="text-brand-500">Gender:</span>
                    <span className="ml-2 text-brand-950">{p.gender}</span>
                  </div>
                )}
                {p.style && (
                  <div>
                    <span className="text-brand-500">Style:</span>
                    <span className="ml-2 text-brand-950">{p.style}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-16">
          <div className="flex gap-4 border-b border-brand-100 mb-8">
            <button
              onClick={() => setActiveTab("description")}
              className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                activeTab === "description" ? "text-brand-950" : "text-brand-500 hover:text-brand-700"
              }`}
            >
              Description
              {activeTab === "description" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-950" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                activeTab === "reviews" ? "text-brand-950" : "text-brand-500 hover:text-brand-700"
              }`}
            >
              Reviews ({reviews.length})
              {activeTab === "reviews" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-950" />
              )}
            </button>
          </div>

          {activeTab === "description" ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="max-w-3xl"
            >
              <h3 className="text-lg font-semibold text-brand-950 mb-4">Product Description</h3>
              <p className="text-brand-600 leading-relaxed whitespace-pre-wrap">{p.description}</p>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-bold text-brand-950">{averageRating}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= Number(averageRating) ? "fill-accent-gold text-accent-gold" : "text-brand-300"}`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-brand-500">{reviews.length} reviews</span>
              </div>

              {reviews.length === 0 ? (
                <Card className="text-center py-8">
                  <p className="text-brand-500">No reviews yet. Be the first to review this product!</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-semibold">
                          {review.user?.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-brand-950">{review.user?.name || "Anonymous"}</span>
                            <span className="text-sm text-brand-500">
                              {new Date(review.createdAt).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= review.rating ? "fill-accent-gold text-accent-gold" : "text-brand-300"}`}
                              />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-brand-600">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-brand-50">
      <div className="container-wide py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}