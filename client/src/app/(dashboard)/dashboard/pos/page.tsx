"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ShoppingCart, DollarSign, Users, Search, Plus, Minus,
  Receipt, CreditCard, Banknote, User, Trash2, Check, Package,
} from "lucide-react";
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Badge, Input, Select, Table, TableColumn, StatCard,
  Modal, ModalHeader, ModalBody, ModalFooter, Pagination,
} from "@/components/ui";
import { authGet, authPost } from "@/lib/api";
import { swalConfirm, swalError, swalSuccess } from "@/lib/swal";
import { formatPrice, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface CartSessionItem {
  variantId: string; quantity: number;
  productName: string; colorName: string; sku: string;
  unitPrice: number; stock: number;
}

interface OfflineSale {
  id: string; saleNumber: string; customerName?: string;
  subtotal: number; discountAmount: number; totalAmount: number;
  paymentMethod: string; createdAt: string;
  items: Array<{ product: { name: string }; quantity: number }>;
}

export default function POSPage() {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartSessionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<OfflineSale | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [salesPage, setSalesPage] = useState(1);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: inventory } = useQuery({
    queryKey: ["warehouse", "inventory"],
    queryFn: () => authGet<{ data: { items: any[] } }>("/warehouse/inventory"),
  });

  const { data: sales } = useQuery({
    queryKey: ["pos", "sales", salesPage],
    queryFn: () => authGet<{ data: OfflineSale[]; meta: { total: number; page: number; limit: number; totalPages: number } }>("/pos/sales", { params: { page: salesPage, limit: 10 } }),
  });

  const { data: dashboard } = useQuery({
    queryKey: ["pos", "dashboard"],
    queryFn: () => authGet<{ data: any }>("/pos/dashboard"),
  });

  const createSale = useMutation({
    mutationFn: (data: any) => authPost("/pos/sale", data),
    onSuccess: (response: any) => {
      setLastSale(response.data);
      setShowReceipt(true);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      queryClient.invalidateQueries({ queryKey: ["pos"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
      swalSuccess("Sale completed");
    },
    onError: (err: any) => {
      swalError(err?.response?.data?.message || err?.message || "Something went wrong");
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const products = inventory?.data?.items?.filter((v: any) =>
    v.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.variantId === item.id);
    if (existing) {
      if (existing.quantity >= item.stockQty) return;
      setCart(cart.map(c => c.variantId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        variantId: item.id, quantity: 1,
        productName: item.product.name, colorName: item.colorName || '',
        sku: item.sku, unitPrice: item.product.price, stock: item.stockQty,
      }]);
    }
  };

  const removeFromCart = (variantId: string) => {
    setCart(cart.filter(c => c.variantId !== variantId));
  };

  const updateCartQty = (variantId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.variantId !== variantId) return c;
      const newQty = Math.max(0, c.quantity + delta);
      if (newQty > c.stock) return c;
      return { ...c, quantity: newQty };
    }).filter(c => c.quantity > 0));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
  const total = subtotal;

  const submitSale = async () => {
    if (cart.length === 0) return;
    const ok = await swalConfirm({
      title: "Complete sale?",
      text: `Confirm the total of ${formatPrice(total)} and complete the sale.`,
      confirmText: "Yes, complete",
    });
    if (!ok) return;
    createSale.mutate({
      items: cart.map(c => ({ variantId: c.variantId, quantity: c.quantity })),
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      paymentMethod,
    });
  };

  const salesData = sales?.data || [];
  const dashboardData = dashboard?.data || {};

  const saleColumns: TableColumn<OfflineSale>[] = [
    { key: "saleNumber", header: "Sale #", render: (s) => <span className="font-mono text-sm">{s.saleNumber}</span> },
    { key: "customer", header: "Customer", render: (s) => s.customerName || "Guest" },
    { key: "items", header: "Items", render: (s) => `${s.items?.length || 0} items` },
    { key: "totalAmount", header: "Total", render: (s) => <span className="font-semibold">{formatPrice(s.totalAmount)}</span> },
    { key: "paymentMethod", header: "Payment", render: (s) => <Badge variant={s.paymentMethod === 'CASH' ? 'default' : 'info'}>{s.paymentMethod}</Badge> },
    { key: "createdAt", header: "Date", render: (s) => formatDate(s.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-brand-950">Point of Sale</h1>
        <p className="text-brand-600">Offline sales & walk-in customers</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Today's Sales" value={dashboardData?.todayTransactionCount || 0} icon={<ShoppingCart className="w-6 h-6" />} />
        <StatCard title="Today's Revenue" value={formatPrice(dashboardData?.todayRevenue || 0)} icon={<DollarSign className="w-6 h-6" />} />
        <StatCard title="Pending Payments" value={dashboardData?.pendingPayments || 0} icon={<Banknote className="w-6 h-6" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Lookup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative" ref={searchRef}>
                <Input
                  placeholder="Search product name or SKU..."
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
                {isSearchOpen && searchTerm && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-brand-100 border border-brand-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                    {products.length > 0 ? (
                      products.slice(0, 20).map((p: any) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            addToCart(p);
                            setSearchTerm("");
                            setIsSearchOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-brand-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {p.product?.image ? (
                              <img src={p.product.image} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Package className="w-5 h-5 text-brand-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-950 truncate">{p.product?.name}</p>
                            <div className="flex items-center gap-2">
                              {p.colorHex && <span className="w-2.5 h-2.5 rounded-full border" style={{ background: p.colorHex }} />}
                              <span className="text-xs text-brand-500">{p.colorName} • {p.sku}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-brand-950">{formatPrice(p.product?.price)}</p>
                            <p className="text-xs text-brand-500">{p.stockQty} in stock</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-brand-500">No products found</div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Offline Sales</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table columns={saleColumns} data={salesData} emptyMessage="No offline sales yet" />
            </CardContent>
          </Card>
          {sales?.meta && sales.meta.totalPages > 1 && (
            <Pagination
              currentPage={salesPage}
              totalPages={sales.meta.totalPages}
              onPageChange={setSalesPage}
            />
          )}
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Current Sale
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-brand-500 text-center py-8">No items added</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map(c => (
                    <div key={c.variantId} className="flex items-center justify-between py-2 border-b border-brand-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-950 truncate">{c.productName}</p>
                        <p className="text-xs text-brand-500">{c.colorName} • {formatPrice(c.unitPrice)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <button onClick={() => updateCartQty(c.variantId, -1)} className="p-0.5 border rounded hover:bg-brand-100"><Minus className="w-3 h-3" /></button>
                          <span className="text-sm font-medium">{c.quantity}</span>
                          <button onClick={() => updateCartQty(c.variantId, 1)} className="p-0.5 border rounded hover:bg-brand-100"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-brand-950">{formatPrice(c.unitPrice * c.quantity)}</p>
                        <button onClick={() => removeFromCart(c.variantId)} className="text-red-500 text-xs mt-1 hover:underline">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <>
                  <div className="border-t border-brand-100 pt-4 mt-4 space-y-2">
                    <div className="flex justify-between text-sm text-brand-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                    <div className="flex justify-between text-lg font-semibold text-brand-950"><span>Total</span><span>{formatPrice(total)}</span></div>
                  </div>
                  <div className="space-y-3 mt-4">
                    <Input label="Customer Name" placeholder="Walk-in / Guest" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                    <Input label="Phone (optional)" placeholder="08xxxxxxxxxx" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                    <Select
                      label="Payment Method"
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      options={[{ value: 'CASH', label: 'Cash' }, { value: 'BANK_TRANSFER', label: 'Bank Transfer' }, { value: 'E_WALLET', label: 'E-Wallet' }]}
                    />
                    <Button className="w-full" size="lg" onClick={submitSale} isLoading={createSale.isPending} leftIcon={<Check className="w-5 h-5" />}>
                      Complete Sale
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)}>
        <ModalHeader>
          <h2 className="text-lg font-semibold">Sale Completed</h2>
        </ModalHeader>
        <ModalBody>
          {lastSale && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-brand-950">{formatPrice(lastSale.totalAmount)}</p>
                <p className="text-sm text-brand-500">Sale #{lastSale.saleNumber}</p>
                <Badge variant="success" className="mt-2">Paid</Badge>
              </div>
              <div className="border-t border-brand-100 pt-4">
                {lastSale.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between py-1 text-sm">
                    <span className="text-brand-600">{item.product?.name} × {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setShowReceipt(false)}>Close</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}