"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Award, Eye, Handshake, Globe, Heart, Shield, ArrowRight, MapPin, Phone, Mail } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const values = [
  { icon: <Award className="w-6 h-6" />, title: "Quality Craftsmanship", desc: "Every frame undergoes rigorous quality checks before reaching you." },
  { icon: <Eye className="w-6 h-6" />, title: "Expert Curation", desc: "Our opticians personally select each collection for style and comfort." },
  { icon: <Handshake className="w-6 h-6" />, title: "Trusted Service", desc: "14+ years of serving customers with honesty and integrity." },
  { icon: <Globe className="w-6 h-6" />, title: "Global Sourcing", desc: "We partner with the world's finest eyewear manufacturers." },
];

const team = [
  { name: "Rina Sutanto", role: "Founder & CEO", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop" },
  { name: "David Prakoso", role: "Head of Design", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop" },
  { name: "Maya Putri", role: "Lead Optician", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop" },
  { name: "Andi Kusuma", role: "Operations Director", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-50">
      <section className="py-20 bg-gradient-to-br from-brand-950 to-brand-900 text-white">
        <div className="container-wide">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-white/30 text-white">Our Story</Badge>
            <h1 className="text-5xl md:text-7xl font-serif font-semibold mb-6 leading-tight">
              Crafting Vision<br />Since 2010
            </h1>
            <p className="text-xl text-brand-300 leading-relaxed">
              Optic Luxe was born from a simple belief: everyone deserves eyewear that makes them feel
              confident and look extraordinary. What started as a small boutique in Jakarta has grown
              into Indonesia's premier optical destination.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
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
                src="https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800&auto=format&fit=crop"
                alt="Optic Luxe Store"
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
              <h2 className="text-4xl font-serif font-semibold text-brand-950">
                More Than Just Eyewear
              </h2>
              <p className="text-brand-600 leading-relaxed">
                At Optic Luxe, we believe that eyewear is the most personal accessory you will ever own.
                It sits at the intersection of fashion and function, of self-expression and necessity.
              </p>
              <p className="text-brand-600 leading-relaxed">
                Our team of expert opticians and stylists work together to ensure every frame we offer
                meets our exacting standards. From the curve of a temple to the weight of a bridge,
                every detail matters.
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
                  <p className="text-3xl font-serif font-bold text-accent-gold">50K+</p>
                  <p className="text-sm text-brand-500">Happy Customers</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container-wide">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">Values</Badge>
            <h2 className="text-4xl font-serif font-semibold text-brand-950 mb-4">
              What We Stand For
            </h2>
            <p className="text-brand-600 max-w-xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ ...fadeInUp, visible: { ...fadeInUp.visible, transition: { delay: index * 0.1 } } }}
              >
                <Card className="text-center h-full">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-accent-gold/10 rounded-2xl text-accent-gold mb-4">
                    {value.icon}
                  </div>
                  <h3 className="font-semibold text-brand-950 mb-2">{value.title}</h3>
                  <p className="text-sm text-brand-500 leading-relaxed">{value.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-950 text-white">
        <div className="container-wide text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-4xl font-serif font-semibold mb-6">
              The People Behind the Frames
            </h2>
            <p className="text-brand-300 mb-12">
              A dedicated team of eyewear enthusiasts committed to helping you see the world in style
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ ...fadeInUp, visible: { ...fadeInUp.visible, transition: { delay: index * 0.1 } } }}
              >
                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden mb-4 border-4 border-brand-800">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-sm text-brand-400">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <MapPin className="w-8 h-8 text-accent-gold mx-auto mb-4" />
              <h3 className="font-semibold text-brand-950 mb-2">Visit Us</h3>
              <p className="text-sm text-brand-500 leading-relaxed">
                Jl. Sudirman No. 123<br />
                Senayan, Jakarta Selatan<br />
                DKI Jakarta 12190
              </p>
            </Card>
            <Card className="text-center">
              <Phone className="w-8 h-8 text-accent-gold mx-auto mb-4" />
              <h3 className="font-semibold text-brand-950 mb-2">Call Us</h3>
              <p className="text-sm text-brand-500 leading-relaxed">
                +62 21 1234 5678<br />
                Mon - Sat: 9:00 - 20:00<br />
                Sunday: 10:00 - 18:00
              </p>
            </Card>
            <Card className="text-center">
              <Mail className="w-8 h-8 text-accent-gold mx-auto mb-4" />
              <h3 className="font-semibold text-brand-950 mb-2">Email Us</h3>
              <p className="text-sm text-brand-500 leading-relaxed">
                hello@opticluxe.com<br />
                support@opticluxe.com<br />
                careers@opticluxe.com
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-accent-gold/10">
        <div className="container-wide text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Heart className="w-12 h-12 text-accent-gold mx-auto mb-6" />
            <h2 className="text-4xl font-serif font-semibold text-brand-950 mb-4">
              Ready to Find Your Perfect Frame?
            </h2>
            <p className="text-brand-600 max-w-xl mx-auto mb-8">
              Explore our collection and discover eyewear that matches your unique style.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/shop">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Shop Now
                </Button>
              </Link>
              <Link href="/collections">
                <Button variant="outline" size="lg">
                  View Collections
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}