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

  const all = [...menProducts, ...womenProducts, ...unisexProducts, ...kidsProducts];

  for (const p of all) {
    rows.push({ ...p, slug: generateSlug(p.name), categoryIdPlaceholder: catMap[p.gender] });
  }

  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }

  return rows;
}

async function main() {
  console.log('Seeding Optic Luxe database...');

  await prisma.auditLog.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.reviewImage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.shipmentHistory.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productVariantImage.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.siteConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.offlineSaleItem.deleteMany();
  await prisma.offlineSale.deleteMany();
  await prisma.procurementItem.deleteMany();
  await prisma.procurement.deleteMany();
  await prisma.inventoryMovement.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({ data: { email: 'admin@opticluxe.com', password: hashedPassword, name: 'Admin Optic', role: 'ADMIN', phone: '081234567890' } });
  const staff1 = await prisma.user.create({ data: { email: 'staff@opticluxe.com', password: hashedPassword, name: 'Budi Staff', role: 'STAFF', phone: '081234567891' } });
  const staffRecord1 = await prisma.staff.create({ data: { userId: staff1.id, position: 'WAREHOUSE' } });
  const staff2 = await prisma.user.create({ data: { email: 'cashier@opticluxe.com', password: hashedPassword, name: 'Ani Cashier', role: 'STAFF', phone: '081234567893' } });
  const staffRecord2 = await prisma.staff.create({ data: { userId: staff2.id, position: 'CASHIER' } });
  const staff3 = await prisma.user.create({ data: { email: 'supervisor@opticluxe.com', password: hashedPassword, name: 'Doni Supervisor', role: 'STAFF', phone: '081234567894' } });
  await prisma.staff.create({ data: { userId: staff3.id, position: 'SUPERVISOR' } });
  const customer = await prisma.user.create({ data: { email: 'customer@opticluxe.com', password: hashedPassword, name: 'Sarah Wijaya', role: 'CUSTOMER', phone: '081234567892' } });
  const customer2 = await prisma.user.create({ data: { email: 'alex@example.com', password: hashedPassword, name: 'Alex Pranata', role: 'CUSTOMER', phone: '081234567895' } });

  const addrSarah = await prisma.address.create({ data: { userId: customer.id, label: 'Home', name: 'Sarah', phone: '081234567892', address: 'Jl. Sudirman No. 123, Senayan', city: 'Jakarta Selatan', province: 'DKI Jakarta', postalCode: '12190', isDefault: true } });
  await prisma.address.create({ data: { userId: customer.id, label: 'Office', name: 'Sarah Wijaya', phone: '081234567892', address: 'Jl. Thamrin No. 45, Menteng', city: 'Jakarta Pusat', province: 'DKI Jakarta', postalCode: '10340', isDefault: false } });
  await prisma.address.create({ data: { userId: customer2.id, label: 'Home', name: 'Alex', phone: '081234567895', address: 'Jl. Gatot Subroto No. 88, Senayan', city: 'Jakarta Selatan', province: 'DKI Jakarta', postalCode: '12190', isDefault: true } });

  const catMen = await prisma.category.create({ data: { name: 'Men', slug: 'men', description: 'Bold frames designed for the modern gentleman. From classic to contemporary.', sortOrder: 1, image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d82?w=400&auto=format&fit=crop' } });
  const catWomen = await prisma.category.create({ data: { name: 'Women', slug: 'women', description: 'Elegant and expressive eyewear that celebrates feminine style.', sortOrder: 2, image: 'https://images.unsplash.com/photo-1509696507120-5b9a8d69eb75?w=400&auto=format&fit=crop' } });
  const catUnisex = await prisma.category.create({ data: { name: 'Unisex', slug: 'unisex', description: 'Versatile designs that transcend gender. Style without boundaries.', sortOrder: 3, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&auto=format&fit=crop' } });
  const catKids = await prisma.category.create({ data: { name: 'Kids', slug: 'kids', description: 'Fun, durable eyewear designed for active young ones.', sortOrder: 4, image: 'https://images.unsplash.com/photo-1508522023215-7aff4e57cd4a?w=400&auto=format&fit=crop' } });

  const catSunglasses = await prisma.category.create({ data: { name: 'Sunglasses', slug: 'sunglasses', description: 'Premium UV protection sunglasses.', sortOrder: 5, image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400&auto=format&fit=crop' } });
  const catPolarized = await prisma.category.create({ data: { name: 'Polarized', slug: 'polarized', description: 'Polarized lenses for glare-free vision.', sortOrder: 6, parentId: catSunglasses.id, image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400&auto=format&fit=crop' } });
  const catSports = await prisma.category.create({ data: { name: 'Sports', slug: 'sports', description: 'Performance eyewear for active lifestyles.', sortOrder: 7, parentId: catSunglasses.id, image: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=400&auto=format&fit=crop' } });

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

  const createdProducts: Awaited<ReturnType<typeof prisma.product.create>>[] = [];

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
    createdProducts.push(product);

    const baseColor = p.color;
    const colors = colorSets[baseColor] || [baseColor];
    for (const c of colors) {
      const priceOffset = c !== baseColor && Math.random() > 0.7 ? (Math.random() * 30000 - 15000) : 0;
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `OPT-${p.slug.toUpperCase()}-${c.toUpperCase().replace(/ /g, '')}`,
          colorName: c,
          colorHex: colorHexes[c] || null,
          stockQty: Math.floor(Math.random() * 30) + 10,
          minStockQty: 5,
          priceOffset,
          isActive: true,
        },
      });

      const img1 = unsplashEyewear[Math.floor(Math.random() * unsplashEyewear.length)];
      const img2 = unsplashEyewear[Math.floor(Math.random() * unsplashEyewear.length)];
      await prisma.productVariantImage.create({ data: { variantId: variant.id, url: img1, alt: `${p.name} - ${c}`, sortOrder: 0, isPrimary: true } });
      await prisma.productVariantImage.create({ data: { variantId: variant.id, url: img2, alt: `${p.name} - ${c} Side`, sortOrder: 1 } });
    }

    const img1 = unsplashEyewear[Math.floor(Math.random() * unsplashEyewear.length)];
    const img2 = unsplashEyewear[Math.floor(Math.random() * unsplashEyewear.length)];
    await prisma.productImage.create({ data: { productId: product.id, url: img1, alt: p.name, sortOrder: 0, isPrimary: true } });
    await prisma.productImage.create({ data: { productId: product.id, url: img2, alt: `${p.name} Alternate`, sortOrder: 1 } });
  }

  console.log(`   ${products.length} products created`);

  for (const p of products) {
    const product = createdProducts.find(x => x.slug === p.slug);
    if (!product) continue;
    await prisma.review.create({ data: { userId: customer.id, productId: product.id, rating: Math.floor(Math.random() * 2) + 4, comment: pickRandom(reviewComments), isVerified: false, isApproved: true, title: pickRandom(['Great!', 'Love it', 'Perfect fit', 'Excellent quality', 'Highly recommended']) } });
    if (Math.random() > 0.4) {
      await prisma.review.create({ data: { userId: customer2.id, productId: product.id, rating: Math.floor(Math.random() * 2) + 3, comment: pickRandom(reviewComments), isVerified: false, isApproved: true } });
    }
  }

  const cart = await prisma.cart.create({ data: { userId: customer.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  const prodCart1 = await prisma.product.findFirst({ where: { isBestSeller: true } });
  const prodCart2 = await prisma.product.findFirst({ where: { isNewArrival: true } });
  const varCart1 = prodCart1 ? await prisma.productVariant.findFirst({ where: { productId: prodCart1.id } }) : null;
  const varCart2 = prodCart2 ? await prisma.productVariant.findFirst({ where: { productId: prodCart2.id } }) : null;
  if (prodCart1 && varCart1) {
    const price1 = prodCart1.discountPrice || prodCart1.basePrice;
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: prodCart1.id, variantId: varCart1.id, quantity: 1, unitPrice: price1 } });
  }
  if (prodCart2 && varCart2) {
    const price2 = prodCart2.discountPrice || prodCart2.basePrice;
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: prodCart2.id, variantId: varCart2.id, quantity: 2, unitPrice: price2 } });
  }

  const firstProd = await prisma.product.findFirst({ orderBy: { createdAt: 'asc' } });
  const thirdProd = (await prisma.product.findMany({ take: 5 }))[4];
  const fifthProd = (await prisma.product.findMany({ take: 10 }))[8];

  if (firstProd && addrSarah) {
    const v1 = await prisma.productVariant.findFirst({ where: { productId: firstProd.id } });
    if (v1) {
      const price1 = firstProd.discountPrice || firstProd.basePrice;
      const order1 = await prisma.order.create({
        data: {
          orderNumber: 'ORD-20260501-0001',
          userId: customer.id,
          addressId: addrSarah.id,
          status: 'COMPLETED',
          saleChannel: 'ONLINE',
          subtotal: price1,
          shippingCost: 0,
          discountAmount: 0,
          totalAmount: price1,
          completedAt: new Date('2026-05-05'),
        },
      });
      await prisma.orderItem.create({ data: { orderId: order1.id, productId: firstProd.id, variantId: v1.id, quantity: 1, unitPrice: price1, totalPrice: price1 } });
      await prisma.payment.create({
        data: {
          orderId: order1.id,
          paymentMethod: 'BANK_TRANSFER',
          paymentGateway: 'DUMMY',
          paymentStatus: 'VERIFIED',
          amount: order1.totalAmount,
          paidAt: new Date('2026-05-02'),
          verifiedAt: new Date('2026-05-02'),
          verifiedBy: admin.id,
          gatewayTransactionId: 'TXN-BANK-20260502-0001',
          gatewayResponse: { bank: 'BCA', vaNumber: '1234567890' },
        },
      });
      const shipment = await prisma.shipment.create({
        data: {
          orderId: order1.id,
          staffId: staffRecord1.id,
          courier: 'JNE',
          trackingNumber: 'JNE1234567890',
          estimatedDelivery: new Date('2026-05-04'),
          status: 'DELIVERED',
          shippedAt: new Date('2026-05-03'),
          deliveredAt: new Date('2026-05-05'),
        },
      });
      await prisma.shipmentHistory.create({ data: { shipmentId: shipment.id, status: 'PENDING', notes: 'Order confirmed, preparing shipment', location: 'Optic Luxe Warehouse', createdBy: staffRecord1.userId } });
      await prisma.shipmentHistory.create({ data: { shipmentId: shipment.id, status: 'PICKED_UP', notes: 'Package picked up by JNE courier', location: 'Jakarta Hub', createdBy: staffRecord1.userId } });
      await prisma.shipmentHistory.create({ data: { shipmentId: shipment.id, status: 'IN_TRANSIT', notes: 'In transit to destination city', location: 'Surabaya Sorting Center', createdBy: staffRecord1.userId } });
      await prisma.shipmentHistory.create({ data: { shipmentId: shipment.id, status: 'OUT_FOR_DELIVERY', notes: 'Out for delivery', location: 'Jakarta Selatan', createdBy: staffRecord1.userId } });
      await prisma.shipmentHistory.create({ data: { shipmentId: shipment.id, status: 'DELIVERED', notes: 'Delivered to recipient', location: 'Jl. Sudirman No. 123', createdBy: staffRecord1.userId } });
      await prisma.invoice.create({
        data: {
          orderId: order1.id,
          invoiceNumber: 'INV/2026/0001',
          issuedAt: new Date('2026-05-02'),
          paidAt: new Date('2026-05-02'),
          totalAmount: order1.totalAmount,
          status: 'PAID',
        },
      });
    }
  }

  if (thirdProd && addrSarah) {
    const v3 = await prisma.productVariant.findFirst({ where: { productId: thirdProd.id } });
    if (v3) {
      const price3 = thirdProd.basePrice * 2;
      await prisma.order.create({
        data: {
          orderNumber: 'ORD-20260520-0002',
          userId: customer.id,
          addressId: addrSarah.id,
          status: 'PENDING',
          saleChannel: 'ONLINE',
          subtotal: price3,
          shippingCost: 0,
          discountAmount: 0,
          totalAmount: price3,
        },
      });
    }
  }

  if (fifthProd) {
    const v5 = await prisma.productVariant.findFirst({ where: { productId: fifthProd.id } });
    if (v5) {
      const price5 = fifthProd.basePrice;
      await prisma.order.create({
        data: {
          orderNumber: 'ORD-20260522-0003',
          userId: customer2.id,
          status: 'PROCESSING',
          saleChannel: 'ONLINE',
          subtotal: price5,
          shippingCost: 15000,
          discountAmount: 0,
          totalAmount: price5 + 15000,
        },
      });
    }
  }

  const wl1 = await prisma.product.findFirst({ where: { isFeatured: true } });
  const wl2 = await prisma.product.findFirst({ where: { isBestSeller: true, isFeatured: false } });
  if (wl1) await prisma.wishlistItem.create({ data: { userId: customer.id, productId: wl1.id, addedAt: new Date() } });
  if (wl2) await prisma.wishlistItem.create({ data: { userId: customer.id, productId: wl2.id, addedAt: new Date() } });

  await prisma.procurement.create({
    data: {
      poNumber: 'PO-20260501-0001',
      supplier: 'Luxottica Indonesia',
      status: 'RECEIVED',
      totalAmount: 12500000,
      notes: 'Restock order for bestsellers',
      orderedAt: new Date('2026-04-15'),
      receivedAt: new Date('2026-04-25'),
      createdBy: admin.id,
      receivedBy: staff1.id,
      items: {
        create: [
          { productId: firstProd!.id, quantity: 50, receivedQty: 50, unitPrice: 250000, totalPrice: 12500000 },
        ],
      },
    },
  });

  const posProduct = await prisma.product.findFirst();
  const posVariant = posProduct ? await prisma.productVariant.findFirst({ where: { productId: posProduct.id } }) : null;
  if (posVariant && posProduct) {
    const offlineSale = await prisma.offlineSale.create({
      data: {
        saleNumber: 'POS-20260522-0001',
        cashierId: staff2.id,
        staffId: staffRecord2.id,
        saleChannel: 'WALK_IN',
        customerName: 'Rina Kapoor',
        customerPhone: '081234556677',
        subtotal: posProduct.basePrice,
        discountAmount: 0,
        totalAmount: posProduct.basePrice,
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
      },
    });
    await prisma.offlineSaleItem.create({
      data: {
        saleId: offlineSale.id,
        productId: posProduct.id,
        variantId: posVariant.id,
        quantity: 1,
        unitPrice: posProduct.basePrice,
        totalPrice: posProduct.basePrice,
      },
    });
  }

  await prisma.siteConfig.create({
    data: {
      siteName: 'Optic Luxe',
      tagline: 'See the World in Style',
      heroTitle: 'Discover Your Perfect Frame',
      heroSubtitle: 'Premium eyewear crafted for clarity, comfort, and confidence.',
      aboutText: 'Optic Luxe brings together exceptional craftsmanship and modern design.',
      contactEmail: 'hello@opticluxe.com',
      contactPhone: '+62 21 1234 5678',
      socialIg: '@opticluxe',
      socialFb: 'opticluxe',
      socialTw: '@opticluxe',
    },
  });

  console.log('Seed complete!');
  console.log(`${products.length} products across 6 categories (incl. Sunglasses subcategories)`);
  console.log('admin@opticluxe.com / password123 (ADMIN)');
  console.log('staff@opticluxe.com / password123 (STAFF)');
  console.log('cashier@opticluxe.com / password123 (CASHIER)');
  console.log('customer@opticluxe.com / password123 (CUSTOMER)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());