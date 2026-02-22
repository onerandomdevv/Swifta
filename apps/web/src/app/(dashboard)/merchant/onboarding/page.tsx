"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile, updateProfile } from "@/lib/api/merchant.api";

// Extracted Components
import { OnboardingFormData } from "@/components/merchant/onboarding/types";
import { BusinessProfileStep } from "@/components/merchant/onboarding/business-profile-step";
import { KycStep } from "@/components/merchant/onboarding/kyc-step";
import { WarehouseStep } from "@/components/merchant/onboarding/warehouse-step";
import { BankDetailsStep } from "@/components/merchant/onboarding/bank-details-step";
import { ReviewStep } from "@/components/merchant/onboarding/review-step";

export default function MerchantOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OnboardingFormData>({
    businessName: "",
    businessType: "Wholesale Distributor",
    estYear: "",
    category: "Power Tools",
    cacNumber: "",
    taxId: "",
    cacDocumentUrl: "",
    businessAddress: "",
    warehouseLocation: "",
    warehouseCapacity: "Medium (500 - 2000 sqm)",
    distributionCenter: "Lagos Island",
    bankCode: "",
    bankAccountNo: "",
    bankAccountName: "",
  });

  const steps = [
    { id: 1, label: "Business Profile", icon: "store" },
    { id: 2, label: "Identity & KYC", icon: "badge" },
    { id: 3, label: "Warehouse Setup", icon: "inventory_2" },
    { id: 4, label: "Bank Details", icon: "account_balance" },
    { id: 5, label: "Review & Finish", icon: "verified" },
  ];

  // Helper for components to easily update state
  const updateForm = (updates: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Load existing merchant profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await getProfile();
        const profile = response;
        if (profile) {
          setFormData((prev) => ({
            ...prev,
            businessName: profile.businessName || prev.businessName,
            businessType: profile.businessType || prev.businessType,
            estYear: profile.estYear || prev.estYear,
            category: profile.category || prev.category,
            cacNumber: profile.cacNumber || prev.cacNumber,
            taxId: profile.taxId || prev.taxId,
            cacDocumentUrl: profile.cacDocumentUrl || prev.cacDocumentUrl,
            businessAddress: profile.businessAddress || prev.businessAddress,
            warehouseLocation:
              profile.warehouseLocation || prev.warehouseLocation,
            warehouseCapacity:
              profile.warehouseCapacity || prev.warehouseCapacity,
            distributionCenter:
              profile.distributionCenter || prev.distributionCenter,
            bankCode: profile.bankCode || prev.bankCode,
            bankAccountNo: profile.bankAccountNo || prev.bankAccountNo,
            bankAccountName: profile.bankAccountName || prev.bankAccountName,
          }));
          // Resume from saved onboarding step
          if (profile.onboardingStep > 1) {
            setStep(profile.onboardingStep);
          }
        }
      } catch {
        // Fresh profile — start from step 1
      } finally {
        setInitialLoading(false);
      }
    }
    loadProfile();
  }, []);

  const getStepPayload = () => {
    switch (step) {
      case 1:
        return {
          businessName: formData.businessName,
          businessType: formData.businessType,
          estYear: formData.estYear,
          category: formData.category,
        };
      case 2:
        return {
          cacNumber: formData.cacNumber,
          taxId: formData.taxId,
          cacDocumentUrl: formData.cacDocumentUrl,
        };
      case 3:
        return {
          businessAddress: formData.businessAddress,
          warehouseLocation: formData.warehouseLocation,
          distributionCenter: formData.distributionCenter,
          warehouseCapacity: formData.warehouseCapacity,
        };
      case 4:
        return {
          bankCode: formData.bankCode,
          bankAccountNo: formData.bankAccountNo,
          bankAccountName: formData.bankAccountName,
        };
      default:
        return {};
    }
  };

  const handleContinue = async () => {
    setError(null);
    setLoading(true);

    try {
      if (step < 5) {
        // Save current step's data via PATCH /merchants/me
        await updateProfile(getStepPayload());
        setStep((s) => s + 1);
      } else {
        // Final step — all data already saved, redirect to dashboard
        router.push("/merchant/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="space-y-6 w-full max-w-md">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-10">
      {/* Branding Header */}
      <div className="mb-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="size-10 bg-navy-dark rounded-xl flex items-center justify-center text-white shadow-xl shadow-navy-dark/20 text-xl font-black">
            H
          </div>
          <span className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-[0.3em]">
            Hardware OS
          </span>
        </div>
        <h2 className="text-3xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
          Merchant Onboarding
        </h2>
      </div>

      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-navy-dark/10 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Left Sidebar Stepper */}
        <aside className="w-full md:w-80 bg-navy-dark p-12 text-white space-y-12">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
              Progress
            </p>
            <h3 className="text-xl font-black uppercase tracking-tight">
              Onboarding <br /> Milestone
            </h3>
          </div>

          <div className="space-y-8 relative">
            <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-white/10"></div>
            {steps.map((s) => (
              <div
                key={s.id}
                className="relative z-10 flex items-center gap-4 group cursor-default"
              >
                <div
                  className={`size-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${step === s.id ? "bg-white text-navy-dark border-white scale-110 shadow-xl shadow-white/20" : step > s.id ? "bg-emerald-500 border-emerald-500 text-white" : "bg-navy-dark border-white/20 text-white/40"}`}
                >
                  <span className="material-symbols-outlined text-xl font-black">
                    {step > s.id ? "check" : s.icon}
                  </span>
                </div>
                <div>
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest leading-none ${step >= s.id ? "text-white" : "text-white/30"}`}
                  >
                    {s.label}
                  </p>
                  {step === s.id && (
                    <p className="text-[9px] font-bold text-white/60 uppercase mt-1">
                      In Progress
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-12 border-t border-white/10 space-y-4">
            <p className="text-[10px] font-bold text-white/40 uppercase leading-relaxed font-italic italic">
              "Verified merchants experience 3x faster trade completions."
            </p>
          </div>
        </aside>

        {/* Right Content Form */}
        <main className="flex-1 p-12 lg:p-16 space-y-10 flex flex-col">
          {loading ? (
            <div className="space-y-10 flex-1 flex flex-col animate-in fade-in duration-300">
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-8 flex-1">
                <Skeleton className="h-56 w-full rounded-3xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-10">
              {error && (
                <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex gap-4 animate-in fade-in duration-300">
                  <span className="material-symbols-outlined text-red-500">
                    error
                  </span>
                  <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
                    {error}
                  </p>
                </div>
              )}

              {step === 1 && (
                <BusinessProfileStep
                  formData={formData}
                  updateForm={updateForm}
                />
              )}
              {step === 2 && (
                <KycStep formData={formData} updateForm={updateForm} />
              )}
              {step === 3 && (
                <WarehouseStep formData={formData} updateForm={updateForm} />
              )}
              {step === 4 && (
                <BankDetailsStep formData={formData} updateForm={updateForm} />
              )}
              {step === 5 && <ReviewStep formData={formData} />}
            </div>
          )}

          <div className="pt-10 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center mt-auto">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1 || loading}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${step === 1 ? "opacity-0" : "text-slate-400 hover:text-navy-dark active:scale-95 disabled:opacity-30"}`}
            >
              Previous Step
            </button>

            <button
              onClick={handleContinue}
              disabled={loading}
              className="px-10 py-5 bg-navy-dark text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-navy-dark/30 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
            >
              {step === 5 ? "Complete Registration" : "Continue Step"}
            </button>
          </div>
        </main>
      </div>

      <div className="mt-12 flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-300 text-lg">
            lock
          </span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Secured 256-bit Encryption
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-300 text-lg">
            verified_user
          </span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Identity Verified by KYC Lagos
          </span>
        </div>
      </div>
    </div>
  );
}
