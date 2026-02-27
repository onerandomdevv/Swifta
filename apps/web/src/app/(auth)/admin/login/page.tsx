"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  type LoginFormData,
} from "../../../../lib/validations/auth";
import { useAuth } from "../../../../providers/auth-provider";
import { useToast } from "../../../../providers/toast-provider";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import Link from "next/link";

export default function InternalLoginPage() {
  const router = useRouter();
  const { internalLogin, user } = useAuth();
  const toast = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
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
      await internalLogin(data.email, data.password);
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
    <div className="w-full max-w-md">
      {/* Login Card */}
      <div className="bg-slate-900 shadow-xl border border-slate-700/50 rounded-xl p-8 md:p-10 relative overflow-hidden">
        {/* Subtle decorative accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"></div>

        {/* Card Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-4 text-slate-200 flex items-center justify-center size-14 rounded-full bg-slate-800 ring-4 ring-slate-800/50">
            <span className="material-symbols-outlined text-3xl font-bold">
              admin_panel_settings
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Internal Operations
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium leading-relaxed max-w-[280px]">
            Restricted access. Authorized SWIFTTRADE personnel only.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Inline Error Display */}
          {formError && (
            <div className="p-3 text-sm font-medium text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-2 animate-slide-in">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{formError}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label
              className="text-sm font-bold text-slate-300 block"
              htmlFor="email"
            >
              Staff Email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg z-10">
                badge
              </span>
              <Input
                className={`pl-10 bg-slate-800 text-white h-12 ${errors.email ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500" : "border-slate-700 focus-visible:ring-slate-600"}`}
                id="email"
                type="email"
                placeholder="ops@hardwareos.com"
                {...register("email", { onChange: () => setFormError(null) })}
              />
            </div>
            {errors.email && (
              <p className="text-sm font-semibold text-red-500 mt-1 animate-slide-in">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-bold text-slate-300 block"
                htmlFor="password"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg z-10">
                lock
              </span>
              <Input
                className={`pl-10 pr-10 bg-slate-800 text-white h-12 ${errors.password ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500" : "border-slate-700 focus-visible:ring-slate-600"}`}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password", {
                  onChange: () => setFormError(null),
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 outline-none z-10"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {errors.password && (
              <p className="text-sm font-semibold text-red-500 mt-1 animate-slide-in">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            disabled={isSubmitting}
            className="w-full h-12 text-md font-bold shadow-md gap-2 bg-slate-100 text-slate-900 hover:bg-white"
            type="submit"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
            {!isSubmitting && (
              <span className="material-symbols-outlined text-sm font-bold">
                shield_lock
              </span>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            SWIFTTRADE INTERNAL PORTAL
          </p>
        </div>
      </div>
    </div>
  );
}
