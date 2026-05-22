import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "Menunggu",
    CONFIRMED: "Dikonfirmasi",
    PROCESSING: "Diproses",
    PACKED: "Dikemas",
    SHIPPED: "Dikirim",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };
  return statusMap[status] || status;
}

export function formatPaymentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "Menunggu",
    VERIFIED: "Diverifikasi",
    FAILED: "Gagal",
    REFUNDED: "Dikembalikan",
  };
  return statusMap[status] || status;
}

export function formatShipmentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "Menunggu",
    PICKED_UP: "Diambil",
    IN_TRANSIT: "Dalam Pengiriman",
    DELIVERED: "Terkirim",
    RETURNED: "Dikembalikan",
  };
  return statusMap[status] || status;
}