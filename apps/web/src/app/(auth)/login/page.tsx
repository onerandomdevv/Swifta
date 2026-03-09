"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "../../../lib/validations/auth";
import { useAuth } from "../../../providers/auth-provider";
import { useToast } from "../../../providers/toast-provider";
import { UserRole } from "@hardware-os/shared";
import { Logo } from "@/components/ui/logo";

const slides = [
  "/images/hero/slide-1.jpg",
  "/images/hero/slide-2.jpg",
  "/images/hero/slide-3.jpg",
  "/images/hero/slide-4.jpg",
  "/images/hero/slide-5.jpg",
];

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
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
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (user) {
      let dashboardPath = "/";
      if (user.role === "SUPER_ADMIN") dashboardPath = "/admin";
      else if (user.role === "OPERATOR") dashboardPath = "/operator";
      else if (user.role === "SUPPORT") dashboardPath = "/support";
      else if (user.role === UserRole.MERCHANT)
        dashboardPath = "/merchant/dashboard";
      else dashboardPath = "/buyer/dashboard";
      router.push(dashboardPath);
    }
  }, [user, router]);

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
    } catch (err: any) {
      const errorMessage =
        typeof err === "string"
          ? err
          : err.error ||
            err.message ||
            "Invalid credentials. Please try again.";
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
              alt="SwiftTrade marketplace"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {/* Overlay */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-deep-blue via-deep-blue/50 to-transparent" />

        {/* Overlay Content */}
        <div className="absolute bottom-10 left-10 right-10 z-30 text-white">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <Logo variant="dark" size="lg" />
          </Link>
          <p className="text-white/70 text-base font-medium max-w-xs leading-relaxed mb-6">
            Nigeria&apos;s first WhatsApp E-Commerce Platform. Buy and sell
            anything with escrow.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: "lock", label: "Escrow Protection" },
              { icon: "verified", label: "Verified Merchants" },
              { icon: "payments", label: "Instant Payouts" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-sm font-semibold text-white/80"
              >
                <span className="material-symbols-outlined text-primary text-base">
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
                className={`h-1 rounded-full transition-all duration-500 bg-white ${i === currentSlide ? "w-6 opacity-100" : "w-2 opacity-30"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Login Form ─── */}
      <div className="w-full lg:w-[50%] bg-white flex flex-col min-h-screen lg:h-screen overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-6 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <Logo variant="light" size="md" />
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 py-12 md:px-12 lg:px-14 xl:px-20">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-deep-blue tracking-tight mb-2">
              Welcome back to SwiftTrade
            </h1>
            <p className="text-slate-500 font-medium">
              Sign in to your marketplace
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
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                className={`w-full px-4 py-3.5 bg-[#f6f6f8] border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-slate-900 text-sm ${errors.email ? "border-red-400" : "border-slate-200"}`}
                placeholder="your@email.com"
                type="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs font-semibold text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  className={`w-full px-4 pr-12 py-3.5 bg-[#f6f6f8] border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-slate-900 text-sm ${errors.password ? "border-red-400" : "border-slate-200"}`}
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
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
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-2"
              type="submit"
            >
              <span>{isSubmitting ? "Signing in..." : "Sign In"}</span>
              {!isSubmitting && (
                <span className="material-symbols-outlined text-lg">login</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 font-medium">
              Don&apos;t have an account?{" "}
              <Link
                className="text-primary font-bold hover:underline"
                href="/register"
              >
                Register
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-slate-100">
          <p className="text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} SwiftTrade. Lagos, Nigeria.
          </p>
        </footer>
      </div>
    </div>
  );
}
