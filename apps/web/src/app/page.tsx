"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

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
              : "bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo variant="dark" size="md" />
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#how-it-works"
                className="text-sm font-semibold text-white/70 hover:text-primary transition-colors"
              >
                How it Works
              </a>
              <a
                href="#categories"
                className="text-sm font-semibold text-white/70 hover:text-primary transition-colors"
              >
                Categories
              </a>
              <a
                href="#why"
                className="text-sm font-semibold text-white/70 hover:text-primary transition-colors"
              >
                Why Us
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-bold text-white/80 px-4 py-2 border border-white/20 rounded-lg hover:border-primary hover:text-primary transition-all"
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
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-deep-blue via-[#0d162f] to-[#0a1124]">
        {/* Abstract pattern background */}
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 relative z-30 w-full py-32 pt-40 flex flex-col items-center text-center">
          <div className="max-w-4xl flex flex-col items-center gap-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-white text-[11px] font-bold uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Now Live in Lagos State
            </div>

            <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
              Nigeria&apos;s First
              <br />
              <span className="text-primary">WhatsApp E-Commerce</span>
              <br />
              Platform
            </h1>

            <p className="text-xl lg:text-2xl text-white/80 max-w-2xl leading-relaxed font-medium">
              Buy and sell anything on WhatsApp with escrow payment protection.
              Search → Buy → Pay → Track → Delivered. All from WhatsApp.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/register"
                className="bg-primary hover:bg-primary-dark text-white font-bold h-14 px-8 rounded-lg flex items-center justify-center gap-2 text-base shadow-xl shadow-primary/30 transition-all hover:scale-[1.02]"
              >
                Start Buying →
              </Link>
              <Link
                href="/register"
                className="border border-white/30 bg-white/5 text-white font-bold h-14 px-8 rounded-lg flex items-center justify-center gap-2 text-base hover:bg-white/10 transition-all"
              >
                Start Selling
              </Link>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "2349000000000"}`}
                target="_blank"
                rel="noreferrer"
                className="border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] font-bold h-14 px-8 rounded-lg flex items-center justify-center gap-2 text-base hover:bg-[#25D366]/20 transition-all"
              >
                <span className="material-symbols-outlined">chat</span>
                Chat on WhatsApp
              </a>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "lock",
                title: "Escrow-Protected Payments",
                desc: "Your money is held securely until you confirm delivery. Zero fraud risk.",
              },
              {
                icon: "chat",
                title: "WhatsApp-Native",
                desc: "Buy, sell, and manage your business entirely from WhatsApp. No app downloads.",
              },
              {
                icon: "local_shipping",
                title: "Tracked Delivery",
                desc: "Real-time delivery tracking with notifications straight to your WhatsApp.",
              },
              {
                icon: "account_balance",
                title: "Instant Merchant Payouts",
                desc: "Delivery confirmed → money in your bank account. Automatically via Paystack.",
              },
              {
                icon: "verified",
                title: "Verified Merchants",
                desc: "Every merchant is rated and verified. Buy with confidence.",
              },
              {
                icon: "photo_camera",
                title: "AI Product Search",
                desc: "Send a photo of what you need. Our AI finds matching products instantly.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="p-8 rounded-lg border border-slate-200 group hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
              >
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-primary group-hover:text-white">
                    {feat.icon}
                  </span>
                </div>
                <h3 className="text-lg font-black text-deep-blue mb-2">
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

          <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
            {/* For Buyers */}
            <div className="bg-[#f6f6f8] rounded-2xl p-10 lg:p-12">
              <h3 className="text-2xl font-black text-deep-blue mb-8">
                For Buyers
              </h3>
              <ul className="space-y-6">
                {[
                  "Search for any product on web or WhatsApp",
                  "Pay securely — your money is protected until delivery",
                  "Track your order in real-time",
                  "Confirm delivery with your OTP code",
                  "Rate your experience",
                ].map((text, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <span className="font-medium text-slate-700 mt-1">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Merchants */}
            <div className="bg-deep-blue rounded-2xl p-10 lg:p-12 text-white">
              <h3 className="text-2xl font-black text-white mb-8">
                For Merchants
              </h3>
              <ul className="space-y-6">
                {[
                  "List your products with prices",
                  "Get orders from buyers across Lagos",
                  "Dispatch and track deliveries",
                  "Get paid instantly to your bank account",
                  "Manage everything from WhatsApp",
                ].map((text, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-white/20 text-white font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <span className="font-medium text-white/90 mt-1">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
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
          <div className="grid sm:grid-cols-2 gap-4 text-left mx-auto w-fit">
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-xl">✅</span>
              <span className="font-bold text-slate-700">
                Escrow protection on every transaction
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-xl">✅</span>
              <span className="font-bold text-slate-700">
                Verified merchants with real ratings
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-xl">✅</span>
              <span className="font-bold text-slate-700">
                OTP delivery confirmation
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-xl">✅</span>
              <span className="font-bold text-slate-700">
                Instant bank payouts
              </span>
            </div>
            <div className="flex items-center gap-3 sm:col-span-2 justify-center">
              <span className="text-green-500 text-xl">✅</span>
              <span className="font-bold text-slate-700">
                WhatsApp AI assistant
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-primary hover:bg-primary-dark text-white font-bold h-14 px-10 rounded-lg flex items-center justify-center transition-all shadow-xl shadow-primary/30"
            >
              Start Buying — Free
            </Link>
            <Link
              href="/register"
              className="bg-white hover:bg-slate-100 text-deep-blue font-bold h-14 px-10 rounded-lg flex items-center justify-center transition-all shadow-xl"
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
