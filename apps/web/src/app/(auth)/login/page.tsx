"use client";

import { useState, useEffect, FormEvent } from "react";
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
  const { login, user, initiateWhatsAppLogin, verifyWhatsAppLogin } = useAuth();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // WhatsApp Login State
  const [loginMode, setLoginMode] = useState<"password" | "whatsapp">(
    "password",
  );
  const [whatsappStep, setWhatsappStep] = useState<"phone" | "otp">("phone");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappOtp, setWhatsappOtp] = useState("");
  const [isWhatsAppLoading, setIsWhatsAppLoading] = useState(false);

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

  const handleWhatsAppInitiate = async (e: FormEvent) => {
    e.preventDefault();
    if (!whatsappPhone) return;
    setIsWhatsAppLoading(true);
    setFormError(null);
    try {
      await initiateWhatsAppLogin(whatsappPhone);
      setWhatsappStep("otp");
      toast.success("OTP sent to your WhatsApp!");
    } catch (err: any) {
      setFormError(err.error || err.message || "Failed to send WhatsApp OTP");
    } finally {
      setIsWhatsAppLoading(false);
    }
  };

  const handleWhatsAppVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!whatsappOtp) return;
    setIsWhatsAppLoading(true);
    setFormError(null);
    try {
      await verifyWhatsAppLogin(whatsappPhone, whatsappOtp);
      toast.success("Welcome back!");
    } catch (err: any) {
      setFormError(err.error || err.message || "Invalid OTP");
    } finally {
      setIsWhatsAppLoading(false);
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
              Welcome back
            </h1>
            <p className="text-slate-500 font-medium">
              {loginMode === "password"
                ? "Sign in to your marketplace"
                : "Login securely with WhatsApp OTP"}
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

          {loginMode === "password" ? (
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
                  <span className="material-symbols-outlined text-lg">
                    login
                  </span>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              {whatsappStep === "phone" ? (
                <form onSubmit={handleWhatsAppInitiate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      WhatsApp Number
                    </label>
                    <input
                      className="w-full px-4 py-3.5 bg-[#f6f6f8] border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-slate-900 text-sm"
                      placeholder="e.g. 2348100000000"
                      type="tel"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Enter your phone number in international format (e.g.
                      234...). We&apos;ll send a secure OTP to your WhatsApp
                      account.
                    </p>
                  </div>
                  <button
                    disabled={isWhatsAppLoading}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] disabled:opacity-50 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                    type="submit"
                  >
                    <span>
                      {isWhatsAppLoading ? "Sending..." : "Send WhatsApp OTP"}
                    </span>
                    {!isWhatsAppLoading && (
                      <span className="material-symbols-outlined text-lg">
                        send
                      </span>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleWhatsAppVerify} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-bold text-slate-700">
                        Verification Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setWhatsappStep("phone")}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Change number
                      </button>
                    </div>
                    <input
                      className="w-full px-4 py-3.5 bg-[#f6f6f8] border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-slate-900 text-sm text-center tracking-[0.5em] font-mono text-xl"
                      placeholder="000000"
                      maxLength={6}
                      value={whatsappOtp}
                      onChange={(e) => setWhatsappOtp(e.target.value)}
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-2 text-center">
                      Please enter the 6-digit code sent to {whatsappPhone} via
                      WhatsApp.
                    </p>
                  </div>
                  <button
                    disabled={isWhatsAppLoading}
                    className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                    type="submit"
                  >
                    <span>
                      {isWhatsAppLoading ? "Verifying..." : "Verify & Login"}
                    </span>
                    {!isWhatsAppLoading && (
                      <span className="material-symbols-outlined text-lg">
                        verified_user
                      </span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                OR
              </span>
            </div>
          </div>

          {/* Mode Toggle Button */}
          <button
            onClick={() => {
              setLoginMode(loginMode === "password" ? "whatsapp" : "password");
              setFormError(null);
            }}
            className={`w-full flex items-center justify-center gap-3 py-3 px-4 border rounded-xl font-bold text-sm transition-all hover:bg-slate-50 ${
              loginMode === "password"
                ? "border-[#25D366] text-[#128C7E] bg-green-50/30"
                : "border-slate-200 text-slate-700"
            }`}
          >
            {loginMode === "password" ? (
              <>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.996-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.224-3.82c1.516.903 3.12 1.379 4.763 1.383h.005c5.448 0 9.884-4.436 9.887-9.885 0-2.64-1.03-5.123-2.9-6.995a9.851 9.851 0 0 0-6.991-2.898c-5.448 0-9.884 4.437-9.887 9.885 0 1.769.459 3.498 1.338 5.011l-.995 3.634 3.731-.979zm11.171-7.53c-.305-.153-1.805-.891-2.085-.992-.28-.103-.483-.153-.685.153-.203.303-.787.992-.965 1.193-.177.203-.353.228-.658.077-.305-.153-1.287-.475-2.451-1.513-.905-.806-1.515-1.802-1.693-2.105-.177-.302-.019-.465.133-.615.136-.135.305-.353.458-.53.153-.177.203-.303.305-.504.102-.203.051-.378-.025-.53-.076-.153-.685-1.651-.938-2.259-.247-.591-.499-.511-.685-.521-.176-.01-.378-.011-.58-.011s-.53.076-.81.378c-.28.303-1.065 1.041-1.065 2.541s1.092 2.949 1.242 3.15c.153.203 2.15 3.282 5.208 4.605.727.314 1.294.502 1.737.643.73.232 1.393.199 1.918.121.585-.087 1.805-.738 2.06-1.45.253-.711.253-1.32.177-1.45-.076-.129-.28-.206-.584-.359z" />
                </svg>
                Continue with WhatsApp
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">key</span>
                Sign in with Password
              </>
            )}
          </button>

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
