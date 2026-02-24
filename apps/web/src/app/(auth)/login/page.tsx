"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "../../../lib/validations/auth";
import { useAuth } from "../../../providers/auth-provider";
import { useToast } from "../../../providers/toast-provider";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
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
    if (user) {
      let dashboardPath = "/";
      if (user.role === "SUPER_ADMIN") {
        dashboardPath = "/admin";
      } else if (user.role === "OPERATOR") {
        dashboardPath = "/operator";
      } else if (user.role === "SUPPORT") {
        dashboardPath = "/support";
      } else if (user.role === "MERCHANT") {
        dashboardPath = "/merchant/dashboard";
      } else {
        dashboardPath = "/buyer/dashboard";
      }
      router.push(dashboardPath);
    }
  }, [user, router]);

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
    } catch (err: any) {
      console.error("Login error:", err);
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
    <div className="w-full max-w-md">
      {/* Login Card */}
      <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-xl p-8 md:p-10">
        {/* Card Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-4 text-primary dark:text-slate-200 flex items-center justify-center size-14 rounded-full bg-primary/10 ring-4 ring-primary/5">
            <span className="material-symbols-outlined text-3xl font-bold">
              login
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            Please enter your details to sign in
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Inline Error Display */}
          {formError && (
            <div className="p-3 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-lg flex items-start gap-2 animate-slide-in">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{formError}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label
              className="text-sm font-bold text-slate-700 dark:text-slate-300 block"
              htmlFor="email"
            >
              Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10">
                mail
              </span>
              <Input
                className={`pl-10 bg-slate-50 dark:bg-slate-800 h-12 ${errors.email ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500" : "border-slate-200 dark:border-slate-700"}`}
                id="email"
                type="email"
                placeholder="e.g. name@company.com"
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
                className="text-sm font-bold text-slate-700 dark:text-slate-300 block"
                htmlFor="password"
              >
                Password
              </label>
              <Link
                className="text-xs font-bold text-primary hover:underline"
                href="/forgot-password"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10">
                lock
              </span>
              <Input
                className={`pl-10 pr-10 bg-slate-50 dark:bg-slate-800 h-12 ${errors.password ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500" : "border-slate-200 dark:border-slate-700"}`}
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 outline-none z-10"
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
            className="w-full h-12 text-md font-bold shadow-md gap-2"
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
            {!isSubmitting && (
              <span className="material-symbols-outlined text-sm font-bold">
                arrow_forward
              </span>
            )}
          </Button>
        </form>

        {/* Toggle Link */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500 font-medium">
            Don't have an account?
            <Link
              className="font-bold text-primary hover:underline ml-1"
              href="/register"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
