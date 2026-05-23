import { prisma } from '../../../core/database/prisma.js';
import { sendSuccess, sendError } from '../../../core/utils/response.js';
import type { Request, Response } from 'express';

const BASE_URL = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3001';
const ASSET_BASE = `${BASE_URL}/assets/tryon`;

const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 300000;

interface TryOnAssetsResult {
  productId: string;
  productName: string;
  productSlug: string;
  basePrice: number;
  discountPrice: number | null;
  variants: {
    variantId: string;
    colorName: string;
    colorHex: string;
    priceOffset: number;
    isActive: boolean;
    assets: {
      spriteUrl: string;
      modelUrl: string;
      thumbnailUrl: string;
    };
  }[];
}

function getAssetUrls(product: { slug: string; name: string }, variant: { colorName: string | null; id: string }) {
  const colorKey = (variant.colorName || 'default')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const slugKey = product.slug
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const baseName = `${slugKey}-${colorKey}`;

  return {
    spriteUrl: `${ASSET_BASE}/${baseName}.png`,
    modelUrl: `${ASSET_BASE}/${baseName}.glb`,
    thumbnailUrl: `${ASSET_BASE}/${baseName}.png`,
  };
}

async function getTryOnAssetsCached(productId: string): Promise<TryOnAssetsResult | null> {
  const now = Date.now();
  const cached = cache.get(productId);

  if (cached && cached.expiry > now) {
    return cached.data;
  }

  const product = await prisma.product.findUnique({
    where: { id: productId, isDeleted: false },
    include: {
      variants: {
        where: { isDeleted: false, isActive: true },
      },
      images: { where: { isDeleted: false, isPrimary: true }, take: 1 },
    },
  });

  if (!product) return null;

  const variantsWithAssets = product.variants.map((variant) => {
    const assets = getAssetUrls(product, variant);
    return {
      variantId: variant.id,
      colorName: variant.colorName || 'Default',
      colorHex: variant.colorHex || '#000000',
      priceOffset: variant.priceOffset,
      isActive: variant.isActive,
      assets,
    };
  });

  const result: TryOnAssetsResult = {
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    basePrice: product.basePrice,
    discountPrice: product.discountPrice,
    variants: variantsWithAssets,
  };

  cache.set(productId, { data: result, expiry: now + CACHE_TTL });

  return result;
}

export async function getTryOnAssets(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await getTryOnAssetsCached(id);
    if (!result) return sendError(res, 'Product not found', 404);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}