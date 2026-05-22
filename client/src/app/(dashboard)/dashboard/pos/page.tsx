"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ShoppingCart, DollarSign, Users, Search, Plus, Minus,
  Receipt, CreditCard, Banknote, User, Trash2, Check,
} from "lucide-react";
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Badge, Input, Select, Table, TableColumn, StatCard,
  Modal, ModalHeader, ModalBody, ModalFooter,
} from "@/components/ui";
import { api } from "@/lib/api";
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

  const { data: inventory } = useQuery({
    queryKey: ["pos", "inventory"],
    queryFn: () => api.get<{ data: { items: any[] } }>("/warehouse/inventory"),
  });

  const { data: sales } = useQuery({
    queryKey: ["pos", "sales"],
    queryFn: () => api.get<{ data: { data: OfflineSale[]; pagination: any } }>("/pos/sales"),
  });

  const { data: dashboard } = useQuery({
    queryKey: ["pos", "dashboard"],
    queryFn: () => api.get<{ data: any }>("/pos/dashboard"),
  });

  const createSale = useMutation({
    mutationFn: (data: any) => api.post("/pos/sale", data),
    onSuccess: (response: any) => {
      setLastSale(response.data.data);
      setShowReceipt(true);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      queryClient.invalidateQueries({ queryKey: ["pos"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });

  const products = inventory?.data?.data?.items?.filter((v: any) =>
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

  const submitSale = () => {
    if (cart.length === 0) return;
    createSale.mutate({
      items: cart.map(c => ({ variantId: c.variantId, quantity: c.quantity })),
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      paymentMethod,
    });
  };

  const salesData = sales?.data?.data?.data || [];
  const dashboardData = dashboard?.data?.data || {};

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
              <Input
                placeholder="Search product name or SKU..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 max-h-64 overflow-y-auto">
                {products.slice(0, 20).map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="p-3 border border-brand-200 rounded-xl text-left hover:border-brand-950 transition-colors text-sm"
                  >
                    <p className="font-medium text-brand-950 truncate">{p.product?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {p.colorHex && <span className="w-3 h-3 rounded-full border" style={{ background: p.colorHex }} />}
                      <span className="text-xs text-brand-500">{p.colorName}</span>
                    </div>
                    <p className="text-xs text-brand-600 mt-1">{formatPrice(p.product?.price)} • {p.stockQty} in stock</p>
                  </button>
                ))}
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