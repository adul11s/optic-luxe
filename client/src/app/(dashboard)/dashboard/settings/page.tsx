"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Settings, Globe, Mail, Phone, Instagram, Facebook, Twitter, Save, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";
import { authGet, authPut } from "@/lib/api";

export const dynamic = "force-dynamic";

interface SiteConfig {
  id: string;
  siteName: string;
  tagline: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImage: string | null;
  aboutText: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  socialIg: string | null;
  socialFb: string | null;
  socialTw: string | null;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<SiteConfig>>({});

  const { data: configData, isLoading } = useQuery({
    queryKey: ["site-config"],
    queryFn: () => authGet<{ data: SiteConfig }>("/site-config"),
  });

  const config = configData?.data;

  useEffect(() => {
    if (config) {
      setForm({
        siteName: config.siteName || "",
        tagline: config.tagline || "",
        heroTitle: config.heroTitle || "",
        heroSubtitle: config.heroSubtitle || "",
        heroImage: config.heroImage || "",
        aboutText: config.aboutText || "",
        contactEmail: config.contactEmail || "",
        contactPhone: config.contactPhone || "",
        socialIg: config.socialIg || "",
        socialFb: config.socialFb || "",
        socialTw: config.socialTw || "",
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<SiteConfig>) => authPut("/site-config", data as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-config"] });
    },
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-brand-950">Settings</h1>
          <p className="text-brand-600">Site configuration</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-brand-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-brand-950">Settings</h1>
          <p className="text-brand-600">Site configuration</p>
        </div>
        <Button
          leftIcon={saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {saveMutation.isSuccess && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-xl px-4 py-3 text-sm">
          Settings saved successfully!
        </div>
      )}

      {saveMutation.isError && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
          Failed to save settings. Please try again.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Site Name</label>
              <Input
                value={form.siteName || ""}
                onChange={(e) => handleChange("siteName", e.target.value)}
                placeholder="Optic Luxe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Tagline</label>
              <Input
                value={form.tagline || ""}
                onChange={(e) => handleChange("tagline", e.target.value)}
                placeholder="See the World in Style"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Hero Title</label>
              <Input
                value={form.heroTitle || ""}
                onChange={(e) => handleChange("heroTitle", e.target.value)}
                placeholder="Discover Your Perfect Frame"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Hero Subtitle</label>
              <Input
                value={form.heroSubtitle || ""}
                onChange={(e) => handleChange("heroSubtitle", e.target.value)}
                placeholder="Premium eyewear crafted for clarity..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Email</label>
              <Input
                value={form.contactEmail || ""}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                placeholder="hello@opticluxe.com"
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Phone</label>
              <Input
                value={form.contactPhone || ""}
                onChange={(e) => handleChange("contactPhone", e.target.value)}
                placeholder="+62 21 1234 5678"
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Social Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Instagram</label>
              <Input
                value={form.socialIg || ""}
                onChange={(e) => handleChange("socialIg", e.target.value)}
                placeholder="@opticluxe"
                leftIcon={<Instagram className="w-4 h-4" />}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Facebook</label>
              <Input
                value={form.socialFb || ""}
                onChange={(e) => handleChange("socialFb", e.target.value)}
                placeholder="opticluxe"
                leftIcon={<Facebook className="w-4 h-4" />}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Twitter</label>
              <Input
                value={form.socialTw || ""}
                onChange={(e) => handleChange("socialTw", e.target.value)}
                placeholder="@opticluxe"
                leftIcon={<Twitter className="w-4 h-4" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={form.aboutText || ""}
            onChange={(e) => handleChange("aboutText", e.target.value)}
            placeholder="Tell customers about your store..."
            rows={4}
            className="w-full px-4 py-3 border border-brand-200 rounded-xl text-sm text-brand-950 placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
