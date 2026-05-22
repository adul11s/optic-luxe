export type Role = "CUSTOMER" | "STAFF" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
}

export type FrameShape = "ROUND" | "SQUARE" | "RECTANGLE" | "CAT_EYE" | "AVIATOR" | "OVAL" | "BROWLINE" | "GEOMETRIC" | "BUTTERFLY" | "WAYFARER";
export type Material = "ACETATE" | "METAL" | "TITANIUM" | "TR90" | "WOOD" | "COMBINATION";
export type Gender = "MEN" | "WOMEN" | "UNISEX" | "KIDS";
export type Style = "CLASSIC" | "MODERN" | "VINTAGE" | "MINIMAL" | "BOLD";

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  colorName?: string;
  colorHex?: string;
  sizeLabel?: string;
  stockQty: number;
  minStockQty: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  brand: string;
  categoryId: string;
  category?: Category;
  frameShape?: FrameShape;
  material?: Material;
  gender?: Gender;
  style?: Style;
  color?: string;
  basePrice: number;
  discountPrice?: number;
  images: ProductImage[];
  variants: ProductVariant[];
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "PACKED" | "SHIPPED" | "COMPLETED" | "CANCELLED";
export type ShippingMethod = "STANDARD" | "EXPRESS";

export interface ShippingAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user?: User;
  addressId?: string;
  shippingAddress?: ShippingAddress;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  shippingMethod?: ShippingMethod;
  notes?: string;
  items: OrderItem[];
  payment?: Payment;
  shipment?: Shipment;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = "BANK_TRANSFER" | "E_WALLET" | "CREDIT_CARD";
export type PaymentStatus = "PENDING" | "VERIFIED" | "FAILED" | "REFUNDED";

export interface Payment {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amount: number;
  transactionId?: string;
  paymentProof?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
}

export type ShipmentStatus = "PENDING" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "RETURNED";

export interface Shipment {
  id: string;
  orderId: string;
  staffId?: string;
  courier?: string;
  trackingNumber?: string;
  status: ShipmentStatus;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  issuedAt: string;
  dueDate?: string;
  order?: Order;
}

export interface Review {
  id: string;
  userId: string;
  user?: User;
  productId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  createdAt: string;
}

export interface SiteConfig {
  siteName: string;
  tagline?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  aboutText?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialIg?: string;
  socialFb?: string;
  socialTw?: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockAlerts: number;
  recentOrders: Order[];
}

export interface AnalyticsData {
  monthlyRevenue: { month: string; revenue: number }[];
  topProducts: Product[];
  ordersByStatus: { status: string; count: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterOptions {
  genders: { value: Gender; label: string }[];
  shapes: { value: FrameShape; label: string }[];
  materials: { value: Material; label: string }[];
  colors: { value: string; label: string }[];
  priceRange: { min: number; max: number };
}