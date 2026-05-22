import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const unsplashEyewear = [
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1588778585923-353c9e06e4c1?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509696507120-5b9a8d69eb75?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1473496169904-658ba7c44d82?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508522023215-7aff4e57cd4a?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1588523017550-5e25a68e6666?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551592395-dd3b476fdf2e?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1485528562719-4d5ef36f4618?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1563903530908-afdd155d057a?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&auto=format&fit=crop',
];

const descTemplates = [
  'Crafted with precision, these {material} {shape} frames offer a perfect balance of comfort and style. The {color} finish adds sophistication.',
  'Make a statement with these {shape} frames in luxurious {material}. The {color} hue brings warmth and character to any outfit.',
  'Designed for the modern individual, these {material} frames feature a {shape} silhouette. The {color} colorway is endlessly versatile.',
  'Elevate your look with these {shape} glasses. The premium {material} construction ensures durability, while the {color} tone adds elegance.',
  'A contemporary take on the classic {shape} design. Lightweight {material} build with a rich {color} finish for all-day wear.',
  'Bold yet refined, these {shape} frames in {material} demand attention. The {color} color makes a confident statement.',
  'Timeless sophistication meets modern comfort. These {material} {shape} frames in {color} are an essential addition to any wardrobe.',
  'Expertly crafted from premium {material}, these {shape} glasses offer a distinctive {color} finish that complements any face shape.',
];

