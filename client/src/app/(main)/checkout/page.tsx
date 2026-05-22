"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Truck, CreditCard, Building2 } from "lucide-react";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Cart, ShippingAddress } from "@/types";
import { useAuth } from "@/lib/auth-provider";

const steps = [
  { id: "shipping", title: "Shipping", icon: Truck },
  { id: "payment", title: "Payment", icon: CreditCard },
  { id: "review", title: "Review", icon: Check },
];

const paymentMethods = [
  { value: "BANK_TRANSFER", label: "Bank Transfer", description: "Transfer to our bank account", icon: Building2 },
  { value: "E_WALLET", label: "E-Wallet", description: "Pay with GoPay/OVO/DANA", icon: CreditCard },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [shippingMethod, setShippingMethod] = useState<"STANDARD" | "EXPRESS">("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addressData, setAddressData] = useState({
    label: "Home",
    name: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
  });

  const createOrder = useMutation({
    mutationFn: (data: {
      shippingMethod: string;
      paymentMethod: string;
      shippingAddress: typeof addressData;
      notes?: string;
    }) => api.post<{ data: { id: string; orderNumber: string } }>("/orders", data),
    onSuccess: (response) => {
      router.push(`/order/${response.data.data.id}/confirmation`);
    },
    onError: () => {
      setIsSubmitting(false);
      alert("Failed to create order. Please try again.");
    },
  });

  const handleSubmit = () => {
    if (!paymentMethod) {
      alert("Please select a payment method");
      return;
    }

    setIsSubmitting(true);
    createOrder.mutate({
      shippingMethod,
      paymentMethod,
      shippingAddress: addressData,
      notes: notes || undefined,
    });
  };

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  const shippingCost = shippingMethod === "EXPRESS" ? 50000 : 0;
  const subtotal = 1500000;
  const total = subtotal + shippingCost;

  return (
    <div className="min-h-screen bg-brand-50">
      <div className="container-wide py-8">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-brand-600 hover:text-brand-950">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-serif font-semibold text-brand-950">Checkout</h1>
          <div className="w-20" />
        </div>

        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-brand-950 text-white"
                        : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-brand-100 text-brand-400"
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-2 ${isActive ? "text-brand-950 font-medium" : "text-brand-500"}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${index < currentStep ? "bg-green-600" : "bg-brand-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 0 && (
                <Card>
                  <h2 className="text-lg font-semibold text-brand-950 mb-6">Shipping Address</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Address Label"
                      options={[
                        { value: "Home", label: "Home" },
                        { value: "Office", label: "Office" },
                        { value: "Other", label: "Other" },
                      ]}
                      value={addressData.label}
                      onChange={(e) => setAddressData({ ...addressData, label: e.target.value })}
                    />
                    <Input
                      label="Recipient Name"
                      placeholder="Full name"
                      value={addressData.name}
                      onChange={(e) => setAddressData({ ...addressData, name: e.target.value })}
                    />
                    <Input
                      label="Phone Number"
                      placeholder="08xxxxxxxxxx"
                      value={addressData.phone}
                      onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })}
                    />
                    <Input
                      label="City"
                      placeholder="City name"
                      value={addressData.city}
                      onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                    />
                    <Input
                      label="Province"
                      placeholder="Province"
                      value={addressData.province}
                      onChange={(e) => setAddressData({ ...addressData, province: e.target.value })}
                    />
                    <Input
                      label="Postal Code"
                      placeholder="12345"
                      value={addressData.postalCode}
                      onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value })}
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Full Address"
                        placeholder="Street address, building, etc."
                        value={addressData.address}
                        onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-sm font-medium text-brand-700 mb-4">Shipping Method</h3>
                    <div className="space-y-3">
                      <label
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                          shippingMethod === "STANDARD"
                            ? "border-brand-950 bg-brand-50"
                            : "border-brand-200 hover:border-brand-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            value="STANDARD"
                            checked={shippingMethod === "STANDARD"}
                            onChange={(e) => setShippingMethod(e.target.value as "STANDARD")}
                            className="w-4 h-4 text-brand-950"
                          />
                          <div>
                            <p className="font-medium text-brand-950">Standard Shipping</p>
                            <p className="text-sm text-brand-500">3-5 business days</p>
                          </div>
                        </div>
                        <span className="font-medium text-brand-950">Free</span>
                      </label>
                      <label
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                          shippingMethod === "EXPRESS"
                            ? "border-brand-950 bg-brand-50"
                            : "border-brand-200 hover:border-brand-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            value="EXPRESS"
                            checked={shippingMethod === "EXPRESS"}
                            onChange={(e) => setShippingMethod(e.target.value as "EXPRESS")}
                            className="w-4 h-4 text-brand-950"
                          />
                          <div>
                            <p className="font-medium text-brand-950">Express Shipping</p>
                            <p className="text-sm text-brand-500">1-2 business days</p>
                          </div>
                        </div>
                        <span className="font-medium text-brand-950">{formatPrice(50000)}</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Textarea
                      label="Order Notes (Optional)"
                      placeholder="Any special instructions for your order..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={() => setCurrentStep(1)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Continue to Payment
                    </Button>
                  </div>
                </Card>
              )}

              {currentStep === 1 && (
                <Card>
                  <h2 className="text-lg font-semibold text-brand-950 mb-6">Payment Method</h2>
                  <div className="space-y-4">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <label
                          key={method.value}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                            paymentMethod === method.value
                              ? "border-brand-950 bg-brand-50"
                              : "border-brand-200 hover:border-brand-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={method.value}
                            checked={paymentMethod === method.value}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4 text-brand-950"
                          />
                          <Icon className="w-6 h-6 text-brand-600" />
                          <div className="flex-1">
                            <p className="font-medium text-brand-950">{method.label}</p>
                            <p className="text-sm text-brand-500">{method.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex justify-between">
                    <Button variant="ghost" onClick={() => setCurrentStep(0)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                      Back
                    </Button>
                    <Button onClick={() => setCurrentStep(2)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Review Order
                    </Button>
                  </div>
                </Card>
              )}

              {currentStep === 2 && (
                <Card>
                  <h2 className="text-lg font-semibold text-brand-950 mb-6">Review Your Order</h2>

                  <div className="space-y-6">
                    <div className="pb-6 border-b border-brand-100">
                      <h3 className="text-sm font-medium text-brand-700 mb-3">Shipping Address</h3>
                      <div className="text-brand-600">
                        <p className="font-medium text-brand-950">{addressData.name}</p>
                        <p>{addressData.address}</p>
                        <p>{addressData.city}, {addressData.province} {addressData.postalCode}</p>
                        <p>{addressData.phone}</p>
                      </div>
                    </div>

                    <div className="pb-6 border-b border-brand-100">
                      <h3 className="text-sm font-medium text-brand-700 mb-3">Shipping Method</h3>
                      <p className="text-brand-600">
                        {shippingMethod === "EXPRESS" ? "Express" : "Standard"} Shipping
                        {shippingMethod === "EXPRESS" && ` - ${formatPrice(50000)}`}
                      </p>
                    </div>

                    <div className="pb-6 border-b border-brand-100">
                      <h3 className="text-sm font-medium text-brand-700 mb-3">Payment Method</h3>
                      <p className="text-brand-600">
                        {paymentMethods.find((m) => m.value === paymentMethod)?.label || "Not selected"}
                      </p>
                    </div>

                    {notes && (
                      <div className="pb-6 border-b border-brand-100">
                        <h3 className="text-sm font-medium text-brand-700 mb-3">Order Notes</h3>
                        <p className="text-brand-600">{notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-between">
                    <Button variant="ghost" onClick={() => setCurrentStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                      Back
                    </Button>
                    <Button onClick={handleSubmit} isLoading={isSubmitting}>
                      Place Order - {formatPrice(total)}
                    </Button>
                  </div>
                </Card>
              )}
            </motion.div>
          </div>

          <div>
            <Card className="sticky top-24">
              <h2 className="text-lg font-semibold text-brand-950 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-brand-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-brand-600">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
                </div>
              </div>

              <div className="border-t border-brand-100 pt-4 mb-6">
                <div className="flex justify-between text-lg font-semibold text-brand-950">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="p-4 bg-accent-gold/10 rounded-xl">
                <p className="text-sm text-brand-700">
                  After placing your order, you will receive payment instructions via email.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}