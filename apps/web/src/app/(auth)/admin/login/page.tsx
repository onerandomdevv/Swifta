"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  type LoginFormData,
} from "../../../../lib/validations/auth";
import { useAuth } from "../../../../providers/auth-provider";
import { useToast } from "../../../../providers/toast-provider";
import { UserRole } from "@swifta/shared";
import { Logo } from "@/components/ui/logo";

const slides = [
  "/images/hero/slide-1.jpg",
  "/images/hero/slide-2.jpg",
  "/images/hero/slide-3.jpg",
  "/images/hero/slide-4.jpg",
  "/images/hero/slide-5.jpg",
];

export default function InternalLoginPage() {
  const router = useRouter();
  const { internalLogin, user } = useAuth();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  // Redirect on successful login
  useEffect(() => {
    if (user && user.role === "SUPER_ADMIN") {
      router.push("/admin");
    } else if (user && ["OPERATOR", "SUPPORT"].includes(user.role)) {
      router.push("/admin/verify-token");
    } else if (user) {
      router.push("/");
    }
  }, [user, router]);

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    try {
      await internalLogin(data.identifier, data.password);
      toast.success("Internal portal access granted.");
    } catch (err: any) {
      console.error("Internal login error:", err);
      const errorMessage =
        typeof err === "string"
          ? err
          : err.error || err.message || "Access denied to internal portal.";
      setFormError(errorMessage);
      toast.error(errorMessage);
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
              alt="Swifta admin dashboard"
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
            Secure administration and operational management for the Swifta
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

      {/* ─── RIGHT: Login Form ─── */}
      <div className="w-full lg:w-[50%] bg-slate-50 flex flex-col h-screen overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <Link href="/" className="flex items-center gap-2">
            <Logo variant="light" size="md" />
          </Link>
          <span className="bg-orange-100 text-orange-800 text-xs font-black px-2 py-1 rounded tracking-widest">
            INTERNAL
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-12 lg:px-14 xl:px-20">
          {/* Header */}
          <div className="mb-8 relative">
            <div className="absolute -left-12 top-0 bottom-0 w-1 bg-orange-500 rounded-r hidden md:block"></div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
              Staff Portal{" "}
              <span className="material-symbols-outlined text-orange-500 text-3xl">
                admin_panel_settings
              </span>
            </h1>
            <p className="text-slate-500 font-medium">
              Authorized personnel only. Enter your credentials to proceed.
            </p>
          </div>

          {/* Error alert */}
          {formError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 mt-0.5 text-xl">
                error
              </span>
              <p className="text-sm font-medium text-red-700 leading-snug">
                {formError}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-slate-400">
                  badge
                </span>{" "}
                Staff Email
              </label>
              <input
                className={`w-full px-4 py-3.5 bg-white border shadow-sm rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-slate-900 text-sm ${errors.identifier ? "border-red-400" : "border-slate-200"}`}
                placeholder="ops@swifta.store"
                type="text"
                {...register("identifier", { onChange: () => setFormError(null) })}
              />
              {errors.identifier && (
                <p className="text-xs font-semibold text-red-500 mt-1">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-slate-400">
                    lock
                  </span>{" "}
                  Password
                </label>
              </div>
              <div className="relative shadow-sm rounded-lg">
                <input
                  className={`w-full px-4 pr-12 py-3.5 bg-white border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-slate-900 text-sm ${errors.password ? "border-red-400" : "border-slate-200"}`}
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    onChange: () => setFormError(null),
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-semibold text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 mt-4"
              type="submit"
            >
              <span>{isSubmitting ? "Authenticating..." : "Secure Login"}</span>
              {!isSubmitting && (
                <span className="material-symbols-outlined text-lg">
                  shield_lock
                </span>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
