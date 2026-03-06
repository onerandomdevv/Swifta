"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "../../../../lib/api/auth.api";
import { useToast } from "../../../../providers/toast-provider";
import { Button } from "../../../../components/ui/button";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// Schema for registration
const joinSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  accessToken: z.string().min(10, "Please enter a valid access token"),
});

type JoinFormData = z.infer<typeof joinSchema>;

const slides = [
  "/images/hero/slide-1.jpg",
  "/images/hero/slide-2.jpg",
  "/images/hero/slide-3.jpg",
  "/images/hero/slide-4.jpg",
  "/images/hero/slide-5.jpg",
];

export default function StaffJoinPage() {
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
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
  } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      password: "",
      accessToken: "",
    },
  });

  const onSubmit = async (data: JoinFormData) => {
    setFormError(null);
    try {
      await authApi.adminRegister(data);
      setIsSuccess(true);
      toast.success("Account created successfully. Awaiting approval.");
    } catch (err: any) {
      console.error("Staff join error:", err);
      let errorMessage = "Registration failed. Please try again.";
      if (err.message) {
        errorMessage = Array.isArray(err.message)
          ? err.message[0]
          : err.message;
      }
      setFormError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-display">
      {/* ─── LEFT: Image Slideshow Panel (Identical to Login) ─── */}
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
          <Link
            href="/"
            className="flex items-center gap-2 mb-6 transition-transform active:scale-95"
          >
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

      {/* ─── RIGHT: Form Panel ─── */}
      <div className="w-full lg:w-[50%] bg-slate-50 flex flex-col h-screen overflow-y-auto">
        {/* Mobile header (Identical to Login) */}
        <div className="lg:hidden flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <Link href="/" className="flex items-center gap-2">
            <Logo variant="light" size="md" />
          </Link>
          <span className="bg-orange-100 text-orange-800 text-xs font-black px-2 py-1 rounded tracking-widest uppercase">
            Onboarding
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-12 lg:px-14 xl:px-20 max-w-2xl mx-auto w-full">
          {isSuccess ? (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 ring-8 ring-emerald-50">
                <span className="material-symbols-outlined text-5xl font-light">
                  task_alt
                </span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">
                Onboarding Initiated
              </h2>
              <p className="text-slate-500 mb-10 leading-relaxed font-medium">
                Your staff account has been created. A{" "}
                <span className="text-orange-600 font-bold">Super Admin</span>
                will review your credentials shortly. You will be notified via
                email once approved.
              </p>
              <Link href="/admin/login" className="block w-full">
                <Button className="w-full bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.1em] h-14 rounded-xl transition-all active:scale-[0.98]">
                  Return to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-10 relative">
                <div className="absolute -left-12 top-0 bottom-0 w-1 bg-orange-500 rounded-r hidden md:block"></div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
                  Staff Registry{" "}
                  <span className="material-symbols-outlined text-orange-500 text-3xl">
                    badge
                  </span>
                </h1>
                <p className="text-slate-500 font-medium">
                  Enter your access token to create your internal credentials.
                </p>
              </div>

              {/* Error alert */}
              {formError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <span className="material-symbols-outlined text-red-500 mt-0.5 text-xl font-bold">
                    error
                  </span>
                  <p className="text-sm font-bold text-red-700 leading-snug">
                    {formError}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Access Token */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">
                      vpn_key
                    </span>{" "}
                    Identification Token
                  </label>
                  <input
                    className={`w-full px-4 py-3.5 bg-white border shadow-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-slate-900 text-sm font-mono tracking-widest uppercase ${errors.accessToken ? "border-red-400" : "border-slate-200"}`}
                    placeholder="TOKEN-XXXX-XXXX"
                    {...register("accessToken")}
                  />
                  {errors.accessToken && (
                    <p className="text-xs font-bold text-red-500 mt-1.5 ml-1">
                      {errors.accessToken.message}
                    </p>
                  )}
                </div>

                {/* Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-slate-400">
                        person
                      </span>{" "}
                      First Name
                    </label>
                    <input
                      className={`w-full px-4 py-3.5 bg-white border shadow-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-slate-900 text-sm ${errors.firstName ? "border-red-400" : "border-slate-200"}`}
                      placeholder="e.g. Yusuf"
                      {...register("firstName")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Last Name
                    </label>
                    <input
                      className={`w-full px-4 py-3.5 bg-white border shadow-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-slate-900 text-sm ${errors.lastName ? "border-red-400" : "border-slate-200"}`}
                      placeholder="e.g. Saheed"
                      {...register("lastName")}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">
                      alternate_email
                    </span>{" "}
                    Work Email Address
                  </label>
                  <input
                    className={`w-full px-4 py-3.5 bg-white border shadow-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-slate-900 text-sm ${errors.email ? "border-red-400" : "border-slate-200"}`}
                    placeholder="yusuf@swifttrade.com"
                    type="email"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs font-bold text-red-500 mt-1.5 ml-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">
                      lock
                    </span>{" "}
                    Secure Password
                  </label>
                  <div className="relative shadow-sm rounded-xl overflow-hidden">
                    <input
                      className={`w-full px-4 pr-12 py-3.5 bg-white border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-slate-900 text-sm ${errors.password ? "border-red-400" : "border-slate-200"}`}
                      placeholder="••••••••••••"
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
                    <p className="text-xs font-bold text-red-500 mt-1.5 ml-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-black uppercase tracking-[0.1em] py-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-3 mt-6 active:scale-[0.98]"
                  type="submit"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-xl font-light">
                        progress_activity
                      </span>
                      Registering...
                    </>
                  ) : (
                    <>
                      <span>Initialize Account</span>
                      <span className="material-symbols-outlined text-lg">
                        shield_lock
                      </span>
                    </>
                  )}
                </button>

                {/* Switch to Login */}
                <div className="text-center pt-8 border-t border-slate-200 mt-4">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                    Already registered?{" "}
                    <Link
                      href="/admin/login"
                      className="text-slate-900 hover:text-orange-600 font-black transition-all ml-2 border-b-2 border-orange-500/20 hover:border-orange-500 pb-1"
                    >
                      Navigate to Login
                    </Link>
                  </p>
                </div>
              </form>
            </>
          )}
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
