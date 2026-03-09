"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  MessageCircle,
  Truck,
  Wallet,
  FileSearch,
  CheckCircle,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased font-display">
      {/* ─── NAVBAR ─── */}
      <div className="fixed top-0 z-50 w-full">
        {/* Accent stripe */}
        <div className="h-[2px] bg-primary w-full" />
        <header
          className={`w-full transition-all duration-300 ${
            scrolled
              ? "bg-deep-blue/95 backdrop-blur-md shadow-lg shadow-black/10"
              : "bg-white/80 backdrop-blur-sm shadow-sm"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo variant={scrolled ? "dark" : "light"} size="md" />
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#how-it-works"
                className={`text-sm font-semibold hover:text-primary transition-colors ${
                  scrolled ? "text-white/70" : "text-slate-600"
                }`}
              >
                How it Works
              </a>
              <a
                href="#categories"
                className={`text-sm font-semibold hover:text-primary transition-colors ${
                  scrolled ? "text-white/70" : "text-slate-600"
                }`}
              >
                Categories
              </a>
              <a
                href="#why"
                className={`text-sm font-semibold hover:text-primary transition-colors ${
                  scrolled ? "text-white/70" : "text-slate-600"
                }`}
              >
                Why Us
              </a>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className={`text-sm font-bold px-4 py-2 border rounded-lg hover:border-primary hover:text-primary transition-all ${
                  scrolled
                    ? "text-white/80 border-white/20"
                    : "text-slate-700 border-slate-200"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-primary hover:bg-primary-dark text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all shadow-md shadow-primary/30"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>
      </div>

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-white pt-20">
        {/* Abstract pattern background */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, #0f172a 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="max-w-7xl mx-auto px-6 relative z-30 w-full py-16 flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-8">
          {/* Hero Content Left */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Now Live in Lagos State
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-navy-dark leading-[1.1] tracking-tight mb-6">
              Nigeria&apos;s First
              <br />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-500">
                WhatsApp Commerce
              </span>
              <br />
              Platform
            </h1>

            <p className="text-lg text-slate-500 max-w-lg leading-relaxed font-medium mb-10">
              Buy and sell anything on WhatsApp with escrow payment protection.
              Search → Buy → Pay → Track → Delivered. All from WhatsApp.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                href="/register"
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-bold h-14 px-8 rounded-xl flex items-center justify-center gap-2 text-base shadow-lg shadow-primary/30 transition-all hover:scale-[1.02]"
              >
                Start Buying <ChevronRight className="w-5 h-5" />
              </Link>
              {WHATSAPP_NUMBER ? (
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto border-2 border-slate-200 bg-white text-navy-dark hover:border-emerald-500 hover:text-emerald-600 font-bold h-14 px-8 rounded-xl flex items-center justify-center gap-2 text-base transition-all group"
                >
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  WhatsApp AI Assistant
                </a>
              ) : (
                <span
                  aria-disabled="true"
                  className="w-full sm:w-auto border-2 border-slate-100 bg-slate-50 text-slate-400 font-bold h-14 px-8 rounded-xl flex items-center justify-center gap-2 text-base cursor-not-allowed"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp AI Assistant
                </span>
              )}
            </div>

            <div className="mt-10 flex items-center gap-4 text-sm font-semibold text-slate-500">
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                  JT
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                  AK
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700">
                  MO
                </div>
              </div>
              <p>
                Trusted by{" "}
                <span className="text-navy-dark font-black">2,000+</span> users
              </p>
            </div>
          </div>

          {/* Hero Image Right */}
          <div className="w-full lg:w-1/2 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-emerald-400/20 rounded-[2rem] transform rotate-3 scale-105 z-0 blur-xl"></div>
            <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
              <img
                src="/images/landing/hero-trade.png"
                alt="Young adults using SwiftTrade AI Assistant on WhatsApp"
                className="w-full h-auto object-cover aspect-[4/3] sm:aspect-[3/2] lg:aspect-square"
              />
              {/* Floating Badge */}
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-navy-dark">
                    100% Secure
                  </p>
                  <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                    Escrow Payments
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VALUE PROPOSITIONS ─── */}
      <section id="why" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
              Features
            </p>
            <h2 className="text-4xl font-black text-deep-blue tracking-tight">
              Why use SwiftTrade?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <ShieldCheck className="w-6 h-6" />,
                title: "Escrow-Protected Payments",
                desc: "Your money is held securely until you confirm delivery. Zero fraud risk.",
              },
              {
                icon: <MessageCircle className="w-6 h-6" />,
                title: "WhatsApp-Native",
                desc: "Buy, sell, and manage your business entirely from WhatsApp. No app downloads.",
              },
              {
                icon: <Truck className="w-6 h-6" />,
                title: "Tracked Delivery",
                desc: "Real-time delivery tracking with notifications straight to your WhatsApp.",
              },
              {
                icon: <Wallet className="w-6 h-6" />,
                title: "Instant Merchant Payouts",
                desc: "Delivery confirmed → money in your bank account. Automatically via Paystack.",
              },
              {
                icon: <UserCheck className="w-6 h-6" />,
                title: "Verified Merchants",
                desc: "Every merchant is rated and verified. Buy with confidence.",
              },
              {
                icon: <FileSearch className="w-6 h-6" />,
                title: "AI Product Search",
                desc: "Send a photo of what you need. Our AI assistant finds matching products instantly.",
              },
            ].map((feat, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-14 w-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 text-emerald-600 transition-all">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-black text-navy-dark mb-3">
                  {feat.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES SHOWCASE ─── */}
      <section id="categories" className="py-24 bg-[#f6f6f8]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-deep-blue tracking-tight mb-12">
            Everything You Need, One Platform
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Building Materials",
              "Electronics",
              "Fashion",
              "Home & Kitchen",
              "Health & Beauty",
              "Auto Parts",
              "Agriculture",
              "Food & Groceries",
            ].map((cat) => (
              <div
                key={cat}
                className="bg-white border border-slate-200 text-slate-700 font-bold px-6 py-3 rounded-full shadow-sm hover:border-primary hover:text-primary transition-all cursor-default"
              >
                {cat}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-deep-blue tracking-tight">
              How SwiftTrade Works
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Image Center */}
            <div className="order-2 lg:order-1 relative rounded-3xl overflow-hidden shadow-2xl h-full min-h-[400px]">
              <img
                src="/images/landing/merchant-buyer.png"
                alt="Merchants and Buyers trading securely on SwiftTrade"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <div className="order-1 lg:order-2 flex flex-col gap-8">
              {/* For Buyers */}
              <div className="bg-[#f6f6f8] rounded-2xl p-8 lg:p-10 border border-slate-100 hover:border-emerald-200 transition-colors">
                <h3 className="text-2xl font-black text-navy-dark mb-6 flex items-center gap-3">
                  <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                    <UserCheck className="w-5 h-5" />
                  </span>
                  For Buyers
                </h3>
                <ul className="space-y-4">
                  {[
                    "Search for any product on web or WhatsApp using our AI Assistant",
                    "Pay securely — your money is protected until delivery",
                    "Track your order in real-time",
                    "Confirm delivery with your OTP code",
                  ].map((text, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 text-emerald-500 shrink-0">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-slate-600 text-sm leading-relaxed">
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* For Merchants */}
              <div className="bg-navy-dark rounded-2xl p-8 lg:p-10 border border-slate-800 hover:border-blue-500/50 transition-colors text-white">
                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                  <span className="bg-white/10 text-white p-2 rounded-lg">
                    <Wallet className="w-5 h-5" />
                  </span>
                  For Merchants
                </h3>
                <ul className="space-y-4">
                  {[
                    "List your products with prices directly via WhatsApp",
                    "Get orders from buyers across Lagos",
                    "Dispatch and track deliveries seamlessly",
                    "Get paid instantly to your bank account",
                  ].map((text, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 text-blue-400 shrink-0">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-slate-300 text-sm leading-relaxed">
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST SECTION ─── */}
      <section className="py-24 bg-[#f6f6f8]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-deep-blue mb-10">
            Trusted by merchants and buyers across Lagos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-left mx-auto w-fit px-4 border border-slate-200 bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-700 text-sm sm:text-base">
                Escrow protection on every transaction
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-700">
                Verified merchants with real ratings
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-700">
                OTP delivery confirmation
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-700 text-sm sm:text-base">
                Instant bank payouts
              </span>
            </div>
            <div className="flex items-center gap-4 sm:col-span-2 justify-center pt-2">
              <div className="bg-primary/20 text-primary p-1.5 rounded-full">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="font-black text-navy-dark text-sm sm:text-base uppercase tracking-wider">
                Powered by WhatsApp AI Assistant
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="py-32 bg-deep-blue">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-10 tracking-tight">
            Ready to trade smarter?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 sm:px-0">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-bold h-14 px-10 rounded-lg flex items-center justify-center transition-all shadow-xl shadow-primary/30"
            >
              Start Buying — Free
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto bg-white hover:bg-slate-100 text-deep-blue font-bold h-14 px-10 rounded-lg flex items-center justify-center transition-all shadow-xl"
            >
              Start Selling — Free
            </Link>
          </div>
          <div className="mt-8">
            <a
              href="https://wa.me/2348000000000"
              target="_blank"
              rel="noreferrer"
              className="text-white/60 hover:text-emerald-400 font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined">chat</span>
              Or message us on WhatsApp: Chat Now
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Logo variant="light" size="sm" />
            <p className="text-sm font-medium text-slate-500 max-w-sm text-center md:text-left">
              SwiftTrade is Nigeria&apos;s first WhatsApp-native e-commerce
              platform. Buy and sell anything with escrow payment protection.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex gap-6 text-sm font-bold text-slate-400 mb-2">
              <a href="#" className="hover:text-primary transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Support
              </a>
              <a
                href="https://wa.me/2348000000000"
                className="text-[#25D366] hover:text-[#128C7E] flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chat</span>{" "}
                WhatsApp
              </a>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} SwiftTrade Technologies.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
