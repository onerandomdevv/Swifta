import Link from "next/link";
import { UserRole } from "@hardware-os/shared";

interface RoleSelectionStepProps {
  role: UserRole | null;
  onRoleSelect: (role: UserRole) => void;
  onContinue: () => void;
}

export function RoleSelectionStep({
  role,
  onRoleSelect,
  onContinue,
}: RoleSelectionStepProps) {
  return (
    <div className="max-w-md w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-4">
        {/* Progress Indicator */}
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.1em]">
            Step 1 of 3
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            Role Selection
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary w-1/3 rounded-full transition-all duration-1000 ease-out"></div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Select Your Role
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Choose how you want to interact with the SwiftTrade marketplace.
        </p>
      </div>

      <div className="space-y-4">
        {/* Role Card: Merchant */}
        <label className="relative block cursor-pointer group">
          <input
            type="radio"
            name="role"
            value={UserRole.MERCHANT}
            checked={role === UserRole.MERCHANT}
            onChange={() => onRoleSelect(UserRole.MERCHANT)}
            className="peer sr-only"
          />
          <div className="p-6 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/50 transition-all hover:border-primary/50 peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary shadow-sm hover:shadow-md">
            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${role === UserRole.MERCHANT ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}
              >
                <span className="material-symbols-outlined text-2xl">
                  storefront
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    I am a Merchant
                  </p>
                  {role === UserRole.MERCHANT && (
                    <div className="text-primary animate-in zoom-in duration-300">
                      <span className="material-symbols-outlined text-xl">
                        check_circle
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sell products and manage your retail/wholesale inventory at
                  scale with our merchant tools.
                </p>
              </div>
            </div>
          </div>
        </label>

        {/* Role Card: Buyer */}
        <label className="relative block cursor-pointer group">
          <input
            type="radio"
            name="role"
            value={UserRole.BUYER}
            checked={role === UserRole.BUYER}
            onChange={() => onRoleSelect(UserRole.BUYER)}
            className="peer sr-only"
          />
          <div className="p-6 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/50 transition-all hover:border-primary/50 peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary shadow-sm hover:shadow-md">
            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${role === UserRole.BUYER ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-primary"}`}
              >
                <span className="material-symbols-outlined text-2xl">
                  shopping_cart
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    I am a Buyer
                  </p>
                  {role === UserRole.BUYER && (
                    <div className="text-primary animate-in zoom-in duration-300">
                      <span className="material-symbols-outlined text-xl">
                        check_circle
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Source quality products and goods for your personal or
                  business needs from verified suppliers.
                </p>
              </div>
            </div>
          </div>
        </label>

        {/* Role Card: Supplier */}
        <label className="relative block cursor-pointer group">
          <input
            type="radio"
            name="role"
            value={UserRole.SUPPLIER}
            checked={role === UserRole.SUPPLIER}
            onChange={() => onRoleSelect(UserRole.SUPPLIER)}
            className="peer sr-only"
          />
          <div className="p-6 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/50 transition-all hover:border-primary/50 peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary shadow-sm hover:shadow-md">
            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${role === UserRole.SUPPLIER ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-primary"}`}
              >
                <span className="material-symbols-outlined text-2xl">
                  factory
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    I am a Supplier
                  </p>
                  {role === UserRole.SUPPLIER && (
                    <div className="text-primary animate-in zoom-in duration-300">
                      <span className="material-symbols-outlined text-xl">
                        check_circle
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Manufacturer or large-scale distributor looking to sell
                  wholesale stock to merchants.
                </p>
              </div>
            </div>
          </div>
        </label>
      </div>

      <div className="pt-6 space-y-4">
        <button
          onClick={onContinue}
          disabled={!role}
          className="w-full py-4 px-6 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
        >
          <span>Continue</span>
          <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
        <div className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Already have an account?
            <Link
              className="text-primary font-bold hover:underline ml-1"
              href="/login"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
