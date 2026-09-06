import { createClient, type RedisClientType } from '@redis/client';
import { prisma } from '../database/prisma.js';

let redis: RedisClientType | null = null;

async function getRedisClient(): Promise<RedisClientType> {
  if (!redis) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = createClient({ url });
    redis.on('error', (err) => console.error('[Redis] Error:', err));
    redis.on('connect', () => console.log('[Redis] Connected'));
    await redis.connect();
  }
  return redis;
}

export type CacheTag = 'products' | 'categories' | 'users' | 'orders' | 'dashboard' | 'inventory' | 'analytics';

interface CacheOptions {
  tags?: CacheTag[];
  ttlSeconds?: number;
}

const DEFAULT_TTL: Record<CacheTag, number> = {
  products: 300,    // 5 min — product data changes occasionally
  categories: 3600, // 1 hr — category structure rarely changes
  users: 60,       // 1 min — user data changes frequently
  orders: 30,       // 30 sec — order status needs freshness
  dashboard: 60,   // 1 min — stats refresh frequently
  inventory: 15,    // 15 sec — stock levels need near real-time
  analytics: 60,   // 1 min — analytics refresh frequently
};

/**
 * Get a value from cache.
 * Returns null on miss or Redis unavailable (cache-aside: fall through to DB).
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    const value = await client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    console.warn('[Cache] Get failed:', err);
    return null;
  }
}

/**
 * Set a value in cache with optional TTL and tag-based invalidation.
 */
export async function cacheSet<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
  try {
    const client = await getRedisClient();
    const ttl = options?.ttlSeconds ?? 300;
    const serialized = JSON.stringify(value);

    await client.setEx(key, ttl, serialized);

    if (options?.tags) {
      for (const tag of options.tags) {
        await client.sAdd(`tag:${tag}`, key);
        await client.expire(`tag:${tag}`, DEFAULT_TTL[tag] * 2);
      }
    }
  } catch (err) {
    console.warn('[Cache] Set failed:', err);
  }
}

/**
 * Delete a specific cache key.
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.del(key);
  } catch (err) {
    console.warn('[Cache] Del failed:', err);
  }
}

/**
 * Invalidate all cache keys matching a tag.
 * Uses Redis SET for O(1) tag lookups instead of SCAN.
 */
export async function cacheInvalidateTag(tag: CacheTag): Promise<void> {
  try {
    const client = await getRedisClient();
    const keys = await client.sMembers(`tag:${tag}`);
    if (keys.length === 0) return;

    const pipeline = client.multi();
    for (const key of keys) pipeline.del(key);
    pipeline.del(`tag:${tag}`);
    await pipeline.exec();
  } catch (err) {
    console.warn('[Cache] InvalidateTag failed:', err);
  }
}

/**
 * Invalidate multiple tags at once.
 */
export async function cacheInvalidateTags(...tags: CacheTag[]): Promise<void> {
  await Promise.all(tags.map((tag) => cacheInvalidateTag(tag)));
}

/**
 * Clear all cache (use sparingly, e.g., admin flush).
 */
export async function cacheFlush(): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.flushAll();
  } catch (err) {
    console.warn('[Cache] Flush failed:', err);
  }
}

// ─── Domain-Specific Cache Helpers ────────────────────────────────────────────

const PRODUCT_LIST_KEY = (page: number, limit: number, category: string, gender: string, search: string) =>
  `products:list:${page}:${limit}:${category}:${gender}:${search}`;

const PRODUCT_DETAIL_KEY = (slug: string) => `products:detail:${slug}`;

const CATEGORY_LIST_KEY = () => 'categories:list';
const CATEGORY_TREE_KEY = () => 'categories:tree';

const DASHBOARD_KEY = (userId: string) => `dashboard:${userId}`;
const ANALYTICS_KEY = () => 'dashboard:analytics';

const INVENTORY_KEY = () => 'warehouse:inventory';
const INVENTORY_ALERTS_KEY = () => 'warehouse:alerts';

