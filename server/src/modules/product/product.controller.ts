import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../../core/utils/response.js';
import { generateSlug } from '../../core/utils/slug.js';
import { z } from 'zod';

const productQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(12),
  search: z.string().optional(),
  category: z.string().optional(),
  gender: z.string().optional(),
  frameShape: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sortBy: z.enum(['name', 'basePrice', 'createdAt', 'popularity']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  featured: z.coerce.boolean().optional(),
  newArrival: z.coerce.boolean().optional(),
  bestSeller: z.coerce.boolean().optional(),
});

export async function getProducts(req: Request, res: Response) {
  try {
    const params = productQuerySchema.parse(req.query);
    const { page, limit, search, category, gender, frameShape, material, color, minPrice, maxPrice, sortBy, sortOrder, featured, newArrival, bestSeller } = params;

    const where: any = { isDeleted: false, isActive: true };

    if (search) where.OR = [{ name: { contains: search } }, { description: { contains: search } }, { brand: { contains: search } }];
    if (category) where.categoryId = category;
    if (gender) where.gender = gender;
    if (frameShape) where.frameShape = frameShape;
    if (material) where.material = material;
    if (color) where.color = color;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }
    if (featured) where.isFeatured = true;
    if (newArrival) where.isNewArrival = true;
    if (bestSeller) where.isBestSeller = true;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { images: { where: { isDeleted: false }, orderBy: { sortOrder: 'asc' } }, variants: { where: { isDeleted: false } }, category: true, reviews: { where: { isDeleted: false } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.product.count({ where }),
    ]);

    return sendPaginated(res, products, total, page, limit);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getProductBySlug(req: Request, res: Response) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        images: { where: { isDeleted: false }, orderBy: { sortOrder: 'asc' } },
        variants: { where: { isDeleted: false } },
        category: true,
        reviews: { where: { isDeleted: false }, include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    });
    if (!product || product.isDeleted) return sendError(res, 'Product not found', 404);

    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, isDeleted: false, isActive: true },
      include: { images: { where: { isDeleted: false, isPrimary: true }, take: 1 } },
      take: 4,
    });

    return sendSuccess(res, { ...product, relatedProducts: related });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const { name, description, brand, categoryId, frameShape, material, gender, style, color, basePrice, discountPrice, isFeatured, isNewArrival, isBestSeller, images, variants } = req.body;
    const slug = generateSlug(name) + '-' + Date.now().toString(36);

    const product = await prisma.product.create({
      data: {
        name, slug, sku: `OPT-${Date.now().toString(36).toUpperCase()}`, description, brand, categoryId,
        frameShape, material, gender, style, color, basePrice, discountPrice,
        isFeatured, isNewArrival, isBestSeller,
        createdBy: req.user?.userId,
        images: images ? { create: images.map((img: any, i: number) => ({ url: img.url, alt: img.alt, sortOrder: i, isPrimary: i === 0 })) } : undefined,
        variants: variants ? { create: variants.map((v: any) => ({ sku: v.sku, colorName: v.colorName, colorHex: v.colorHex, sizeLabel: v.sizeLabel, stockQty: v.stockQty || 0, minStockQty: v.minStockQty || 5 })) } : undefined,
      },
      include: { images: true, variants: true, category: true },
    });

    return sendSuccess(res, product, 'Product created', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    if (data.name) data.slug = generateSlug(data.name) + '-' + Date.now().toString(36);
    data.updatedBy = req.user?.userId;

    const product = await prisma.product.update({ where: { id }, data, include: { images: true, variants: true, category: true } });
    return sendSuccess(res, product, 'Product updated');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date(), deletedBy: req.user?.userId } });
    return sendSuccess(res, null, 'Product deleted');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getFilterOptions(_req: Request, res: Response) {
  try {
    const [genders, shapes, materials, colors] = await Promise.all([
      prisma.product.findMany({ where: { isDeleted: false, isActive: true }, select: { gender: true }, distinct: ['gender'] }),
      prisma.product.findMany({ where: { isDeleted: false, isActive: true }, select: { frameShape: true }, distinct: ['frameShape'] }),
      prisma.product.findMany({ where: { isDeleted: false, isActive: true }, select: { material: true }, distinct: ['material'] }),
      prisma.product.findMany({ where: { isDeleted: false, isActive: true }, select: { color: true }, distinct: ['color'] }),
    ]);
    return sendSuccess(res, {
      genders: genders.map(g => g.gender).filter(Boolean),
      shapes: shapes.map(s => s.frameShape).filter(Boolean),
      materials: materials.map(m => m.material).filter(Boolean),
      colors: colors.map(c => c.color).filter(Boolean),
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
