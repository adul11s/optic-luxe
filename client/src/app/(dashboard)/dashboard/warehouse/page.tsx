"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Package, AlertTriangle, TrendingDown, TrendingUp, History,
  Search, Plus, Minus, Truck, ArrowRight, RefreshCw,
} from "lucide-react";
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Badge, Input, Select, Table, TableColumn, StatCard,
  Modal, ModalHeader, ModalBody, ModalFooter,
} from "@/components/ui";
import { authGet, authPost } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface VariantItem {
  id: string; sku: string; colorName?: string; colorHex?: string;
  stockQty: number; minStockQty: number;
  product?: { id: string; name: string; slug: string; brand?: string; price: number; image?: string | null };
}

interface AlertItem {
  id: string; sku: string; colorName?: string; stockQty: number; minStockQty: number; severity: string;
  product?: { id: string; name: string; slug: string; image?: string | null };
}

interface MovementItem {
  id: string; type: string; quantity: number; balanceAfter: number; reference?: string; notes?: string; createdAt: string;
  variant?: { product?: { name: string } };
}

export default function WarehouseDashboardPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<VariantItem | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState("ADD");
  const [adjustNotes, setAdjustNotes] = useState("");

  const { data: inventory } = useQuery({
    queryKey: ["warehouse", "inventory"],
    queryFn: () => authGet<{ data: { overview: any; items: VariantItem[] } }>("/warehouse/inventory"),
  });

  const { data: alerts } = useQuery({
    queryKey: ["warehouse", "alerts"],
    queryFn: () => authGet<{ data: AlertItem[] }>("/warehouse/alerts"),
  });

  const { data: movements } = useQuery({
    queryKey: ["warehouse", "movements"],
    queryFn: () => authGet<{ data: { data: MovementItem[]; pagination: any } }>("/warehouse/movements"),
  });

  const adjustStock = useMutation({
    mutationFn: (data: { variantId: string; quantity: number; type: string; notes?: string }) =>
      authPost("/warehouse/stock/adjust", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
      setShowAdjustModal(false);
      setSelectedVariant(null);
    },
  });

  const overview = inventory?.data?.data?.overview;
  const items = inventory?.data?.data?.items || [];
  const alertItems = alerts?.data?.data || [];
  const movementItems = movements?.data?.data?.data || [];

  const filtered = items.filter(v =>
    !searchTerm ||
    v.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdjust = (variant: VariantItem) => {
    setSelectedVariant(variant);
    setAdjustQty(0);
    setAdjustType("ADD");
    setAdjustNotes("");
    setShowAdjustModal(true);
  };

  const submitAdjust = () => {
    if (!selectedVariant || adjustQty === 0) return;
    const qty = adjustType === "ADD" ? Math.abs(adjustQty) : -Math.abs(adjustQty);
    adjustStock.mutate({ variantId: selectedVariant.id, quantity: qty, type: adjustType, notes: adjustNotes });
  };

  const columns: TableColumn<VariantItem>[] = [
    {
      key: "product", header: "Product",
      render: (v) => (
        <div className="flex items-center gap-3">
          {v.product?.image && <img src={v.product.image} className="w-10 h-10 rounded-lg object-cover" />}
          <div>
            <p className="font-medium text-brand-950">{v.product?.name || v.sku}</p>
            <p className="text-xs text-brand-500">{v.sku} {v.colorName ? `— ${v.colorName}` : ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: "stock", header: "Stock",
      render: (v) => {
        const isLow = v.stockQty > 0 && v.stockQty <= v.minStockQty;
        const isOut = v.stockQty === 0;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-brand-950'}`}>
              {v.stockQty}
            </span>
            {isOut && <Badge variant="danger" size="sm">Out</Badge>}
            {isLow && <Badge variant="warning" size="sm">Low</Badge>}
          </div>
        );
      },
    },
    { key: "minStockQty", header: "Min", render: (v) => v.minStockQty },
    {
      key: "actions", header: "",
      render: (v) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" leftIcon={<Plus className="w-3 h-3" />} onClick={() => { setSelectedVariant(v); setAdjustQty(0); setAdjustType("ADD"); setAdjustNotes(""); setShowAdjustModal(true); }}>Add</Button>
          <Button variant="ghost" size="sm" leftIcon={<Minus className="w-3 h-3" />} onClick={() => { setSelectedVariant(v); setAdjustQty(0); setAdjustType("REDUCE"); setAdjustNotes(""); setShowAdjustModal(true); }}>Reduce</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-brand-950">Warehouse</h1>
        <p className="text-brand-600">Inventory & stock management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Stock" value={overview?.totalStock || 0} icon={<Package className="w-6 h-6" />} />
        <StatCard title="Products" value={overview?.totalProducts || 0} icon={<Package className="w-6 h-6" />} />
        <StatCard title="Low Stock" value={overview?.lowStockCount || 0} icon={<AlertTriangle className="w-6 h-6" />} className="border-amber-200 bg-amber-50/50" />
        <StatCard title="Out of Stock" value={overview?.outOfStockCount || 0} icon={<TrendingDown className="w-6 h-6" />} className="border-red-200 bg-red-50/50" />
      </div>

      {alertItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Low Stock Alerts ({alertItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alertItems.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-200">
                  <div className={`w-2 h-2 rounded-full ${a.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-brand-950 text-sm truncate">{a.product?.name}</p>
                    <p className="text-xs text-brand-500">{a.colorName} — {a.stockQty} left (min: {a.minStockQty})</p>
                  </div>
                  <Badge variant={a.severity === 'critical' ? 'danger' : 'warning'} size="sm">
                    {a.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
          <Input
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent className="p-0">
          <Table columns={columns} data={filtered} isLoading={!items.length} emptyMessage="No items found" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Stock Movements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {movementItems.slice(0, 10).map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-brand-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${m.type.includes('ADD') || m.type.includes('PROCUREMENT') ? 'bg-green-100 text-green-600' : m.type.includes('SOLD') ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                    {m.type.includes('ADD') || m.type.includes('PROCUREMENT') ? <TrendingUp className="w-4 h-4" /> :
                     m.type.includes('SOLD') ? <TrendingDown className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-950">{m.variant?.product?.name || 'Unknown'}</p>
                    <p className="text-xs text-brand-500">{m.type} • {m.reference || m.notes || '-'} • {formatDate(m.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </p>
                  <p className="text-xs text-brand-500">Balance: {m.balanceAfter}</p>
                </div>
              </div>
            ))}
            {movementItems.length === 0 && <p className="text-brand-500 text-center py-8">No movements recorded yet</p>}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)}>
        <ModalHeader>
          <h2 className="text-lg font-semibold">Adjust Stock</h2>
        </ModalHeader>
        <ModalBody>
          {selectedVariant && (
            <div className="space-y-4">
              <div className="p-3 bg-brand-50 rounded-xl">
                <p className="font-medium text-brand-950">{selectedVariant.product?.name}</p>
                <p className="text-sm text-brand-500">{selectedVariant.sku} • Current: {selectedVariant.stockQty}</p>
              </div>
              <Select
                label="Type"
                value={adjustType}
                onChange={e => setAdjustType(e.target.value)}
                options={[{ value: 'ADD', label: 'Add Stock' }, { value: 'REDUCE', label: 'Reduce Stock' }, { value: 'ADJUSTMENT', label: 'Correction' }]}
              />
              <Input
                label="Quantity"
                type="number"
                min={1}
                value={adjustQty}
                onChange={e => setAdjustQty(parseInt(e.target.value) || 0)}
                placeholder="Enter quantity"
              />
              <Input
                label="Notes"
                value={adjustNotes}
                onChange={e => setAdjustNotes(e.target.value)}
                placeholder="Reason for adjustment"
              />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowAdjustModal(false)}>Cancel</Button>
          <Button onClick={submitAdjust} isLoading={adjustStock.isPending}>
            {adjustType === 'ADD' ? 'Add Stock' : 'Reduce Stock'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}