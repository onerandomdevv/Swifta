import Link from "next/link";
import { UserRole } from "@hardware-os/shared";
import { Button } from "@/components/ui/button";

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
          onClick={() => onRoleSelect(UserRole.BUYER)}
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
              Source hardware items across Lagos, request instant quotes, and
              secure payment via our escrow system.
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
          onClick={() => onRoleSelect(UserRole.MERCHANT)}
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
              List your inventory, reach thousands of construction firms, and
              automate your quotation process.
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
          onClick={onContinue}
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
            <span className="material-symbols-outlined text-base">help</span>
            Need Help?
          </a>
        </div>
      </div>
    </div>
  );
}