const reviewComments = [
  'Absolutely love these frames! So lightweight and comfortable for all-day wear.',
  'Great quality and the style is exactly what I was looking for. Highly recommend!',
  'These glasses are stunning. I get compliments everywhere I go now.',
  'Very comfortable and well-made. The build quality exceeded my expectations.',
  'The perfect balance of style and comfort. Will definitely buy from Optic Luxe again.',
  'Beautiful craftsmanship and the fit is perfect. Worth every rupiah.',
  'These are my third pair from Optic Luxe. Never disappointed!',
  'The color is even better in person. Love the attention to detail.',
  'Stylish, well-made, and arrived quickly. Could not be happier.',
  'Best glasses I have ever owned. The customer service was amazing too.',
  'Love the minimalist design. So elegant and timeless in person.',
  'These frames have held up beautifully over the past year. Great investment.',
  'Fits my face perfectly. The nose pads are super comfortable.',
  'The acetate quality is incredible. Looks far more expensive than it is.',
  'Perfect for my prescription. The optician did an amazing job fitting them.',
  'So happy with this purchase. The gold detailing is gorgeous.',
  'These are my go-to frames now. Comfortable, stylish, and durable.',
  'Incredible value for the quality you get. These feel like designer frames.',
  'The matte finish is gorgeous. Very premium look and feel.',
  'Shipping was fast and the packaging was beautiful. A+ experience overall.',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const shapeLabels: Record<string, string> = {
  AVIATOR: 'aviator', ROUND: 'round', SQUARE: 'square', RECTANGLE: 'rectangle',
  CAT_EYE: 'cat-eye', OVAL: 'oval', BROWLINE: 'browline', GEOMETRIC: 'geometric',
  BUTTERFLY: 'butterfly', WAYFARER: 'wayfarer',
};

const materialLabels: Record<string, string> = {
  ACETATE: 'acetate', METAL: 'metal', TITANIUM: 'titanium', TR90: 'TR90',
  WOOD: 'wood', COMBINATION: 'combination',
};

type ProductSeed = {
  name: string; slug: string; categoryIdPlaceholder?: string;
  frameShape: string; material: string; gender: string; style: string;
  color: string; basePrice: number; discountPrice?: number;
  isFeatured?: boolean; isNewArrival?: boolean; isBestSeller?: boolean;
};

function buildCatalog(menId: string, womenId: string, unisexId: string, kidsId: string): ProductSeed[] {
  const rows: ProductSeed[] = [];
  const catMap: Record<string, string> = { MEN: menId, WOMEN: womenId, UNISEX: unisexId, KIDS: kidsId };

  // ── MEN (15 products) ──
  const menProducts: Omit<ProductSeed, 'slug' | 'categoryIdPlaceholder'>[] = [
    { name: 'Modern Rectangle', frameShape: 'RECTANGLE', material: 'ACETATE', gender: 'MEN', style: 'MODERN', color: 'Black', basePrice: 380000, isNewArrival: true },
    { name: 'Square Bold', frameShape: 'SQUARE', material: 'TR90', gender: 'MEN', style: 'BOLD', color: 'Matte Black', basePrice: 350000 },
    { name: 'Browline Classic', frameShape: 'BROWLINE', material: 'COMBINATION', gender: 'MEN', style: 'CLASSIC', color: 'Brown', basePrice: 410000, isBestSeller: true },
    { name: 'Titanium Minimal', frameShape: 'RECTANGLE', material: 'TITANIUM', gender: 'MEN', style: 'MINIMAL', color: 'Gunmetal', basePrice: 580000, isNewArrival: true },
    { name: 'Slim Aviator', frameShape: 'AVIATOR', material: 'TITANIUM', gender: 'MEN', style: 'CLASSIC', color: 'Silver', basePrice: 520000, discountPrice: 469000 },
    { name: 'Urban Wayfarer', frameShape: 'WAYFARER', material: 'ACETATE', gender: 'MEN', style: 'MODERN', color: 'Dark Tortoise', basePrice: 390000 },
    { name: 'Architect Rectangle', frameShape: 'RECTANGLE', material: 'METAL', gender: 'MEN', style: 'MINIMAL', color: 'Matte Black', basePrice: 340000, isBestSeller: true },
    { name: 'Clubmaster Round', frameShape: 'ROUND', material: 'COMBINATION', gender: 'MEN', style: 'CLASSIC', color: 'Tortoise', basePrice: 430000, discountPrice: 389000 },
    { name: 'Executive Square', frameShape: 'SQUARE', material: 'TITANIUM', gender: 'MEN', style: 'MINIMAL', color: 'Champagne', basePrice: 620000, isFeatured: true },
    { name: 'Metro Browline', frameShape: 'BROWLINE', material: 'ACETATE', gender: 'MEN', style: 'VINTAGE', color: 'Havana', basePrice: 370000, isNewArrival: true },
    { name: 'Stealth Aviator', frameShape: 'AVIATOR', material: 'METAL', gender: 'MEN', style: 'BOLD', color: 'Matte Black', basePrice: 330000 },
    { name: 'Precision Oval', frameShape: 'OVAL', material: 'TITANIUM', gender: 'MEN', style: 'MINIMAL', color: 'Gunmetal', basePrice: 560000, discountPrice: 499000 },
    { name: 'Bold Geometric', frameShape: 'GEOMETRIC', material: 'ACETATE', gender: 'MEN', style: 'BOLD', color: 'Navy', basePrice: 400000, isFeatured: true, isNewArrival: true },
    { name: 'Classic Rectangle', frameShape: 'RECTANGLE', material: 'METAL', gender: 'MEN', style: 'CLASSIC', color: 'Gold', basePrice: 290000, isBestSeller: true },
    { name: 'Weekend Round', frameShape: 'ROUND', material: 'TR90', gender: 'MEN', style: 'MODERN', color: 'Olive', basePrice: 310000 },
  ];

  // ── WOMEN (16 products) ──
  const womenProducts: Omit<ProductSeed, 'slug' | 'categoryIdPlaceholder'>[] = [
    { name: 'Cat Eye Elegance', frameShape: 'CAT_EYE', material: 'ACETATE', gender: 'WOMEN', style: 'MODERN', color: 'Tortoise', basePrice: 420000, discountPrice: 379000, isFeatured: true },
    { name: 'Oval Delicate', frameShape: 'OVAL', material: 'METAL', gender: 'WOMEN', style: 'MINIMAL', color: 'Rose Gold', basePrice: 390000, isNewArrival: true },
    { name: 'Butterfly Chic', frameShape: 'BUTTERFLY', material: 'ACETATE', gender: 'WOMEN', style: 'BOLD', color: 'Red', basePrice: 460000, isFeatured: true },
    { name: 'Petite Cat Eye', frameShape: 'CAT_EYE', material: 'TITANIUM', gender: 'WOMEN', style: 'VINTAGE', color: 'Rose Gold', basePrice: 540000, isNewArrival: true },
    { name: 'Grace Round', frameShape: 'ROUND', material: 'METAL', gender: 'WOMEN', style: 'CLASSIC', color: 'Gold', basePrice: 360000 },
    { name: 'Sophia Rectangle', frameShape: 'RECTANGLE', material: 'ACETATE', gender: 'WOMEN', style: 'MODERN', color: 'Crystal', basePrice: 380000, isBestSeller: true },
    { name: 'Blush Oval', frameShape: 'OVAL', material: 'ACETATE', gender: 'WOMEN', style: 'MINIMAL', color: 'Blush Pink', basePrice: 410000, discountPrice: 369000 },
    { name: 'Diva Butterfly', frameShape: 'BUTTERFLY', material: 'METAL', gender: 'WOMEN', style: 'BOLD', color: 'Rose Gold', basePrice: 480000, isFeatured: true },
    { name: 'Feline Cat Eye', frameShape: 'CAT_EYE', material: 'ACETATE', gender: 'WOMEN', style: 'BOLD', color: 'Black', basePrice: 350000 },
    { name: 'Whisper Oval', frameShape: 'OVAL', material: 'TITANIUM', gender: 'WOMEN', style: 'MINIMAL', color: 'Silver', basePrice: 590000, isNewArrival: true },
    { name: 'Garden Geometric', frameShape: 'GEOMETRIC', material: 'ACETATE', gender: 'WOMEN', style: 'MODERN', color: 'Sage Green', basePrice: 430000 },
    { name: 'Vintage Round', frameShape: 'ROUND', material: 'METAL', gender: 'WOMEN', style: 'VINTAGE', color: 'Antique Gold', basePrice: 370000, isBestSeller: true },
    { name: 'Crystal Wayfarer', frameShape: 'WAYFARER', material: 'ACETATE', gender: 'WOMEN', style: 'CLASSIC', color: 'Clear Crystal', basePrice: 340000, discountPrice: 299000 },
    { name: 'Noir Square', frameShape: 'SQUARE', material: 'ACETATE', gender: 'WOMEN', style: 'BOLD', color: 'Black', basePrice: 320000 },
    { name: 'Romance Browline', frameShape: 'BROWLINE', material: 'COMBINATION', gender: 'WOMEN', style: 'VINTAGE', color: 'Tortoise', basePrice: 450000, isFeatured: true },
    { name: 'Luna Aviator', frameShape: 'AVIATOR', material: 'METAL', gender: 'WOMEN', style: 'MODERN', color: 'Gold', basePrice: 380000, isNewArrival: true },
  ];

  // ── UNISEX (12 products) ──
  const unisexProducts: Omit<ProductSeed, 'slug' | 'categoryIdPlaceholder'>[] = [
    { name: 'Classic Aviator', frameShape: 'AVIATOR', material: 'METAL', gender: 'UNISEX', style: 'CLASSIC', color: 'Gold', basePrice: 450000, discountPrice: 399000, isFeatured: true, isBestSeller: true },
    { name: 'Round Vintage', frameShape: 'ROUND', material: 'TITANIUM', gender: 'UNISEX', style: 'VINTAGE', color: 'Silver', basePrice: 520000, isFeatured: true, isNewArrival: true },
    { name: 'Geometric Edge', frameShape: 'GEOMETRIC', material: 'ACETATE', gender: 'UNISEX', style: 'MODERN', color: 'Clear', basePrice: 440000 },
    { name: 'Wayfarer Style', frameShape: 'WAYFARER', material: 'ACETATE', gender: 'UNISEX', style: 'CLASSIC', color: 'Black', basePrice: 370000, isBestSeller: true },
    { name: 'Halo Round', frameShape: 'ROUND', material: 'METAL', gender: 'UNISEX', style: 'MINIMAL', color: 'Silver', basePrice: 310000 },
    { name: 'Nordic Square', frameShape: 'SQUARE', material: 'TITANIUM', gender: 'UNISEX', style: 'MODERN', color: 'Matte Silver', basePrice: 550000, isNewArrival: true },
    { name: 'Artisan Oval', frameShape: 'OVAL', material: 'ACETATE', gender: 'UNISEX', style: 'CLASSIC', color: 'Amber', basePrice: 370000, discountPrice: 329000 },
    { name: 'Transparent Geometric', frameShape: 'GEOMETRIC', material: 'TR90', gender: 'UNISEX', style: 'MODERN', color: 'Frosted Clear', basePrice: 290000, isNewArrival: true },
    { name: 'Heritage Browline', frameShape: 'BROWLINE', material: 'ACETATE', gender: 'UNISEX', style: 'VINTAGE', color: 'Dark Brown', basePrice: 420000, isFeatured: true },
    { name: 'Minimalist Rectangle', frameShape: 'RECTANGLE', material: 'METAL', gender: 'UNISEX', style: 'MINIMAL', color: 'Matte Gunmetal', basePrice: 330000, isBestSeller: true },
    { name: 'Eclipse Aviator', frameShape: 'AVIATOR', material: 'TITANIUM', gender: 'UNISEX', style: 'MODERN', color: 'Black', basePrice: 580000, discountPrice: 529000 },
    { name: 'Fusion Wayfarer', frameShape: 'WAYFARER', material: 'TR90', gender: 'UNISEX', style: 'MODERN', color: 'Teal', basePrice: 310000 },
  ];

  // ── KIDS (8 products) ──
  const kidsProducts: Omit<ProductSeed, 'slug' | 'categoryIdPlaceholder'>[] = [
    { name: 'Kids Fun Round', frameShape: 'ROUND', material: 'TR90', gender: 'KIDS', style: 'MODERN', color: 'Blue', basePrice: 280000 },
    { name: 'Tiny Aviator', frameShape: 'AVIATOR', material: 'METAL', gender: 'KIDS', style: 'CLASSIC', color: 'Silver', basePrice: 260000 },
    { name: 'Junior Rectangle', frameShape: 'RECTANGLE', material: 'TR90', gender: 'KIDS', style: 'MODERN', color: 'Red', basePrice: 250000, isNewArrival: true },
    { name: 'Playful Cat Eye', frameShape: 'CAT_EYE', material: 'ACETATE', gender: 'KIDS', style: 'BOLD', color: 'Pink', basePrice: 270000 },
    { name: 'Sporty Wayfarer', frameShape: 'WAYFARER', material: 'TR90', gender: 'KIDS', style: 'MODERN', color: 'Green', basePrice: 240000, isBestSeller: true },
    { name: 'Mini Round', frameShape: 'ROUND', material: 'ACETATE', gender: 'KIDS', style: 'CLASSIC', color: 'Tortoise', basePrice: 290000 },
    { name: 'Adventure Square', frameShape: 'SQUARE', material: 'TR90', gender: 'KIDS', style: 'BOLD', color: 'Orange', basePrice: 230000, discountPrice: 199000 },
    { name: 'Little Oval', frameShape: 'OVAL', material: 'METAL', gender: 'KIDS', style: 'MINIMAL', color: 'Rose Gold', basePrice: 300000, isNewArrival: true },
  ];

  const all: Omit<ProductSeed, 'slug' | 'categoryIdPlaceholder'>[] = [
    ...menProducts, ...womenProducts, ...unisexProducts, ...kidsProducts,
  ];

  for (const p of all) {
    rows.push({ ...p, slug: generateSlug(p.name), categoryIdPlaceholder: catMap[p.gender] });
  }

  // Shuffle so products appear mixed across categories in catalog
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }

  return rows;
}

