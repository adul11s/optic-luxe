"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-provider";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  FileText,
  Users,
  Settings,
  ShoppingBag,
  Heart,
  LogOut,
  Menu,
  X,
  Warehouse,
  Store,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const staffNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Warehouse", href: "/dashboard/warehouse", icon: Warehouse },
  { label: "POS", href: "/dashboard/pos", icon: Store },
  { label: "Inventory", href: "/dashboard/inventory", icon: Package },
  { label: "Payments", href: "/dashboard/payments", icon: FileText },
  { label: "Shipments", href: "/dashboard/shipments", icon: Truck },
  { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
];

const adminNav: NavItem[] = [
  ...staffNav,
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Products", href: "/dashboard/products", icon: ShoppingBag },
  { label: "Categories", href: "/dashboard/categories", icon: Package },
  { label: "Analytics", href: "/dashboard/analytics", icon: LayoutDashboard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const customerNav: NavItem[] = [
  { label: "My Orders", href: "/account/orders", icon: ShoppingBag },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart },
  { label: "Addresses", href: "/account/addresses", icon: Package },
  { label: "Account", href: "/account", icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(true);

  if (!user) {
    router.push("/login");
    return null;
  }

  const role = user.role;
  const navItems = role === "ADMIN" ? adminNav : role === "STAFF" ? staffNav : customerNav;

  const handleLogout = () => {
    logout();
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-brand-50 flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-brand-100 transform transition-transform duration-300 lg:translate-x-0 lg:static",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-brand-100">
            <Link href="/home" className="text-xl font-serif font-semibold text-brand-950">
              Optic Luxe
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-950 text-white flex items-center justify-center font-semibold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-brand-950 text-sm">{user.name}</p>
                <Badge variant={role === "ADMIN" ? "danger" : role === "STAFF" ? "warning" : "default"} size="sm">
                  {role}
                </Badge>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-950 text-white"
                      : "text-brand-600 hover:bg-brand-100 hover:text-brand-950"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                  {item.badge && (
                    <Badge variant="danger" size="sm" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-brand-100 space-y-1">
            <Link
              href="/home"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-brand-600 hover:bg-brand-100 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Back to Store
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-brand-100">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg lg:hidden"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden md:flex items-center gap-2 text-sm text-brand-500">
              <Link href="/dashboard" className="hover:text-brand-700">Dashboard</Link>
              <span>/</span>
              <span className="text-brand-950 capitalize">
                {pathname.split("/").pop()?.replace(/-/g, " ") || "Overview"}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-gold rounded-full" />
              </button>
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-medium">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-brand-950/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}