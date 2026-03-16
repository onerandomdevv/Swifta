"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle,
  ShieldCheck,
  MessageCircle,
  Truck,
  Wallet,
  FileSearch,
  UserCheck,
  Star,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "2348147846093").replace(/\D/g, "");
const WHATSAPP_WELCOME = process.env.NEXT_PUBLIC_WHATSAPP_WELCOME_MESSAGE || "Hi, I'd like to shop on Swifta";
const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_WELCOME)}`;

/* ── Reusable WhatsApp CTA Button ── */
function WhatsAppCTA({
  label,
  className = "",
  size = "lg",
}: {
  label: string;
  className?: string;
  size?: "lg" | "md";
}) {
  const sizeClasses =
    size === "lg"
      ? "h-16 px-10 text-lg gap-3 rounded-2xl shadow-[0_8px_30px_rgba(0,200,83,0.35)]"
      : "h-14 px-8 text-base gap-2 rounded-xl shadow-lg shadow-primary/30";

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noreferrer"
      className={`bg-[#25D366] hover:bg-[#1ebe5c] text-white font-bold flex items-center justify-center transition-all hover:scale-[1.03] active:scale-[0.98] ${sizeClasses} ${className}`}
    >
      {/* WhatsApp SVG Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size === "lg" ? 28 : 22}
        height={size === "lg" ? 28 : 22}
        viewBox="0 0 24 24"
        fill="white"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      {label}
    </a>
  );
}

/* ── Data ── */
const STEPS = [
  {
    num: "1",
    title: "Message Swifta",
    desc: "Send us what you need on WhatsApp. Text or photo — our AI understands both.",
    icon: <MessageCircle className="w-6 h-6" />,
  },
  {
    num: "2",
    title: "Get Matched & Pay",
    desc: "We find verified merchants, compare prices, and send you a secure payment link.",
    icon: <ShieldCheck className="w-6 h-6" />,
  },
  {
    num: "3",
    title: "Receive Your Delivery",
    desc: "Track your order in real-time. Confirm with OTP. Merchant gets paid.",
    icon: <Truck className="w-6 h-6" />,
  },
];

const BUYER_FEATURES = [
  "AI-Powered Search — send a photo, find products instantly",
  "Escrow Protection — your money is safe until delivery",
  "Live Order Tracking — know where your goods are",
  "WhatsApp Native — no app download needed",
];

const MERCHANT_FEATURES = [
  "Manage everything from WhatsApp",
  "Guaranteed payouts — get paid within 24 hours",
  "Reach thousands of buyers instantly",
  "Real-time inventory and low-stock alerts",
];

const CATEGORIES = [
  {
    name: "Building Materials",
    count: "500+",
    img: "/images/slideshow/slide-1.jpg",
  },
  {
    name: "Electronics",
    count: "300+",
    img: "/images/slideshow/slide-2.jpg",
  },
  {
    name: "Fashion",
    count: "450+",
    img: "/images/slideshow/slide-3.jpg",
  },
  {
    name: "Home & Kitchen",
    count: "200+",
    img: "/images/slideshow/slide-4.jpg",
  },
];

const TESTIMONIALS = [
  {
    name: "Adebayo Ogunlesi",
    role: "Contractor",
    stars: 5,
    text: "I ordered 200 bags of cement through WhatsApp. Got matched with a verified supplier, paid securely, and delivery arrived the next day. This is the future of commerce!",
  },
  {
    name: "Chioma Nwosu",
    role: "Fashion Retailer",
    stars: 5,
    text: "As a merchant, Swifta changed my business. I manage everything from WhatsApp — products, orders, payouts. My revenue has tripled in 3 months.",
  },
  {
    name: "Emeka Obi",
    role: "Electronics Buyer",
    stars: 4,
    text: "The AI search is incredible. I sent a photo of a phone charger and got exact product matches with prices in seconds. Escrow payment gave me total peace of mind.",
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased font-display overflow-x-hidden">
      {/* ─── NAVBAR ─── */}
      <div className="fixed top-0 z-50 w-full">
        <header className="w-full bg-deep-blue shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo variant="dark" size="md" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {[
                { label: "How it Works", href: "#how-it-works" },
                { label: "For Buyers", href: "#for-buyers" },
                { label: "For Merchants", href: "#for-merchants" },
                { label: "Categories", href: "#categories" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-bold text-white/80 border border-white/20 px-4 py-2 rounded-lg hover:border-primary hover:text-primary transition-all"
              >
                Sign In
              </Link>
              <WhatsAppCTA label="Start Trading on WhatsApp" size="md" />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-deep-blue border-t border-white/10 px-4 pb-6 pt-2 space-y-3">
              {[
                { label: "How it Works", href: "#how-it-works" },
                { label: "For Buyers", href: "#for-buyers" },
                { label: "For Merchants", href: "#for-merchants" },
                { label: "Categories", href: "#categories" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white/70 hover:text-white font-semibold py-2 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
                <Link
                  href="/login"
                  className="text-center text-sm font-bold text-white/80 border border-white/20 px-4 py-2.5 rounded-lg"
                >
                  Sign In
                </Link>
                <WhatsAppCTA label="Start Trading on WhatsApp" size="md" />
              </div>
            </div>
          )}
        </header>
      </div>

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 bg-gradient-to-b from-[#f0fff4] via-white to-white">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, #0f172a 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            WhatsApp-Powered Commerce
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-deep-blue leading-[1.08] tracking-tight mb-6">
            Buy & Sell Anything
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#4ADE80]">
              Right From WhatsApp
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium mb-10">
            Your one-stop WhatsApp marketplace. Search products, compare prices,
            pay securely, and get delivery — all without leaving your chat.
          </p>

          {/* Primary WhatsApp CTA */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <WhatsAppCTA
              label="Start Trading on WhatsApp"
              size="lg"
              className="w-full sm:w-auto"
            />
            <Link
              href="/register?role=merchant"
              className="text-deep-blue hover:text-primary font-bold text-sm flex items-center gap-1 transition-colors"
            >
              or Register as a Merchant
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm text-slate-500 font-semibold">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Escrow Protected</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <span>Verified Merchants</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <span>Tracked Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
              Simple & Fast
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-deep-blue tracking-tight">
              How Swifta Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="relative p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center group"
              >
                {/* Step Number */}
                <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-6 group-hover:scale-110 transition-transform">
                  {step.num}
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-black text-deep-blue mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  {step.desc}
                </p>

                {/* Arrow connector on desktop */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOR BUYERS ─── */}
      <section id="for-buyers" className="py-24 lg:py-32 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
              <Image
                src="/images/landing/hero-trade.png"
                alt="Happy buyer receiving a delivery"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-deep-blue">
                    100% Secure
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    Escrow Payments
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
                For Buyers
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-deep-blue tracking-tight mb-6">
                Shop Smarter on WhatsApp
              </h2>
              <ul className="space-y-4 mb-8">
                {BUYER_FEATURES.map((text, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 text-primary shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-slate-600 leading-relaxed">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
              <WhatsAppCTA
                label="Start Buying on WhatsApp"
                size="md"
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOR MERCHANTS ─── */}
      <section id="for-merchants" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content — appears first on mobile, left on desktop */}
            <div className="order-2 lg:order-1">
              <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
                For Merchants
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-deep-blue tracking-tight mb-6">
                Sell From Your WhatsApp
              </h2>
              <ul className="space-y-4 mb-8">
                {MERCHANT_FEATURES.map((text, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 text-primary shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-slate-600 leading-relaxed">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register?role=merchant"
                className="inline-flex items-center justify-center h-14 px-8 bg-deep-blue hover:bg-mid-blue text-white font-bold rounded-xl transition-all shadow-lg gap-2"
              >
                Register as a Merchant
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Image */}
            <div className="order-1 lg:order-2 relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
              <Image
                src="/images/landing/merchant-buyer.png"
                alt="Merchant managing store on WhatsApp"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-deep-blue">
                    Fast Payouts
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    Direct to Bank
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRODUCT CATEGORIES ─── */}
      <section id="categories" className="py-24 lg:py-32 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
              Marketplace
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-deep-blue tracking-tight mb-3">
              Shop Any Category
            </h2>
            <p className="text-slate-500 font-medium max-w-lg mx-auto">
              From building materials to electronics — find everything you need
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.map((cat, i) => (
              <a
                key={i}
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 aspect-[3/4]"
              >
                <Image
                  src={cat.img}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white font-black text-xl mb-1">
                    {cat.name}
                  </h3>
                  <p className="text-white/70 text-sm font-semibold">
                    {cat.count} products
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
              Social Proof
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-deep-blue tracking-tight">
              Trusted by Thousands
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      className={`w-5 h-5 ${
                        starIdx < t.stars
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-slate-200 fill-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-slate-600 font-medium leading-relaxed mb-6 text-sm">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-bold text-deep-blue text-sm">{t.name}</p>
                    <p className="text-slate-400 text-xs font-semibold">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 lg:py-32 bg-deep-blue relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full translate-x-1/2 translate-y-1/2" />

        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight">
            Ready to Trade Smarter?
          </h2>
          <p className="text-white/60 font-medium text-lg mb-10 max-w-xl mx-auto">
            Join thousands of buyers and sellers trading on WhatsApp. No app
            downloads. No signups. Just open your chat.
          </p>
          <WhatsAppCTA
            label="Open WhatsApp & Start Trading"
            size="lg"
            className="w-full sm:w-auto mx-auto"
          />
          <p className="text-white/40 text-sm font-semibold mt-6">
            Free to use. No app download required.
          </p>
        </div>
      </section>

    </div>
  );
}
