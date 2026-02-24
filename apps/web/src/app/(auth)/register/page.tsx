"use client";

import { useState, useRef, useEffect } from "react";
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

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<UserRole | null>(null);

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
    methods.setValue("role", selectedRole);
  };

  const handleContinueToDetails = () => {
    if (role) setStep(2);
  };

  const onSubmit = async (data: RegistrationFormData) => {
    if (isLoading) return;

    setIsLoading(true);
    setFormError(null);
    try {
      await authRegister({
        email: data.email,
        phone: data.phone,
        fullName: data.fullName,
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
          : err.error ||
            err.message ||
            "Registration failed. Please try again.";
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
        role === UserRole.MERCHANT
          ? "/merchant/onboarding"
          : "/buyer/dashboard";
      setTimeout(() => {
        router.push(dashboardPath);
      }, 2000);
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
      toast.error(
        err.error || "Could not resend code. Please try again later.",
      );
    }
  };

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center py-10">
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
  );
}
