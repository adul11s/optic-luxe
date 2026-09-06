'use client';

import { useRef, useEffect, useCallback } from 'react';

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  variantImages: { variantId: string; imageUrl: string; colorName?: string; colorHex?: string }[];
}

interface GlassesSelectorProps {
  products: Product[];
  activeProductId: string | null;
  onSelect: (productId: string, variantId: string) => void;
}

export function GlassesSelector({ products, activeProductId, onSelect }: GlassesSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((product: Product, variantIndex: number) => {
    const variant = product.variantImages[variantIndex];
    onSelect(product.id, variant?.variantId ?? product.id);
  }, [onSelect]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !activeProductId) return;
    const active = el.querySelector<HTMLElement>(`[data-product-id="${activeProductId}"]`);
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeProductId]);

  return (
    <div
      className="w-full overflow-x-auto scrollbar-hide"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
      <div ref={scrollRef} className="flex gap-3 px-4 py-3 overflow-x-auto">
        {products.map((product) =>
          product.variantImages.map((variant, vi) => {
            const isActive = product.id === activeProductId;
            return (
              <button
                key={`${product.id}-${variant.variantId}`}
                data-product-id={product.id}
                onClick={() => handleSelect(product, vi)}
                className="flex-shrink-0 transition-all duration-200 ease-out"
                style={{ transform: isActive ? 'scale(1.05)' : 'scale(1)' }}
                aria-label={`Select ${product.name} ${variant.colorName || ''}`}
              >
                <div
                  className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all duration-200"
                  style={{
                    borderColor: isActive ? '#1a1a1a' : 'transparent',
                    boxShadow: isActive ? '0 0 0 3px rgba(26,26,26,0.15)' : 'none',
                  }}
                >
                  <img
                    src={variant.imageUrl}
                    alt={variant.colorName || product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-1 text-center text-xs text-brand-600 truncate max-w-16">
                  {variant.colorName || product.name}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}