import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError } from '../../core/utils/response.js';

const cartInclude = { items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } }, variant: true } } } as const;

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId }, include: cartInclude });
  }
  return cart;
}

export async function getCart(req: Request, res: Response) {
  try {
    const cart = await getOrCreateCart(req.user!.userId);
    const items = cart.items.filter(i => !i.product.isDeleted && i.product.isActive);
    const subtotal = items.reduce((sum, i) => sum + (i.product.discountPrice || i.product.basePrice) * i.quantity, 0);
    return sendSuccess(res, { ...cart, items, subtotal, itemCount: items.reduce((s, i) => s + i.quantity, 0) });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function addToCart(req: Request, res: Response) {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    const cart = await getOrCreateCart(req.user!.userId);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.isDeleted) return sendError(res, 'Product not found', 404);

    const existing = cart.items.find(i => i.productId === productId && i.variantId === (variantId || null));
    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } });
    } else {
      const productData = await prisma.product.findUnique({ where: { id: productId } });
      const unitPrice = productData?.discountPrice || productData?.basePrice || 0;
      await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId, quantity, unitPrice } });
    }

    const updated = await getOrCreateCart(req.user!.userId);
    return sendSuccess(res, updated, 'Added to cart');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateCartItem(req: Request, res: Response) {
  try {
    const { quantity } = req.body;
    if (quantity < 1) return sendError(res, 'Quantity must be at least 1', 400);
    await prisma.cartItem.update({ where: { id: req.params.itemId }, data: { quantity } });
    const cart = await getOrCreateCart(req.user!.userId);
    return sendSuccess(res, cart, 'Cart updated');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function removeFromCart(req: Request, res: Response) {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.itemId } });
    const cart = await getOrCreateCart(req.user!.userId);
    return sendSuccess(res, cart, 'Removed from cart');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function clearCart(req: Request, res: Response) {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return sendSuccess(res, null, 'Cart cleared');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
