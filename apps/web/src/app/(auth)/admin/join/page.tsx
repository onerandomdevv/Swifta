"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "../../../../lib/api/auth.api";
import { useToast } from "../../../../providers/toast-provider";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import Link from "next/link";

// Schema for registration
const joinSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  accessToken: z.string().min(10, "Please enter a valid access token"),
});

type JoinFormData = z.infer<typeof joinSchema>;

export default function StaffJoinPage() {
  const toast = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
    defaultValues: { fullName: "", email: "", password: "", accessToken: "" },
  });

  const onSubmit = async (data: JoinFormData) => {
    setFormError(null);
    try {
      // Call the admin auth endpoint
      const response = await authApi.adminRegister(data);
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

  // Success State UI
  if (isSuccess) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-slate-900 shadow-xl border border-slate-700/50 rounded-xl p-8 md:p-10 relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>

          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 ring-8 ring-emerald-500/10">
            <span className="material-symbols-outlined text-4xl">
              check_circle
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Registration Complete
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Your account has been successfully created and is now{" "}
            <span className="text-amber-400 font-medium">pending approval</span>
            . You will not be able to log in until a Super Admin approves your
            account.
          </p>

          <Link href="/admin/login" className="block w-full">
            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 h-12">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md my-8">
      {/* Registration Card */}
      <div className="bg-slate-900 shadow-xl border border-slate-700/50 rounded-xl p-8 md:p-10 relative overflow-hidden">
        {/* Subtle decorative accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

        {/* Card Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-4 text-slate-200 flex items-center justify-center size-14 rounded-full bg-slate-800 ring-4 ring-slate-800/50">
            <span className="material-symbols-outlined text-3xl font-bold">
              badge
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Staff Onboarding
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium leading-relaxed">
            Enter your token to create your internal account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Inline Error Display */}
          {formError && (
            <div className="p-3 text-sm font-medium text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-2 animate-slide-in">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{formError}</span>
            </div>
          )}

          {/* Access Token */}
          <div className="space-y-2">
            <label
              className="text-sm font-bold text-slate-300 block"
              htmlFor="accessToken"
            >
              Access Token
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500 text-[20px]">
                  key
                </span>
              </div>
              <Input
                id="accessToken"
                type="text"
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono tracking-wider"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                {...register("accessToken")}
              />
            </div>
            {errors.accessToken && (
              <p className="text-xs font-semibold text-red-400 flex items-center mt-1">
                <span className="material-symbols-outlined text-[14px] mr-1">
                  warning
                </span>
                {errors.accessToken.message}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <label
              className="text-sm font-bold text-slate-300 block"
              htmlFor="fullName"
            >
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500 text-[20px]">
                  person
                </span>
              </div>
              <Input
                id="fullName"
                type="text"
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800"
                placeholder="John Doe"
                {...register("fullName")}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs font-semibold text-red-400 flex items-center mt-1">
                <span className="material-symbols-outlined text-[14px] mr-1">
                  warning
                </span>
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label
              className="text-sm font-bold text-slate-300 block"
              htmlFor="email"
            >
              Work Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500 text-[20px]">
                  mail
                </span>
              </div>
              <Input
                id="email"
                type="email"
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800"
                placeholder="john@hardwareos.com"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs font-semibold text-red-400 flex items-center mt-1">
                <span className="material-symbols-outlined text-[14px] mr-1">
                  warning
                </span>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              className="text-sm font-bold text-slate-300 block"
              htmlFor="password"
            >
              Secure Password
            </label>
            <div className="relative group/password">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500 text-[20px]">
                  lock
                </span>
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800"
                placeholder="••••••••"
                {...register("password")}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-semibold text-red-400 flex items-center mt-1">
                <span className="material-symbols-outlined text-[14px] mr-1">
                  warning
                </span>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-sm mt-4 h-12 shadow-md shadow-indigo-900/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-lg">
                  sync
                </span>
                Registering...
              </div>
            ) : (
              "Create Account"
            )}
          </Button>

          {/* Back to Login */}
          <div className="text-center pt-2 border-t border-slate-800">
            <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href="/admin/login"
                className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-all"
              >
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