async function main() {
  console.log('🌱 Seeding Optic Luxe database (50+ products)...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.siteConfig.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 12);

  // ── Users ──
  const admin = await prisma.user.create({ data: { email: 'admin@opticluxe.com', password: hashedPassword, name: 'Admin Optic', role: 'ADMIN', phone: '081234567890' } });
  const staff1 = await prisma.user.create({ data: { email: 'staff@opticluxe.com', password: hashedPassword, name: 'Budi Staff', role: 'STAFF', phone: '081234567891' } });
  await prisma.staff.create({ data: { userId: staff1.id, position: 'WAREHOUSE' } });
  const staff2 = await prisma.user.create({ data: { email: 'cashier@opticluxe.com', password: hashedPassword, name: 'Ani Cashier', role: 'STAFF', phone: '081234567893' } });
  await prisma.staff.create({ data: { userId: staff2.id, position: 'CASHIER' } });
  const staff3 = await prisma.user.create({ data: { email: 'supervisor@opticluxe.com', password: hashedPassword, name: 'Doni Supervisor', role: 'STAFF', phone: '081234567894' } });
  await prisma.staff.create({ data: { userId: staff3.id, position: 'SUPERVISOR' } });
  const customer = await prisma.user.create({ data: { email: 'customer@opticluxe.com', password: hashedPassword, name: 'Sarah Wijaya', role: 'CUSTOMER', phone: '081234567892' } });
  const customer2 = await prisma.user.create({ data: { email: 'alex@example.com', password: hashedPassword, name: 'Alex Pranata', role: 'CUSTOMER', phone: '081234567895' } });

  // ── Addresses ──
  await prisma.address.create({ data: { userId: customer.id, label: 'Home', name: 'Sarah', phone: '081234567892', address: 'Jl. Sudirman No. 123, Senayan', city: 'Jakarta Selatan', province: 'DKI Jakarta', postalCode: '12190', isDefault: true } });
  await prisma.address.create({ data: { userId: customer.id, label: 'Office', name: 'Sarah Wijaya', phone: '081234567892', address: 'Jl. Thamrin No. 45, Menteng', city: 'Jakarta Pusat', province: 'DKI Jakarta', postalCode: '10340', isDefault: false } });

  // ── Categories ──
  const catMen = await prisma.category.create({ data: { name: 'Men', slug: 'men', description: 'Bold frames designed for the modern gentleman. From classic to contemporary.', sortOrder: 1, image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d82?w=400&auto=format&fit=crop' } });
  const catWomen = await prisma.category.create({ data: { name: 'Women', slug: 'women', description: 'Elegant and expressive eyewear that celebrates feminine style.', sortOrder: 2, image: 'https://images.unsplash.com/photo-1509696507120-5b9a8d69eb75?w=400&auto=format&fit=crop' } });
  const catUnisex = await prisma.category.create({ data: { name: 'Unisex', slug: 'unisex', description: 'Versatile designs that transcend gender. Style without boundaries.', sortOrder: 3, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&auto=format&fit=crop' } });
  const catKids = await prisma.category.create({ data: { name: 'Kids', slug: 'kids', description: 'Fun, durable eyewear designed for active young ones.', sortOrder: 4, image: 'https://images.unsplash.com/photo-1508522023215-7aff4e57cd4a?w=400&auto=format&fit=crop' } });

  // ── Build 51 products ──
  const products = buildCatalog(catMen.id, catWomen.id, catUnisex.id, catKids.id);

  const colorSets: Record<string, string[]> = {
    'Gold': ['Gold', 'Silver', 'Rose Gold'],
    'Antique Gold': ['Antique Gold', 'Silver'],
    'Silver': ['Silver', 'Gunmetal'],
    'Matte Silver': ['Matte Silver', 'Matte Black'],
    'Rose Gold': ['Rose Gold', 'Champagne'],
    'Black': ['Black', 'Dark Grey'],
    'Matte Black': ['Matte Black', 'Matte Navy'],
    'Matte Gunmetal': ['Matte Gunmetal', 'Matte Black'],
    'Gunmetal': ['Gunmetal', 'Matte Black'],
    'Tortoise': ['Tortoise', 'Dark Tortoise'],
    'Dark Tortoise': ['Dark Tortoise', 'Black'],
    'Havana': ['Havana', 'Dark Brown'],
    'Brown': ['Brown', 'Dark Brown'],
    'Dark Brown': ['Dark Brown', 'Brown'],
    'Crystal': ['Crystal', 'Frosted'],
    'Clear': ['Clear', 'Frosted'],
    'Clear Crystal': ['Clear Crystal', 'Frosted Crystal'],
    'Frosted Clear': ['Frosted Clear', 'Clear'],
    'Blue': ['Blue', 'Teal'],
    'Teal': ['Teal', 'Blue'],
    'Navy': ['Navy', 'Dark Grey'],
    'Red': ['Red', 'Burgundy'],
    'Pink': ['Pink', 'Rose'],
    'Blush Pink': ['Blush Pink', 'Rose Gold'],
    'Olive': ['Olive', 'Dark Green'],
    'Green': ['Green', 'Teal'],
    'Sage Green': ['Sage Green', 'Olive'],
    'Orange': ['Orange', 'Coral'],
    'Amber': ['Amber', 'Tortoise'],
  };
  const colorHexes: Record<string, string> = {
    'Gold': '#D4AF37', 'Antique Gold': '#B8860B', 'Silver': '#C0C0C0',
    'Matte Silver': '#A8A8A8', 'Rose Gold': '#B76E79', 'Champagne': '#F7E7CE',
    'Black': '#1a1a1a', 'Matte Black': '#1a1a1a', 'Dark Grey': '#4a4a4a',
    'Matte Navy': '#1a1a3a', 'Gunmetal': '#2A3439', 'Matte Gunmetal': '#2A3439',
    'Tortoise': '#8B6914', 'Dark Tortoise': '#6B4914', 'Havana': '#8B5A2B',
    'Brown': '#8B4513', 'Dark Brown': '#3B2314', 'Crystal': '#E8E8E8',
    'Clear': '#E8E8E8', 'Clear Crystal': '#F0F0F0', 'Frosted': '#E0E0E0',
    'Frosted Crystal': '#E8E8E8', 'Blue': '#3B82F6', 'Teal': '#14B8A6',
    'Navy': '#1e3a5f', 'Red': '#DC2626', 'Burgundy': '#800020',
    'Pink': '#EC4899', 'Rose': '#F43F5E', 'Blush Pink': '#F4A0B0',
    'Olive': '#708238', 'Dark Green': '#2D5A27', 'Green': '#22C55E',
    'Sage Green': '#9CAF88', 'Orange': '#F97316', 'Coral': '#FF6B6B',
    'Amber': '#D97706',
  };

  for (const p of products) {
    const shapeLabel = shapeLabels[p.frameShape] || p.frameShape.toLowerCase();
    const materialLabel = materialLabels[p.material] || p.material.toLowerCase();
    const template = pickRandom(descTemplates);
    const desc = template.replace('{shape}', shapeLabel).replace('{material}', materialLabel).replace('{color}', p.color.toLowerCase());

    const product = await prisma.product.create({
      data: {
        name: p.name, slug: p.slug, sku: `OPT-${p.slug.toUpperCase()}`,
        description: desc, brand: 'Optic Luxe', categoryId: p.categoryIdPlaceholder!,
        frameShape: p.frameShape, material: p.material, gender: p.gender, style: p.style, color: p.color,
        basePrice: p.basePrice, discountPrice: p.discountPrice || null,
        isFeatured: !!p.isFeatured, isNewArrival: !!p.isNewArrival, isBestSeller: !!p.isBestSeller,
        isActive: true, createdBy: admin.id,
      },
    });

    // Variants
    const baseColor = p.color;
    const colors = colorSets[baseColor] || [baseColor];
    for (const c of colors) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `OPT-${p.slug.toUpperCase()}-${c.toUpperCase().replace(/ /g, '')}`,
          colorName: c,
          colorHex: colorHexes[c] || null,
          stockQty: Math.floor(Math.random() * 30) + 10,
          minStockQty: 5,
        },
      });
    }

    // Images — 2 per product from unsplash rotation
    const img1 = unsplashEyewear[Math.floor(Math.random() * unsplashEyewear.length)];
    const img2 = unsplashEyewear[Math.floor(Math.random() * unsplashEyewear.length)];
    await prisma.productImage.create({ data: { productId: product.id, url: img1, alt: p.name, sortOrder: 0, isPrimary: true } });
    await prisma.productImage.create({ data: { productId: product.id, url: img2, alt: `${p.name} Angle`, sortOrder: 1 } });
  }

  console.log(`   ✅ ${products.length} products created`);

  // ── Reviews (spread across products) ──
  for (const p of products) {
    const product = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!product) continue;
    await prisma.review.create({ data: { userId: customer.id, productId: product.id, rating: Math.floor(Math.random() * 2) + 4, comment: pickRandom(reviewComments) } });
    if (Math.random() > 0.4) {
      await prisma.review.create({ data: { userId: customer2.id, productId: product.id, rating: Math.floor(Math.random() * 2) + 3, comment: pickRandom(reviewComments) } });
    }
  }

  // ── Cart for customer ──
  const cart = await prisma.cart.create({ data: { userId: customer.id } });
  const prodCart1 = await prisma.product.findFirst({ where: { isBestSeller: true } });
  const prodCart2 = await prisma.product.findFirst({ where: { isNewArrival: true } });
  const varCart1 = prodCart1 ? await prisma.productVariant.findFirst({ where: { productId: prodCart1.id } }) : null;
  const varCart2 = prodCart2 ? await prisma.productVariant.findFirst({ where: { productId: prodCart2.id } }) : null;
  if (prodCart1 && varCart1) await prisma.cartItem.create({ data: { cartId: cart.id, productId: prodCart1.id, variantId: varCart1.id, quantity: 1 } });
  if (prodCart2 && varCart2) await prisma.cartItem.create({ data: { cartId: cart.id, productId: prodCart2.id, variantId: varCart2.id, quantity: 2 } });

  // ── Sample Orders ──
  const staff1Record = await prisma.staff.findUnique({ where: { userId: staff1.id } });
  const staffId = staff1Record!.id;
  const addr = await prisma.address.findFirst({ where: { userId: customer.id } });

  const firstProd = await prisma.product.findFirst({ orderBy: { createdAt: 'asc' } });
  const secondProd = await prisma.product.findFirst({ orderBy: { createdAt: 'asc' }, skip: 0 });
  const thirdProd = (await prisma.product.findMany({ take: 5 }))[4];

  if (firstProd && addr) {
    const v1 = await prisma.productVariant.findFirst({ where: { productId: firstProd.id } });
    if (v1) {
      const price1 = firstProd.discountPrice || firstProd.basePrice;
      const order1 = await prisma.order.create({ data: { orderNumber: 'ORD-20260501-0001', userId: customer.id, addressId: addr.id, status: 'COMPLETED', subtotal: price1, shippingCost: 0, discountAmount: 0, totalAmount: price1, shippingMethod: 'STANDARD', shippingName: 'Sarah', shippingPhone: '081234567892', shippingAddress: addr.address, shippingCity: addr.city, shippingProvince: addr.province, shippingPostal: addr.postalCode, createdAt: new Date('2026-05-01') } });
      await prisma.orderItem.create({ data: { orderId: order1.id, productId: firstProd.id, variantId: v1.id, quantity: 1, unitPrice: price1, totalPrice: price1 } });
      await prisma.payment.create({ data: { orderId: order1.id, paymentMethod: 'BANK_TRANSFER', paymentStatus: 'VERIFIED', amount: order1.totalAmount, verifiedAt: new Date('2026-05-02'), verifiedBy: staffId } });
      await prisma.shipment.create({ data: { orderId: order1.id, staffId: staffId, courier: 'JNE', trackingNumber: 'JNE1234567890', status: 'DELIVERED', shippedAt: new Date('2026-05-03'), deliveredAt: new Date('2026-05-05') } });
      await prisma.invoice.create({ data: { orderId: order1.id, invoiceNumber: 'INV-20260501-0001', issuedAt: new Date('2026-05-02') } });
    }
  }

  if (thirdProd && addr) {
    const v3 = await prisma.productVariant.findFirst({ where: { productId: thirdProd.id } });
    if (v3) {
      const price3 = thirdProd.basePrice * 2;
      const order2 = await prisma.order.create({ data: { orderNumber: 'ORD-20260520-0002', userId: customer.id, addressId: addr.id, status: 'PENDING', subtotal: price3, shippingCost: 0, discountAmount: 0, totalAmount: price3, shippingMethod: 'STANDARD', shippingName: 'Sarah', shippingPhone: '081234567892', shippingAddress: addr.address, shippingCity: addr.city, shippingProvince: addr.province, shippingPostal: addr.postalCode, createdAt: new Date('2026-05-20') } });
      await prisma.orderItem.create({ data: { orderId: order2.id, productId: thirdProd.id, variantId: v3.id, quantity: 2, unitPrice: thirdProd.basePrice, totalPrice: price3 } });
      await prisma.payment.create({ data: { orderId: order2.id, paymentMethod: 'E_WALLET', paymentStatus: 'PENDING', amount: order2.totalAmount } });
    }
  }

  // ── Wishlist ──
  const wl1 = await prisma.product.findFirst({ where: { isFeatured: true } });
  const wl2 = await prisma.product.findFirst({ where: { isBestSeller: true, isFeatured: false } });
  if (wl1) await prisma.wishlistItem.create({ data: { userId: customer.id, productId: wl1.id } });
  if (wl2) await prisma.wishlistItem.create({ data: { userId: customer.id, productId: wl2.id } });

  // ── Site config ──
  await prisma.siteConfig.create({ data: { siteName: 'Optic Luxe', tagline: 'See the World in Style', heroTitle: 'Discover Your Perfect Frame', heroSubtitle: 'Premium eyewear crafted for clarity, comfort, and confidence.', aboutText: 'Optic Luxe brings together exceptional craftsmanship and modern design. Founded in 2010, we curate the finest eyewear from around the world.', contactEmail: 'hello@opticluxe.com', contactPhone: '+62 21 1234 5678', socialIg: '@opticluxe', socialFb: 'opticluxe', socialTw: '@opticluxe' } });

  console.log('✅ Seed complete!');
  console.log(`📦 ${products.length} products across 4 categories`);
  console.log('📧 admin@opticluxe.com / password123 (ADMIN)');
  console.log('📧 staff@opticluxe.com / password123 (STAFF)');
  console.log('📧 customer@opticluxe.com / password123 (CUSTOMER)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
