"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ShoppingBag, User, Heart, Search, Sun, Moon } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { useTheme } from "@/lib/theme-provider";
import { Button } from "@/components/ui";

const navigation = [
  { name: "Home", href: "/home" },
  { name: "Shop", href: "/shop" },
  { name: "Collections", href: "/collections" },
  { name: "About", href: "/about" },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-brand-100/80 backdrop-blur-md border-b border-brand-100">
        <nav className="container-wide flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-8">
            <Link href="/home" className="text-2xl font-serif font-semibold text-brand-950">
              Optic Luxe
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-brand-600",
                    pathname === item.href
                      ? "text-brand-950"
                      : "text-brand-600"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="/shop"
              aria-label="Search"
              className="p-2 text-brand-600 hover:text-brand-950 transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>

            <button
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 text-brand-600 hover:text-brand-950 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link
              href="/wishlist"
              className="p-2 text-brand-600 hover:text-brand-950 transition-colors"
            >
              <Heart className="w-5 h-5" />
            </Link>

            <Link
              href="/cart"
              className="p-2 text-brand-600 hover:text-brand-950 transition-colors relative"
            >
              <ShoppingBag className="w-5 h-5" />
            </Link>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" leftIcon={<User className="w-4 h-4" />}>
                    {user?.name?.split(" ")[0]}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-brand-600 md:hidden"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-brand-100 border-t border-brand-100">
            <div className="container-wide py-4 space-y-2">
              <button
                onClick={() => { toggle(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "block px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    pathname === item.href
                      ? "bg-brand-100 text-brand-950"
                      : "text-brand-600 hover:bg-brand-50"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-brand-100 space-y-2">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className="block px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg">
                      My Account
                    </Link>
                    <button
                      onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg">
                      Login
                    </Link>
                    <Link href="/register" className="block px-4 py-2 text-sm font-medium bg-brand-950 text-white rounded-lg text-center">
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="bg-brand-950 text-brand-200 py-16">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            <div className="space-y-4">
              <h3 className="text-xl font-serif text-white">Optic Luxe</h3>
              <p className="text-sm text-brand-300 leading-relaxed">
                Premium eyewear for those who appreciate fine craftsmanship and timeless style.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Shop</h4>
              <ul className="space-y-2">
                <li><Link href="/shop" className="text-sm hover:text-white transition-colors">All Frames</Link></li>
                <li><Link href="/collections" className="text-sm hover:text-white transition-colors">Collections</Link></li>
                <li><Link href="/shop?gender=men" className="text-sm hover:text-white transition-colors">Men</Link></li>
                <li><Link href="/shop?gender=women" className="text-sm hover:text-white transition-colors">Women</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-sm hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/shipping" className="text-sm hover:text-white transition-colors">Shipping Info</Link></li>
                <li><Link href="/returns" className="text-sm hover:text-white transition-colors">Returns</Link></li>
                <li><Link href="/contact" className="text-sm hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Newsletter</h4>
              <p className="text-sm text-brand-300 mb-4">Subscribe for exclusive offers and new arrivals.</p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2 bg-brand-800 border border-brand-700 rounded-full text-sm text-white placeholder:text-brand-500 focus:outline-none focus:border-brand-500"
                />
                <button type="submit" className="px-4 py-2 bg-accent-gold text-brand-950 rounded-full text-sm font-medium hover:bg-accent-gold-light transition-colors">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-brand-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-brand-400">
              &copy; {new Date().getFullYear()} Optic Luxe. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-brand-400 hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-sm text-brand-400 hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}