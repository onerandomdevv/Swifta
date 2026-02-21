"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRole } from "@hardware-os/shared";
import type { RegisterDto } from "@hardware-os/shared";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { authApi } from "@/lib/api/auth.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = 1 | 2 | 3 | 4;

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  const router = useRouter();
  const { register } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
  };

  const handleContinueToDetails = () => {
    if (role) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Attempt real registration
      await register({
        email: formData.email,
        phone: formData.phone,
        fullName: formData.fullName,
        password: formData.password,
        businessName: formData.businessName,
        role: role as UserRole,
      } as RegisterDto);

      setStep(3);
      toast.success("Registration successful! Check your inbox.");
    } catch (err: any) {
      console.error("Registration error:", err);
      const errorMessage =
        typeof err === "string"
          ? err
          : err.error ||
            err.message ||
            "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      await authApi.verifyEmail({ email: formData.email, code: otp.join("") });
      setStep(4);
      toast.success("Email verified successfully!");

      // Auto redirect after 2 seconds
      const dashboardPath =
        role === UserRole.MERCHANT ? "/merchant/dashboard" : "/buyer/dashboard";
      setTimeout(() => {
        router.push(dashboardPath);
      }, 2000);
    } catch (err: any) {
      toast.error(err.error || "Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isLoading) return;
    try {
      await authApi.resendVerification({ email: formData.email });
      toast.success("A new verification code has been sent.");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      toast.error(
        err.error || "Could not resend code. Please try again later.",
      );
    }
  };

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center py-10">
      {step === 1 && (
        <div className="w-full max-w-4xl space-y-12">
          {/* Progress Stepper */}
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-primary uppercase tracking-wider">
                Registration Step 1 of 4
              </span>
              <span className="text-slate-500 font-medium">25% Complete</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-1/4 rounded-full"></div>
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Join Hardware OS
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-xl mx-auto">
              Choose the role that best fits your business needs. You can always
              change this later in your account settings.
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
            {/* Buyer Card */}
            <button
              onClick={() => handleRoleSelect(UserRole.BUYER)}
              className={`group relative flex flex-col items-start p-8 bg-white dark:bg-slate-900 border-2 rounded-xl transition-all text-left focus:outline-none focus:ring-4 focus:ring-primary/20 
                ${role === UserRole.BUYER ? "border-primary shadow-xl ring-2 ring-primary/10" : "border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/30 hover:shadow-xl"}`}
            >
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-primary text-4xl"
                  aria-hidden="true"
                >
                  shopping_cart
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Register as a Buyer
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Source hardware items across Lagos, request instant quotes,
                  and secure payment via our escrow system.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    <span className="material-symbols-outlined text-primary text-sm font-bold">
                      check_circle
                    </span>
                    Request Unlimited Quotes
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    <span className="material-symbols-outlined text-primary text-sm font-bold">
                      check_circle
                    </span>
                    Escrow Protection
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    <span className="material-symbols-outlined text-primary text-sm font-bold">
                      check_circle
                    </span>
                    Verified Supplier Network
                  </li>
                </ul>
              </div>
              <div className="mt-8 flex items-center text-primary font-bold gap-1 group-hover:translate-x-1 transition-transform">
                Select Buyer{" "}
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
            </button>

            {/* Merchant Card */}
            <button
              onClick={() => handleRoleSelect(UserRole.MERCHANT)}
              className={`group relative flex flex-col items-start p-8 bg-white dark:bg-slate-900 border-2 rounded-xl transition-all text-left focus:outline-none focus:ring-4 focus:ring-primary/20
                ${role === UserRole.MERCHANT ? "border-primary shadow-xl ring-2 ring-primary/10" : "border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/30 hover:shadow-xl"}`}
            >
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-primary text-4xl"
                  aria-hidden="true"
                >
                  storefront
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Register as a Merchant
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  List your inventory, reach thousands of construction firms,
                  and automate your quotation process.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    <span className="material-symbols-outlined text-primary text-sm font-bold">
                      check_circle
                    </span>
                    Inventory Management
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    <span className="material-symbols-outlined text-primary text-sm font-bold">
                      check_circle
                    </span>
                    Direct Quotation Tools
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    <span className="material-symbols-outlined text-primary text-sm font-bold">
                      check_circle
                    </span>
                    Sales Analytics Dashboard
                  </li>
                </ul>
              </div>
              <div className="mt-8 flex items-center text-primary font-bold gap-1 group-hover:translate-x-1 transition-transform">
                Select Merchant{" "}
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
            </button>
          </div>

          {/* Footer Action */}
          <div className="pt-8 flex flex-col items-center gap-4">
            <Button
              onClick={handleContinueToDetails}
              disabled={!role}
              className="w-full max-w-xs h-12 text-md font-bold shadow-lg"
            >
              Continue to Onboarding
            </Button>
            <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
              <p>
                Already have an account?{" "}
                <Link
                  className="text-primary font-bold hover:underline"
                  href="/login"
                >
                  Log in
                </Link>
              </p>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
              <a
                className="text-primary font-bold hover:underline flex items-center gap-1"
                href="#"
              >
                <span className="material-symbols-outlined text-base">
                  help
                </span>
                Need Help?
              </a>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center py-12 md:py-20 w-full px-4">
          {/* Progress Stepper Container */}
          <div className="w-full max-w-[480px] mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Step 2: Account Details
              </span>
              <span className="text-xs font-medium text-slate-500">
                66% Complete
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-2/3 rounded-full"></div>
            </div>
            <div className="flex justify-between mt-4 px-2">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mb-1 ring-4 ring-primary/10">
                  <span className="material-symbols-outlined text-sm font-bold">
                    check
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-500 uppercase">
                  Role
                </span>
              </div>
              <div className="flex-1 border-t-2 border-primary mt-4 mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mb-1 ring-4 ring-primary/10">
                  <span className="text-xs font-bold">2</span>
                </div>
                <span className="text-[10px] font-bold text-primary uppercase">
                  Details
                </span>
              </div>
              <div className="flex-1 border-t-2 border-slate-200 dark:border-slate-800 mt-4 mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-1">
                  <span className="text-xs font-bold">3</span>
                </div>
                <span className="text-[10px] font-medium text-slate-500 uppercase">
                  Verify
                </span>
              </div>
            </div>
          </div>

          {/* Registration Card */}
          <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Account Details
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Please enter your business account information for the Lagos B2B
                marketplace.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label
                  className="block text-sm font-bold text-slate-700 dark:text-slate-300"
                  htmlFor="full_name"
                >
                  Full Name
                </label>
                <Input
                  className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  id="full_name"
                  placeholder="e.g. John Doe"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
              {/* Business Name */}
              <div className="space-y-1.5">
                <label
                  className="block text-sm font-bold text-slate-700 dark:text-slate-300"
                  htmlFor="business_name"
                >
                  Business Name
                </label>
                <Input
                  className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  id="business_name"
                  placeholder="e.g. Lagos Hardware Ltd"
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                />
              </div>
              {/* Email Address */}
              <div className="space-y-1.5">
                <label
                  className="block text-sm font-bold text-slate-700 dark:text-slate-300"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <Input
                  className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  id="email"
                  placeholder="name@company.com"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              {/* Phone Number */}
              <div className="space-y-1.5">
                <label
                  className="block text-sm font-bold text-slate-700 dark:text-slate-300"
                  htmlFor="phone"
                >
                  Phone Number
                </label>
                <Input
                  className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  id="phone"
                  placeholder="e.g. 08012345678"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              {/* Password */}
              <div className="space-y-1.5">
                <label
                  className="block text-sm font-bold text-slate-700 dark:text-slate-300"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-10"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  Minimum 8 characters with at least one number.
                </p>
              </div>
              {/* Actions */}
              <div className="pt-2">
                <Button
                  disabled={isLoading}
                  className="w-full h-12 text-md font-bold shadow-md"
                  type="submit"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            </form>
            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-slate-500 hover:text-primary text-sm font-semibold transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] font-bold">
                  arrow_back
                </span>
                Back to Role Selection
              </button>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Already have an account?
                <Link
                  className="text-primary font-bold hover:underline ml-1"
                  href="/login"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>

          {/* Trust badges removed from inner page as layout has them now */}
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center py-12 md:py-20 w-full px-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 md:p-10 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center size-14 rounded-full bg-primary/10 text-primary mb-6 ring-4 ring-primary/5">
                <span className="material-symbols-outlined text-3xl font-bold">
                  mail_lock
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                Check your inbox
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                We've sent a 6-digit verification code to{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {formData.email || "john.doe@lagostrade.com"}
                </span>
                . Enter it below to secure your account.
              </p>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-8">
              <div className="flex justify-between gap-2 max-w-sm mx-auto">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                    className="w-12 h-14 text-center text-xl font-black bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 dark:text-white outline-none"
                    max={1}
                    maxLength={1}
                    placeholder="•"
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  />
                ))}
              </div>
              <Button
                disabled={isLoading || otp.some((d) => !d)}
                className="w-full h-12 text-md font-bold shadow-md flex items-center justify-center gap-2"
                type="submit"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
            </form>
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-500 mb-2 font-medium">
                Didn't receive the code?
              </p>
              <button
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
                className={`text-primary font-bold text-sm hover:underline flex items-center gap-1 mx-auto transition-all ${resendCooldown > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                type="button"
              >
                <span className="material-symbols-outlined text-sm font-bold">
                  refresh
                </span>
                {resendCooldown > 0
                  ? `Resend Code (${resendCooldown}s)`
                  : "Resend Code"}
              </button>
            </div>
            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-bold"
              >
                <span className="material-symbols-outlined text-lg font-bold">
                  arrow_back
                </span>
                Back to Details
              </button>
            </div>
          </div>
          <p className="mt-6 text-[10px] text-slate-400 text-center uppercase tracking-[0.2em] font-black">
            Verification State
          </p>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col items-center py-12 md:py-20 w-full px-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 md:p-10 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden group">
            {/* Abstract Success Pattern Background */}
            <div className="absolute -top-24 -right-24 size-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
            <div className="absolute -bottom-24 -left-24 size-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>

            <div className="relative z-10">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center size-24 rounded-full bg-primary/10 text-primary mb-6 ring-[12px] ring-primary/5 animate-pulse-slow">
                  <span className="material-symbols-outlined text-5xl font-black">
                    check_circle
                  </span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                  Verification Successful
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8 font-medium">
                  Your email has been verified and your account is now fully
                  active. Welcome to the Hardware OS trading marketplace!
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 mb-8 text-left flex items-start gap-4 border border-slate-100 dark:border-slate-800 transition-all hover:border-primary/20">
                <span className="material-symbols-outlined text-primary mt-0.5 font-bold">
                  info
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-1">
                    What's next?
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Complete your company profile to start listing hardware for
                    trade in Lagos.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() =>
                    router.push(
                      role === UserRole.MERCHANT
                        ? "/merchant/dashboard"
                        : "/buyer/dashboard",
                    )
                  }
                  className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 px-6 rounded-lg transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <span className="material-symbols-outlined font-bold">
                    dashboard
                  </span>
                </button>
                <button
                  onClick={() =>
                    router.push(
                      role === UserRole.MERCHANT
                        ? "/merchant/profile"
                        : "/buyer/profile",
                    )
                  }
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
          <p className="mt-6 text-[10px] text-slate-400 text-center uppercase tracking-[0.2em] font-black">
            Success State
          </p>
        </div>
      )}
    </div>
  );
}
