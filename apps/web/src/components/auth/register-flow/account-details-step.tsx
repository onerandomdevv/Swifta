import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

interface AccountDetailsStepProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  formError: string | null;
  onBack: () => void;
}

export function AccountDetailsStep({
  formData,
  setFormData,
  onSubmit,
  isLoading,
  formError,
  onBack,
}: AccountDetailsStepProps) {
  return (
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

        {formError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="material-symbols-outlined text-red-500 mt-0.5">
              error
            </span>
            <p className="text-sm font-medium text-red-700 dark:text-red-400 leading-snug">
              {formError}
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
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
            <PasswordInput
              className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              id="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
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
            onClick={onBack}
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
    </div>
  );
}
