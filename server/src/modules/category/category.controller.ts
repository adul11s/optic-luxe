import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError } from '../../core/utils/response.js';
import { generateSlug } from '../../core/utils/slug.js';

export async function getCategories(_req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      where: { isDeleted: false, isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return sendSuccess(res, categories);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const { name, description, image } = req.body;
    const category = await prisma.category.create({
      data: { name, slug: generateSlug(name), description, image },
    });
    return sendSuccess(res, category, 'Category created', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const data = req.body;
    if (data.name) data.slug = generateSlug(data.name);
    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    return sendSuccess(res, category, 'Category updated');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    await prisma.category.update({ where: { id: req.params.id }, data: { isDeleted: true } });
    return sendSuccess(res, null, 'Category deleted');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
