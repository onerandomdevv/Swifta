import { useState } from "react";
import { useFormContext } from "react-hook-form";
import Link from "next/link";
import type { RegistrationFormData } from "@/lib/validations/auth";
import { UserRole } from "@swifta/shared";

interface AccountDetailsStepProps {
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  formError: string | null;
  onBack: () => void;
}

export function AccountDetailsStep({
  onSubmit,
  isLoading,
  formError,
  onBack,
}: AccountDetailsStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RegistrationFormData>();

  const role = watch("role");
  const buyerType = watch("buyerType");
  const isMerchant = role === UserRole.MERCHANT;
  const isSupplier = role === UserRole.SUPPLIER;
  const isBuyer = role === UserRole.BUYER;

  return (
    <div className="max-w-md w-full mx-auto animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.1em]">
            Step 2 of 3
          </span>
          <span className="text-[10px] font-medium text-foreground-secondary">
            Account Details
          </span>
        </div>
        <div className="h-1.5 w-full bg-surface border border-border rounded-full overflow-hidden">
          <div className="h-full bg-primary w-2/3 rounded-full transition-all duration-1000 ease-out" />
        </div>
      </div>

      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-2">
          {isMerchant
            ? "Set Up Your Store"
            : isSupplier
              ? "Merchant Partner Registration"
              : "Create Your Account"}
        </h1>
        <p className="text-sm sm:text-base text-foreground-secondary font-medium">
          {isMerchant
            ? "Register your business to start selling on Lagos's premier wholesale and retail marketplace."
            : isSupplier
              ? "Register as a manufacturer or large distributor to reach verified merchants."
              : "Sign up to source quality products and goods from verified merchants across Lagos."}
        </p>
      </div>

      {formError && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <span className="material-symbols-outlined text-red-500 mt-0.5 text-xl">
            error
          </span>
          <p className="text-sm font-medium text-red-700 leading-snug">
            {formError}
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Name row: First + Middle + Last */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-sm font-bold text-foreground mb-1.5">
              First Name
            </label>
            <input
              className={`w-full px-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground text-sm ${errors.firstName ? "border-red-400" : "border-border"}`}
              placeholder="John"
              type="text"
              {...register("firstName")}
            />
            {errors.firstName && (
              <p className="text-xs font-semibold text-red-500 mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-bold text-foreground mb-1.5">
              Middle Name
            </label>
            <input
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground text-sm"
              placeholder="Emeka (opt.)"
              type="text"
              {...register("middleName")}
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-bold text-foreground mb-1.5">
              Last Name
            </label>
            <input
              className={`w-full px-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground text-sm ${errors.lastName ? "border-red-400" : "border-border"}`}
              placeholder="Adeyemi"
              type="text"
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="text-xs font-semibold text-red-500 mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Business Name — Merchant only */}
        {isMerchant && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                Business Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary text-xl">
                  storefront
                </span>
                <input
                  className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground text-sm ${errors.businessName ? "border-red-400" : "border-border"}`}
                  placeholder="Zaza Fashion Hub"
                  type="text"
                  {...register("businessName")}
                />
              </div>
              {errors.businessName && (
                <p className="text-xs font-semibold text-red-500 mt-1">
                  {errors.businessName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                Business Username
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary text-xl">
                  alternate_email
                </span>
                <input
                  className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground text-sm ${errors.slug ? "border-red-400" : "border-border"}`}
                  placeholder="e.g. zaza-fashion"
                  type="text"
                  {...register("slug", {
                    onChange: (e) => {
                      setValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    }
                  })}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between px-1">
                <p className="text-[10px] text-foreground-secondary font-medium italic">
                  Handle: @{watch("slug") || "your-handle"}
                </p>
                <p className="text-[10px] text-foreground-secondary font-medium">
                  3-30 chars, lowercase & hyphens
                </p>
              </div>
              {errors.slug && (
                <p className="text-xs font-semibold text-red-500 mt-1">
                  {errors.slug.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Supplier Specific Fields */}
        {isSupplier && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                Company Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary text-xl">
                  factory
                </span>
                <input
                  className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground text-sm ${errors.companyName ? "border-red-400" : "border-border"}`}
                  placeholder="Global Electronics Ltd"
                  type="text"
                  {...register("companyName")}
                />
              </div>
              {errors.companyName && (
                <p className="text-xs font-semibold text-red-500 mt-1">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                Company Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary text-xl">
                  location_on
                </span>
                <input
                  className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground text-sm ${errors.companyAddress ? "border-red-400" : "border-border"}`}
                  placeholder="12 Business Way, Ikeja, Lagos"
                  type="text"
                  {...register("companyAddress")}
                />
              </div>
              {errors.companyAddress && (
                <p className="text-xs font-semibold text-red-500 mt-1">
                  {errors.companyAddress.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                CAC Number (Optional)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary text-xl">
                  badge
                </span>
                <input
                  className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground text-sm ${errors.cacNumber ? "border-red-400" : "border-border"}`}
                  placeholder="RC123456"
                  type="text"
                  {...register("cacNumber")}
                />
              </div>
              {errors.cacNumber && (
                <p className="text-xs font-semibold text-red-500 mt-1">
                  {errors.cacNumber.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Phone */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-1.5">
            Phone Number
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary text-xl">
              call
            </span>
            <input
              className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground text-sm ${errors.phone ? "border-red-400" : "border-border"}`}
              placeholder="+234 800 000 0000"
              type="tel"
              {...register("phone", {
                onChange: (e) => {
                  setValue("phone", e.target.value.replace(/\D/g, ""));
                }
              })}
            />
          </div>
          {errors.phone && (
            <p className="text-xs font-semibold text-red-500 mt-1">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary text-xl">
              mail
            </span>
            <input
              className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground text-sm ${errors.email ? "border-red-400" : "border-border"}`}
              placeholder="john@example.com"
              type="email"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs font-semibold text-red-500 mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <PasswordField errors={errors} register={register} />

        <button
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-2"
          type="submit"
        >
          <span>
            {isLoading
              ? "Creating Account..."
              : isMerchant
                ? "Register My Store"
                : isSupplier
                  ? "Register as Partner"
                  : "Create Account"}
          </span>
          {!isLoading && (
            <span className="material-symbols-outlined text-lg">
              arrow_forward
            </span>
          )}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-foreground-secondary hover:text-primary text-sm font-semibold transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Back to Role Selection
        </button>
        <p className="text-center text-sm text-foreground-secondary font-medium">
          Already have an account?{" "}
          <Link
            className="text-primary font-bold hover:underline"
            href="/login"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

function PasswordField({ errors, register }: { errors: any; register: any }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-bold text-foreground mb-1.5">
        Password
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary text-xl">
          lock
        </span>
        <input
          className={`w-full pl-10 pr-12 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground text-sm ${errors.password ? "border-red-400" : "border-border"}`}
          placeholder="••••••••"
          type={show ? "text" : "password"}
          {...register("password")}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary hover:text-foreground-secondary transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
        >
          <span className="material-symbols-outlined text-xl">
            {show ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
      {errors.password && (
        <p className="text-xs font-semibold text-red-500 mt-1">
          {errors.password.message}
        </p>
      )}
    </div>
  );
}
