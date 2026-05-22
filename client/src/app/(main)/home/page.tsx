"use client";
export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Truck, Heart, Award } from "lucide-react";
import { Button, Card, Badge, ProductSkeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-gold/10 via-transparent to-transparent" />
      
      <div className="container-wide relative z-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="space-y-8"
          >
            <Badge variant="outline" size="lg">New Collection 2024</Badge>
            
            <h1 className="text-5xl md:text-7xl font-serif font-semibold text-brand-950 leading-tight text-balance">
              See the World in{' '}
              <span className="text-accent-gold">Style</span>
            </h1>
            
            <p className="text-lg text-brand-600 max-w-lg leading-relaxed">
              Discover our curated collection of premium eyewear. Crafted with precision, 
              designed for those who appreciate exceptional quality and timeless elegance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/shop">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Shop Collection
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg">
                  Our Story
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-8">
              <div className="flex -space-x-4">
                {["https://i.pravatar.cc/100?img=1", "https://i.pravatar.cc/100?img=2", "https://i.pravatar.cc/100?img=3"].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-950">2,500+ Happy Customers</p>
                <p className="text-sm text-brand-500">and counting</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-200 to-brand-100 rounded-3xl rotate-3" />
              <img
                src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format"
                alt="Premium Eyewear"
                className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FeaturedCollections() {
  const collections = [
    {
      title: "For Him",
      description: "Bold frames for the modern gentleman",
      image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&auto=format",
      href: "/shop?gender=men",
    },
    {
      title: "For Her",
      description: "Elegant designs that inspire",
      image: "https://images.unsplash.com/photo-1509696507120-5b9a8d69eb75?w=600&auto=format",
      href: "/shop?gender=women",
    },
    {
      title: "Unisex",
      description: "Versatile styles for everyone",
      image: "https://images.unsplash.com/photo-1473496169904-658ba7c44d82?w=600&auto=format",
      href: "/shop?gender=unisex",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container-wide">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">Collections</Badge>
          <h2 className="text-4xl md:text-5xl font-serif font-semibold text-brand-950 mb-4">
            Shop by Style
          </h2>
          <p className="text-brand-600 max-w-2xl mx-auto">
            Find the perfect frame that matches your personality and lifestyle
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { delay: index * 0.1 } },
              }}
            >
              <Link href={collection.href}>
                <Card hover padding="none" className="overflow-hidden group">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={collection.image}
                      alt={collection.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-serif font-semibold mb-1">{collection.title}</h3>
                      <p className="text-sm text-white/80">{collection.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewArrivals() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "new-arrivals"],
    queryFn: () => api.get<{ data: Product[] }>("/products", { 
      params: { isNewArrival: true, limit: 4 } 
    }),
  });

  return (
    <section className="py-20 bg-brand-50">
      <div className="container-wide">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <Badge variant="warning" className="mb-4">Just In</Badge>
            <h2 className="text-4xl font-serif font-semibold text-brand-950">New Arrivals</h2>
          </div>
          <Link href="/shop?sort=newest" className="hidden md:inline-flex">
            <Button variant="ghost" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            : products?.data?.data?.map((product) => (
                <motion.div
                  key={product.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
        </div>

        <Link href="/shop?sort=newest" className="md:hidden mt-8 flex justify-center">
          <Button variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
            View All New Arrivals
          </Button>
        </Link>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];

  return (
    <Link href={`/product/${product.slug}`}>
      <Card hover padding="none" className="overflow-hidden group">
        <div className="relative aspect-square bg-brand-100 overflow-hidden">
          {primaryImage && (
            <img
              src={primaryImage.url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          {product.isNewArrival && (
            <Badge className="absolute top-3 left-3" variant="info">New</Badge>
          )}
          {product.discountPrice && (
            <Badge className="absolute top-3 right-3" variant="danger">
              Sale
            </Badge>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs text-brand-500 uppercase tracking-wider mb-1">{product.brand}</p>
          <h3 className="font-medium text-brand-950 mb-2 line-clamp-1">{product.name}</h3>
          <div className="flex items-center gap-2">
            {product.discountPrice ? (
              <>
                <span className="text-lg font-semibold text-brand-950">
                  {formatPrice(product.discountPrice)}
                </span>
                <span className="text-sm text-brand-400 line-through">
                  {formatPrice(product.basePrice)}
                </span>
              </>
            ) : (
              <span className="text-lg font-semibold text-brand-950">
                {formatPrice(product.basePrice)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

function BestSellers() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "best-sellers"],
    queryFn: () => api.get<{ data: Product[] }>("/products", { 
      params: { isBestSeller: true, limit: 4 } 
    }),
  });

  return (
    <section className="py-20 bg-brand-950 text-white">
      <div className="container-wide">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 border-white/30 text-white">Popular</Badge>
          <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-4">Best Sellers</h2>
          <p className="text-brand-300 max-w-2xl mx-auto">
            Discover our most loved frames, chosen by customers like you
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            : products?.data?.data?.map((product) => (
                <motion.div
                  key={product.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                >
                  <Link href={`/product/${product.slug}`}>
                    <Card hover padding="none" className="bg-brand-900 border-brand-800 overflow-hidden group">
                      <div className="relative aspect-square bg-brand-800 overflow-hidden">
                        {product.images[0] && (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-100"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-brand-400 uppercase tracking-wider mb-1">{product.brand}</p>
                        <h3 className="font-medium text-white mb-2 line-clamp-1">{product.name}</h3>
                        <p className="text-lg font-semibold text-accent-gold">
                          {formatPrice(product.discountPrice || product.basePrice)}
                        </p>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/shop?sort=popular">
            <Button variant="secondary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Shop All Best Sellers
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function BrandStory() {
  return (
    <section className="py-20 bg-white">
      <div className="container-wide">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="relative"
          >
            <div className="absolute -top-4 -left-4 w-full h-full bg-accent-gold/20 rounded-3xl" />
            <img
              src="https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800&auto=format"
              alt="Craftsmanship"
              className="relative w-full aspect-[4/5] object-cover rounded-2xl shadow-xl"
            />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="space-y-6"
          >
            <Badge variant="outline">Our Story</Badge>
            <h2 className="text-4xl font-serif font-semibold text-brand-950">
              Crafting Excellence Since 2010
            </h2>
            <p className="text-brand-600 leading-relaxed">
              At Optic Luxe, we believe that exceptional eyewear is more than a vision aid—it's 
              a statement of personal style. Each frame in our collection is carefully selected 
              from the world's finest manufacturers, ensuring superior craftsmanship and materials.
            </p>
            <p className="text-brand-600 leading-relaxed">
              Our commitment to quality extends beyond our products. We provide personalized 
              service to help you find the perfect match for your face shape, lifestyle, and budget.
            </p>
            <div className="grid grid-cols-3 gap-6 pt-6">
              <div>
                <p className="text-3xl font-serif font-bold text-accent-gold">14+</p>
                <p className="text-sm text-brand-500">Years Experience</p>
              </div>
              <div>
                <p className="text-3xl font-serif font-bold text-accent-gold">500+</p>
                <p className="text-sm text-brand-500">Frame Styles</p>
              </div>
              <div>
                <p className="text-3xl font-serif font-bold text-accent-gold">50+</p>
                <p className="text-sm text-brand-500">Brand Partners</p>
              </div>
            </div>
            <Link href="/about">
              <Button variant="outline" className="mt-4">
                Learn More About Us
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Authentic Products",
      description: "100% genuine products with warranty",
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Free Shipping",
      description: "On orders over Rp 500.000",
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Easy Returns",
      description: "30-day hassle-free returns",
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Premium Quality",
      description: "Finest materials and craftsmanship",
    },
  ];

  return (
    <section className="py-16 bg-brand-50 border-y border-brand-100">
      <div className="container-wide">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { delay: index * 0.1 } },
              }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-sm text-accent-gold mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-brand-950 mb-1">{feature.title}</h3>
              <p className="text-sm text-brand-500">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Wijaya",
      role: "Jakarta",
      image: "https://i.pravatar.cc/100?img=5",
      text: "The quality of their frames is exceptional. I've been a loyal customer for 3 years now.",
    },
    {
      name: "Ahmad Pratama",
      role: "Bandung",
      image: "https://i.pravatar.cc/100?img=3",
      text: "Best eyewear shopping experience. The staff helped me find the perfect pair for my face shape.",
    },
    {
      name: "Lisa Chen",
      role: "Surabaya",
      image: "https://i.pravatar.cc/100?img=9",
      text: "Love the variety and the fact that they have options for every budget. Highly recommended!",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container-wide">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">Testimonials</Badge>
          <h2 className="text-4xl font-serif font-semibold text-brand-950">What Our Customers Say</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { delay: index * 0.1 } },
              }}
            >
              <Card className="h-full">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-brand-950">{testimonial.name}</p>
                    <p className="text-sm text-brand-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-brand-600 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-1 mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 fill-accent-gold" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-50">
      <HeroSection />
      <FeaturedCollections />
      <NewArrivals />
      <BestSellers />
      <BrandStory />
      <Features />
      <Testimonials />
    </div>
  );
}