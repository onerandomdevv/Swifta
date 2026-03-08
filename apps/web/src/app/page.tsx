"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const SLIDE_INTERVAL = 4000;

const slides = [
  { url: "/images/hero/slide-1.jpg", alt: "Electronics and smart devices" },
  {
    url: "/images/hero/slide-2.jpg",
    alt: "Fashion and apparel goods",
  },
  { url: "/images/hero/slide-3.jpg", alt: "Home appliances and kitchenware" },
  { url: "/images/hero/slide-4.jpg", alt: "Packaged groceries and provisions" },
  { url: "/images/hero/slide-5.jpg", alt: "Industrial and hardware supplies" },
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

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

      {/* ─── HERO SECTION WITH SLIDESHOW ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-deep-blue">
        {/* Slideshow background */}
        <div className="absolute inset-0 z-0">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
            >
              <img
                src={slide.url}
                alt={slide.alt}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {/* Overlay */}
          <div className="absolute inset-0 z-20 bg-deep-blue/65" />
        </div>

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

            <h1 className="text-6xl lg:text-8xl font-black text-white leading-[1.05] tracking-tight">
              Nigeria&apos;s Private
              <br />
              <span className="text-primary">E-commerce</span>
              <br />
              Infrastructure
            </h1>

            <p className="text-xl lg:text-2xl text-white/80 max-w-2xl leading-relaxed font-medium">
              Connect with verified merchants. Request quotes privately. Pay
              securely with escrow protection.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/register"
                className="bg-primary hover:bg-primary-dark text-white font-bold h-14 px-8 rounded-lg flex items-center justify-center gap-2 text-base shadow-xl shadow-primary/30 transition-all hover:scale-[1.02]"
              >
                Start Buying
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link
                href="/register"
                className="border border-white/30 text-white font-bold h-14 px-8 rounded-lg flex items-center justify-center gap-2 text-base hover:bg-white/10 transition-all"
              >
                <span className="material-symbols-outlined">store</span>
                List Your Products
              </Link>
            </div>
          </div>

          {/* Slide indicators */}
          <div className="flex gap-2 mt-12">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-500 bg-white ${index === currentSlide ? "w-8 opacity-100" : "w-2 opacity-40"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-32 bg-[#f6f6f8]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
              The Process
            </p>
            <h2 className="text-4xl font-black text-deep-blue tracking-tight">
              How It Works
            </h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto font-medium">
              Streamlining retail and wholesale procurement from request to
              delivery.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "forum",
                step: "01",
                title: "Request a Quote",
                desc: "Post your product requirements to our network of pre-verified suppliers. Prices stay private.",
              },
              {
                icon: "receipt_long",
                step: "02",
                title: "Get Competitive Quotes",
                desc: "Receive multiple bids within hours. Compare pricing, quality, and delivery timelines.",
              },
              {
                icon: "verified_user",
                step: "03",
                title: "Pay & Receive Securely",
                desc: "Funds held in escrow until you confirm delivery and product quality at your facility.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white border border-slate-200 rounded-lg p-8 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">
                      {item.icon}
                    </span>
                  </div>
                  <span className="text-3xl font-black text-slate-100">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-black text-deep-blue mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY SWIFTTRADE ─── */}
      <section id="why" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
              Platform
            </p>
            <h2 className="text-4xl font-black text-deep-blue tracking-tight">
              Why SwiftTrade?
            </h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto font-medium">
              Built specifically for the unique challenges of the Nigerian
              supply chain.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "lock",
                title: "Escrow Protection",
                desc: "Payments released only after you inspect and confirm delivery. Zero fraud risk.",
              },
              {
                icon: "verified",
                title: "Verified Merchants",
                desc: "Every supplier undergoes a rigorous 5-step background and inventory verification process.",
              },
              {
                icon: "visibility_off",
                title: "Private Pricing",
                desc: "Access exclusive B2B rates hidden from the open consumer market. Your margins stay yours.",
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

      {/* ─── CTA SECTION ─── */}
      <section className="py-20 bg-deep-blue">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
            Ready to modernize your procurement?
          </h2>
          <p className="text-white/60 font-medium mb-8">
            Join hundreds of Nigerian businesses trading securely on SwiftTrade.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-primary hover:bg-primary-dark text-white font-bold h-14 px-10 rounded-lg flex items-center gap-2 transition-all shadow-xl shadow-primary/30"
            >
              Create Free Account
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link
              href="/login"
              className="border border-white/20 text-white font-bold h-14 px-10 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-8 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo variant="light" size="sm" />
          <p className="text-xs text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} SwiftTrade Technologies. Built for
            Nigeria.
          </p>
          <div className="flex gap-6 text-xs font-bold text-slate-400">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
