"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../../../../lib/api/auth.api";
import { useAuth } from "../../../../providers/auth-provider";
import { useToast } from "../../../../providers/toast-provider";
import { getDisplayName } from "@hardware-os/shared";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const slides = [
  "/images/hero/slide-1.jpg",
  "/images/hero/slide-2.jpg",
  "/images/hero/slide-3.jpg",
  "/images/hero/slide-4.jpg",
  "/images/hero/slide-5.jpg",
];

export default function VerifyTokenPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const toast = useToast();

  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Guard: only OPERATOR and SUPPORT should be here
  if (!user || !["OPERATOR", "SUPPORT"].includes(user.role)) {
    if (typeof window !== "undefined") {
      router.push("/admin/login");
    }
    return null;
  }

  const roleLabel = user.role === "OPERATOR" ? "Operator" : "Support";
  const roleColor =
    user.role === "OPERATOR"
      ? "from-orange-500 via-amber-500 to-orange-400"
      : "from-blue-500 via-indigo-500 to-cyan-400";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await authApi.verifyStaffToken(token);
      toast.success("Access verified. Welcome to your dashboard.");

      if (user.role === "OPERATOR") {
        router.push("/operator");
      } else {
        router.push("/support");
      }
    } catch (err: any) {
      const errorMessage =
        typeof err === "string"
          ? err
          : err.error || err.message || "Invalid access token.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-display">
      {/* ─── LEFT: Image Slideshow Panel ─── */}
      <div className="hidden lg:block lg:w-[50%] relative sticky top-0 h-screen overflow-hidden">
        {/* Slides */}
        {slides.map((src, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <img
              src={src}
              alt="Construction materials logistics"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {/* Overlay */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/10" />

        {/* Overlay Content */}
        <div className="absolute bottom-10 left-10 right-10 z-30 text-white">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <Logo variant="dark" size="lg" />
          </Link>
          <p className="text-white/70 text-base font-medium max-w-sm leading-relaxed mb-6 border-l-2 border-orange-500 pl-4 py-1">
            <span className="text-orange-400 font-bold block mb-1 tracking-widest text-xs uppercase">
              Internal Operations Portal
            </span>
            Secure administration and operational management for the SwiftTrade
            infrastructure.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: "shield_lock", label: "Strict Access Control" },
              {
                icon: "admin_panel_settings",
                label: "Super Admin Prerogatives",
              },
              { icon: "monitoring", label: "Real-time System Oversight" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-sm font-semibold text-white/80"
              >
                <span className="material-symbols-outlined text-orange-400 text-base">
                  {item.icon}
                </span>
                {item.label}
              </div>
            ))}
          </div>

          {/* Slide dots */}
          <div className="flex gap-2 mt-8">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-1 cursor-pointer rounded-full transition-all duration-500 bg-orange-400 ${i === currentSlide ? "w-6 opacity-100" : "w-2 opacity-30"}`}
                onClick={() => setCurrentSlide(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Verification Panel ─── */}
      <div className="w-full lg:w-[50%] bg-slate-50 flex flex-col h-screen overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <Link href="/" className="flex items-center gap-2">
            <Logo variant="light" size="md" />
          </Link>
          <span className="bg-orange-100 text-orange-800 text-xs font-black px-2 py-1 rounded tracking-widest">
            SECURITY
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-12 lg:px-14 xl:px-20 max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="mb-10 relative">
            <div className="absolute -left-12 top-0 bottom-0 w-1 bg-orange-500 rounded-r hidden md:block"></div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
              Verification Required{" "}
              <span className="material-symbols-outlined text-orange-500 text-3xl font-light">
                verified_user
              </span>
            </h1>
            <p className="text-slate-500 font-medium">
              A valid staff token is required to access your{" "}
              <span className="text-slate-900 font-bold">
                {roleLabel} Terminal
              </span>
              .
            </p>
          </div>

          {/* User Profile Badge (Simplified for light bg) */}
          <div className="mb-10 p-5 bg-white border border-slate-200 rounded-2xl flex items-center gap-5 shadow-sm">
            <div
              className={`h-14 w-14 rounded-xl bg-gradient-to-br ${roleColor} flex items-center justify-center shadow-lg transform -rotate-2`}
            >
              <span className="material-symbols-outlined text-white text-3xl font-light">
                account_circle
              </span>
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 leading-tight tracking-tight">
                {getDisplayName(user) || user.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`size-2 rounded-full animate-pulse ${user.role === "OPERATOR" ? "bg-orange-500" : "bg-blue-500"}`}
                ></span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                  {user.role} CHANNEL
                </p>
              </div>
            </div>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-red-500 mt-0.5 text-xl font-bold">
                gpp_maybe
              </span>
              <p className="text-sm font-bold text-red-700 leading-snug">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label
                className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block ml-1"
                htmlFor="accessToken"
              >
                Access Encryption Token
              </label>
              <div className="relative group/field">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl z-10 transition-colors group-focus-within/field:text-slate-900">
                  key
                </span>
                <input
                  className={`w-full pl-12 pr-12 h-16 bg-white border shadow-sm text-xl font-mono tracking-[0.2em] uppercase focus:ring-2 focus:ring-orange-500 focus:border-orange-500 rounded-2xl transition-all ${
                    token.length > 0 &&
                    !/^[A-Z0-9-]+$/.test(token.toUpperCase())
                      ? "border-red-400 text-red-600"
                      : token.length >= 29
                        ? "border-emerald-400 text-emerald-600 shadow-[0_0_20px_-10px_rgba(16,185,129,0.2)]"
                        : "border-slate-200 text-slate-900"
                  }`}
                  id="accessToken"
                  type="text"
                  placeholder="••••-••••-••••-••••-••••"
                  value={token}
                  onChange={(e) => {
                    const val = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9-]/g, "");
                    setToken(val);
                    setError(null);
                  }}
                  maxLength={29}
                  autoFocus
                />
                {token.length >= 29 && /^[A-Z0-9-]+$/.test(token) && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center animate-in fade-in slide-in-from-right-2">
                    <span className="material-symbols-outlined text-emerald-500 text-2xl font-light">
                      verified
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-slate-200"></span>
                  SECURITY LEVEL 2
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${token.length >= 29 ? "bg-emerald-500" : "bg-orange-400"}`}
                      style={{ width: `${(token.length / 29) * 100}%` }}
                    />
                  </div>
                  <p
                    className={`text-[10px] font-black uppercase tracking-tighter w-12 text-right ${token.length >= 29 ? "text-emerald-500" : "text-slate-400"}`}
                  >
                    {token.length} / 29
                  </p>
                </div>
              </div>
            </div>

            <button
              disabled={isSubmitting || token.length < 10}
              className={`w-full h-16 text-sm font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10 transition-all rounded-2xl active:scale-[0.98] flex items-center justify-center gap-3 ${
                token.length >= 10
                  ? "bg-slate-900 text-white hover:bg-black"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-xl font-light">
                    sync_lock
                  </span>
                  Authenticating
                </>
              ) : (
                <>
                  Verify Access
                  <span className="material-symbols-outlined text-lg">
                    shield_check
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Switch to Login / Logout */}
          <div className="text-center pt-8 border-t border-slate-200 mt-8 flex flex-col gap-4">
            <button
              onClick={() => {
                logout();
                router.push("/admin/login");
              }}
              className="text-[10px] text-slate-400 hover:text-red-600 font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/back"
            >
              <span className="material-symbols-outlined text-sm transition-transform group-hover/back:-translate-x-1">
                logout
              </span>
              Terminate Session & Back to Login
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-slate-200 bg-white">
          <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            SwiftTrade Internal Portal &bull; Strictly Confidential
          </p>
        </footer>
      </div>
    </div>
  );
}
