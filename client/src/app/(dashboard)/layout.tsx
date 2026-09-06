"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-provider";
import { authGet } from "@/lib/api";
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
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { Button, Badge, Input } from "@/components/ui";
import { useTheme } from "@/lib/theme-provider";

export const dynamic = "force-dynamic";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
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
  { label: "My Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
  { label: "Addresses", href: "/dashboard/addresses", icon: Package },
  { label: "Account", href: "/dashboard/account", icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, isHydrated } = useAuth();
  const { theme, toggle } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: statsResponse } = useQuery({
    queryKey: ["dashboard", "sidebar-stats"],
    queryFn: () => authGet<{ data: Record<string, number> }>("/dashboard/sidebar-stats"),
    enabled: !!user,
  });

  const stats = statsResponse?.data || {};

  useEffect(() => {
    if (isHydrated && !user) {
      router.push("/login");
    }
  }, [isHydrated, user, router]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-950 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <p className="text-brand-500">Redirecting to login...</p>
      </div>
    );
  }

  const role = user.role;

  const getNavWithBadges = (items: NavItem[]): NavItem[] => {
    return items.map((item) => {
      let badge: string | undefined;
      if (item.href === "/dashboard/orders" && role === "CUSTOMER" && stats.activeOrders > 0) {
        badge = String(stats.activeOrders);
      } else if (item.href === "/dashboard/orders" && stats.pendingOrders > 0) {
        badge = String(stats.pendingOrders);
      }
      if (item.href === "/dashboard/payments" && stats.pendingPayments > 0) badge = String(stats.pendingPayments);
      if (item.href === "/dashboard/warehouse" && stats.lowStockAlerts > 0) badge = String(stats.lowStockAlerts);
      if (item.href === "/dashboard/users" && stats.totalUsers > 0) badge = String(stats.totalUsers);
      if (item.href === "/dashboard/wishlist" && stats.wishlistItems > 0) badge = String(stats.wishlistItems);
      return { ...item, badge };
    });
  };

  const navItems = getNavWithBadges(
    role === "ADMIN" ? adminNav : role === "STAFF" ? staffNav : customerNav
  );

  const filteredNavItems = searchTerm
    ? navItems.filter((item) =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleLogout = () => {
    logout();
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-brand-50 flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-brand-100 border-r border-brand-100 transform transition-transform duration-300 lg:translate-x-0 lg:static",
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

          <div className="px-4 pt-4 pb-2" ref={searchRef}>
            <div className="relative min-w-0">
              <Input
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                leftIcon={<Search className="w-4 h-4" />}
                className="text-sm"
              />
              {isSearchOpen && searchTerm && filteredNavItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-brand-100 border border-brand-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                  {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          setIsSidebarOpen(false);
                          setSearchTerm("");
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <Icon className="w-4 h-4 text-brand-400" />
                        {item.label}
                        {item.badge && (
                          <Badge variant="danger" size="sm" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
              {isSearchOpen && searchTerm && filteredNavItems.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-brand-100 border border-brand-200 rounded-xl shadow-lg z-50 px-4 py-3 text-sm text-brand-500">
                  No results found
                </div>
              )}
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
            <button
              onClick={toggle}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-brand-600 hover:bg-brand-100 hover:text-brand-950 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
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
        <header className="sticky top-0 z-40 bg-brand-100/80 backdrop-blur-md border-b border-brand-100">
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