async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const data = await fetcher();
  await cacheSet(key, data, options);
  return data;
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function getCachedProductList(
  page: number,
  limit: number,
  category: string,
  gender: string,
  search: string
) {
  return withCache(
    PRODUCT_LIST_KEY(page, limit, category, gender, search),
    async () => {
      const where: any = { isDeleted: false, isActive: true };
      if (category) where.category = { slug: category };
      if (gender) where.gender = gender;
      if (search) where.name = { contains: search, mode: 'insensitive' };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            images: { where: { isDeleted: false }, take: 1 },
            variants: { where: { isDeleted: false, isActive: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
    },
    { tags: ['products'], ttlSeconds: DEFAULT_TTL.products }
  );
}

export async function getCachedProductDetail(slug: string) {
  return withCache(
    PRODUCT_DETAIL_KEY(slug),
    async () =>
      prisma.product.findUnique({
        where: { slug, isDeleted: false },
        include: {
          images: { where: { isDeleted: false }, orderBy: { sortOrder: 'asc' } },
          variants: {
            where: { isDeleted: false },
            include: {
              images: { where: { isDeleted: false }, take: 1 },
            },
          },
          reviews: {
            where: { isDeleted: false, isApproved: true },
            include: { user: { select: { name: true, avatar: true } }, images: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          category: true,
        },
      }),
    { tags: ['products'], ttlSeconds: DEFAULT_TTL.products }
  );
}

export async function invalidateProductCache(slug?: string, _categoryId?: string): Promise<void> {
  await cacheInvalidateTag('products');
  await cacheInvalidateTag('categories');
  if (slug) await cacheDel(PRODUCT_DETAIL_KEY(slug));
}

// ── Categories ─────────────────────────────────────────────────────────────────

export async function getCachedCategoryList() {
  return withCache(CATEGORY_LIST_KEY(), () =>
    prisma.category.findMany({
      where: { isDeleted: false, isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  , { tags: ['categories'], ttlSeconds: DEFAULT_TTL.categories });
}

export async function getCachedCategoryTree() {
  return withCache(CATEGORY_TREE_KEY(), () =>
    prisma.category.findMany({
      where: { isDeleted: false, isActive: true },
      include: { children: { where: { isDeleted: false, isActive: true } } },
      orderBy: { sortOrder: 'asc' },
    })
  , { tags: ['categories'], ttlSeconds: DEFAULT_TTL.categories });
}

export async function invalidateCategoryCache(): Promise<void> {
  await cacheInvalidateTag('categories');
  await cacheDel(CATEGORY_TREE_KEY());
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getCachedDashboard(userId: string) {
  return withCache(
    DASHBOARD_KEY(userId),
    async () => {
      const stats = await prisma.order.aggregate({
        where: { isDeleted: false },
        _sum: { totalAmount: true },
        _count: true,
      });
      return stats;
    },
    { tags: ['dashboard'], ttlSeconds: DEFAULT_TTL.dashboard }
  );
}

export async function getCachedAnalytics() {
  return withCache(
    ANALYTICS_KEY(),
    async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [monthlyRevenue, topProducts, recentOrders] = await Promise.all([
        prisma.order.groupBy({
          by: ['createdAt'],
          where: { isDeleted: false, createdAt: { gte: startOfMonth } },
          _sum: { totalAmount: true },
        }),
        prisma.product.findMany({
          where: { isDeleted: false, isBestSeller: true },
          take: 10,
          orderBy: { orderItems: { _count: 'desc' } },
        }),
        prisma.order.findMany({
          where: { isDeleted: false },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } }, items: { include: { product: { include: { images: { take: 1 } } } } } },
        }),
      ]);

      return { monthlyRevenue, topProducts, recentOrders };
    },
    { tags: ['dashboard', 'analytics'], ttlSeconds: DEFAULT_TTL.dashboard }
  );
}

export async function invalidateDashboardCache(): Promise<void> {
  await cacheInvalidateTags('dashboard', 'analytics', 'orders');
}

// ── Inventory ──────────────────────────────────────────────────────────────────

export async function getCachedInventoryOverview() {
  return withCache(
    INVENTORY_KEY(),
    async () => {
      const variants = await prisma.productVariant.findMany({
        where: { isDeleted: false },
        include: {
          product: {
            select: {
              id: true, name: true, slug: true, brand: true,
              basePrice: true, discountPrice: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
        orderBy: { stockQty: 'asc' },
      });

      const lowStockCount = variants.filter((v) => v.stockQty <= v.minStockQty && v.stockQty > 0).length;
      const outOfStockCount = variants.filter((v) => v.stockQty === 0).length;

      return { variants, lowStockCount, outOfStockCount };
    },
    { tags: ['inventory'], ttlSeconds: DEFAULT_TTL.inventory }
  );
}

export async function getCachedInventoryAlerts() {
  return withCache(
    INVENTORY_ALERTS_KEY(),
    async () =>
      prisma.productVariant.findMany({
        where: { isDeleted: false, stockQty: { lte: prisma.productVariant.fields.minStockQty } },
        include: { product: { select: { id: true, name: true, slug: true, images: { take: 1, where: { isPrimary: true } } } } },
        orderBy: { stockQty: 'asc' },
      }),
    { tags: ['inventory'], ttlSeconds: DEFAULT_TTL.inventory }
  );
}

export async function invalidateInventoryCache(): Promise<void> {
  await cacheInvalidateTag('inventory');
}

// ── Stock Level Cache (Near Real-Time) ────────────────────────────────────────

const STOCK_KEY = (variantId: string) => `stock:${variantId}`;

export async function getCachedStockLevel(variantId: string): Promise<number | null> {
  try {
    const client = await getRedisClient();
    const val = await client.get(STOCK_KEY(variantId));
    if (val !== null) return parseInt(val, 10);
    return null;
  } catch {
    return null;
  }
}

export async function setCachedStockLevel(variantId: string, qty: number): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.setEx(STOCK_KEY(variantId), DEFAULT_TTL.inventory, String(qty));
  } catch {
    // Non-critical
  }
}

/**
 * Invalidate stock cache for a variant — called after any stock change.
 */
export async function invalidateStockCache(variantId: string): Promise<void> {
  await Promise.all([
    cacheDel(STOCK_KEY(variantId)),
    invalidateInventoryCache(),
  ]);
}