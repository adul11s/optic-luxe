"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Cart, CartItem } from "@/types";
import { useAuth } from "@/lib/auth-provider";

export const dynamic = "force-dynamic";

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const { data: cartData, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => api.get<{ data: Cart }>("/cart"),
    enabled: isAuthenticated,
  });

  const updateQuantity = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      api.put(`/cart/items/${itemId}`, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => api.delete(`/cart/items/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const clearCart = useMutation({
    mutationFn: () => api.delete("/cart"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const cart = cartData?.data?.data;
  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;

  const handleQuantityChange = (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    updateQuantity.mutate({ itemId, quantity: newQty });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
        <Card className="text-center py-12 max-w-md">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-xl font-semibold text-brand-950 mb-2">Sign in to view your cart</h2>
          <p className="text-brand-500 mb-6">Please login to see your shopping cart and continue shopping.</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-950 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
        <Card className="text-center py-12 max-w-md">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-xl font-semibold text-brand-950 mb-2">Your cart is empty</h2>
          <p className="text-brand-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Link href="/shop">
            <Button>Start Shopping</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <div className="container-wide py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-semibold text-brand-950">Shopping Cart</h1>
            <p className="text-brand-600 mt-1">{items.length} item{items.length !== 1 ? "s" : ""}</p>
          </div>
          <Button variant="ghost" onClick={() => clearCart.mutate()}>
            Clear Cart
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              className="space-y-4"
            >
              {items.map((item) => (
                <motion.div key={item.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <CartItemCard
                    item={item}
                    onQuantityChange={(delta) => handleQuantityChange(item.id, item.quantity, delta)}
                    onRemove={() => removeItem.mutate(item.id)}
                    isUpdating={updateQuantity.isPending}
                  />
                </motion.div>
              ))}
            </motion.div>

            <Link href="/shop" className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-950 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>

          <div>
            <Card className="sticky top-24">
              <h2 className="text-lg font-semibold text-brand-950 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-brand-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-brand-600">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t border-brand-100 pt-4 mb-6">
                <div className="flex justify-between text-lg font-semibold text-brand-950">
                  <span>Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>

              <Link href="/checkout">
                <Button className="w-full" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Proceed to Checkout
                </Button>
              </Link>

              <div className="mt-6 p-4 bg-brand-50 rounded-xl">
                <p className="text-sm text-brand-600 text-center">
                  Free shipping on orders over Rp 500.000
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartItemCard({
  item,
  onQuantityChange,
  onRemove,
  isUpdating,
}: {
  item: CartItem;
  onQuantityChange: (delta: number) => void;
  onRemove: () => void;
  isUpdating: boolean;
}) {
  const primaryImage = item.product?.images?.find((img) => img.isPrimary) || item.product?.images?.[0];
  const productName = item.product?.name || "Product";
  const variantInfo = item.variant?.colorName || item.variant?.sizeLabel || "";
  const price = item.product?.discountPrice || item.product?.basePrice || 0;
  const totalPrice = price * item.quantity;

  return (
    <Card className="flex gap-4 overflow-hidden">
      <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-brand-100 rounded-xl overflow-hidden">
        {primaryImage ? (
          <img src={primaryImage.url} alt={productName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-300">No Image</div>
        )}
      </div>

      <div className="flex flex-col justify-center flex-1 min-w-0">
        <Link href={`/product/${item.product?.slug}`} className="hover:text-brand-600 transition-colors">
          <h3 className="font-medium text-brand-950 line-clamp-1">{productName}</h3>
        </Link>
        {variantInfo && <p className="text-sm text-brand-500">{variantInfo}</p>}
        <p className="text-sm text-brand-600 mt-1">{formatPrice(price)}</p>
      </div>

      <div className="flex flex-col items-end justify-between">
        <button
          onClick={onRemove}
          className="p-1 text-brand-400 hover:text-red-500 transition-colors"
          disabled={isUpdating}
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onQuantityChange(-1)}
            disabled={isUpdating || item.quantity <= 1}
            className="p-1 border border-brand-200 rounded-full hover:bg-brand-100 disabled:opacity-50 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <button
            onClick={() => onQuantityChange(1)}
            disabled={isUpdating}
            className="p-1 border border-brand-200 rounded-full hover:bg-brand-100 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <p className="font-semibold text-brand-950">{formatPrice(totalPrice)}</p>
      </div>
    </Card>
  );
}