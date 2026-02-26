"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  baseRegistrationSchema,
  type RegistrationFormData,
} from "@/lib/validations/auth";
import { UserRole } from "@hardware-os/shared";
import type { RegisterDto } from "@hardware-os/shared";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { authApi } from "@/lib/api/auth.api";

import { RoleSelectionStep } from "@/components/auth/register-flow/role-selection-step";
import { AccountDetailsStep } from "@/components/auth/register-flow/account-details-step";
import { OtpVerificationStep } from "@/components/auth/register-flow/otp-verification-step";
import { RegistrationSuccessStep } from "@/components/auth/register-flow/registration-success-step";

type Step = 1 | 2 | 3 | 4;

const slides = [
  '/images/hero/slide-2.jpg',
  '/images/hero/slide-3.jpg',
  '/images/hero/slide-4.jpg',
  '/images/hero/slide-5.jpg',
  '/images/hero/slide-1.jpg',
];

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const methods = useForm<RegistrationFormData>({
    resolver: zodResolver(baseRegistrationSchema),
    defaultValues: {
      fullName: "",
      businessName: "",
      email: "",
      phone: "",
      password: "",
    },
    mode: "onChange",
  });

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  const router = useRouter();
  const { register: authRegister } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    methods.setValue("role", selectedRole);
  };

  const handleContinueToDetails = () => {
    if (role) setStep(2);
  };

  const onSubmit = async (data: RegistrationFormData) => {
    if (isLoading) return;
    setIsLoading(true);
    setFormError(null);

    // Collect first + middle + last name from DOM inputs and build fullName
    const firstEl = document.getElementById("firstName") as HTMLInputElement | null;
    const middleEl = document.getElementById("middleName") as HTMLInputElement | null;
    const lastEl = document.getElementById("lastName") as HTMLInputElement | null;
    const firstName = firstEl?.value?.trim() || "";
    const middleName = middleEl?.value?.trim() || "";
    const lastName = lastEl?.value?.trim() || "";
    const composedFullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

    try {
      await authRegister({
        email: data.email,
        phone: data.phone,
        fullName: composedFullName || data.fullName,
        password: data.password,
        businessName: data.businessName,
        role: data.role,
      } as RegisterDto);

      setStep(3);
      toast.success("Registration successful! Check your inbox.");
    } catch (err: any) {
      console.error("Registration error:", err);
      const errorMessage =
        typeof err === "string"
          ? err
          : err.error || err.message || "Registration failed. Please try again.";
      setFormError(errorMessage);
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
    setOtpError(null);
    try {
      await authApi.verifyEmail({
        email: methods.getValues("email"),
        code: otp.join(""),
      });
      setStep(4);
      toast.success("Email verified successfully!");

      const dashboardPath =
        role === UserRole.MERCHANT ? "/merchant/onboarding" : "/buyer/dashboard";
      setTimeout(() => { router.push(dashboardPath); }, 2000);
    } catch (err: any) {
      const msg = err.error || err.message || "Invalid verification code. Please try again.";
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setOtpError(null);
    try {
      await authApi.resendVerification({ email: methods.getValues("email") });
      toast.success("A new verification code has been sent.");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      toast.error(err.error || "Could not resend code. Please try again later.");
    }
  };

  return (
    <div className="flex min-h-screen w-full font-display">

      {/* ─── LEFT: Image Slideshow Panel ─── */}
      <div className="hidden lg:block lg:w-[50%] relative sticky top-0 h-screen overflow-hidden">
        {slides.map((src, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <img src={src} alt="Hardware materials" className="w-full h-full object-cover" />
          </div>
        ))}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#101622] via-[#101622]/50 to-transparent" />

        <div className="absolute bottom-10 left-10 right-10 z-30 text-white">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary text-3xl">settings_input_component</span>
            <span className="text-2xl font-black tracking-tight uppercase">Hardware OS</span>
          </Link>
          <p className="text-white/70 text-base font-medium max-w-xs leading-relaxed mb-6">
            Join Nigeria&apos;s trusted B2B hardware trade network. Verified merchants, private pricing, escrow protection.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: 'lock', label: 'Escrow Protection' },
              { icon: 'verified', label: 'Verified Merchants' },
              { icon: 'visibility_off', label: 'Private Pricing' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm font-semibold text-white/80">
                <span className="material-symbols-outlined text-primary text-base">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-8">
            {slides.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-500 bg-white ${i === currentSlide ? 'w-6 opacity-100' : 'w-2 opacity-30'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Registration Form ─── */}
      <div className="w-full lg:w-[50%] bg-white flex flex-col h-screen overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-6 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">settings_input_component</span>
            <span className="text-lg font-black tracking-tight text-slate-900 uppercase">Hardware OS</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 py-10 md:px-12 lg:px-14 xl:px-16">
          <FormProvider {...methods}>
            {step === 1 && (
              <RoleSelectionStep
                role={role}
                onRoleSelect={handleRoleSelect}
                onContinue={handleContinueToDetails}
              />
            )}

            {step === 2 && (
              <AccountDetailsStep
                onSubmit={methods.handleSubmit(onSubmit)}
                isLoading={isLoading}
                formError={formError}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <OtpVerificationStep
                email={methods.getValues("email")}
                otp={otp}
                otpRefs={otpRefs}
                onOtpChange={handleOtpChange}
                onOtpKeyDown={handleOtpKeyDown}
                onVerify={handleVerifyOtp}
                isLoading={isLoading}
                resendCooldown={resendCooldown}
                onResend={handleResendCode}
                onBack={() => setStep(2)}
                error={otpError}
              />
            )}

            {step === 4 && <RegistrationSuccessStep role={role} />}
          </FormProvider>
        </div>

        <footer className="px-8 py-6 border-t border-slate-100">
          <p className="text-center text-xs text-slate-400">© 2025 Hardware OS. Lagos, Nigeria.</p>
        </footer>
      </div>
    </div>
  );
}
