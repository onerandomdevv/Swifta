import { useRouter } from "next/navigation";
import { UserRole } from "@hardware-os/shared";

interface RegistrationSuccessStepProps {
  role: UserRole | null;
}

export function RegistrationSuccessStep({
  role,
}: RegistrationSuccessStepProps) {
  const router = useRouter();

  return (
    <div className="max-w-md w-full mx-auto animate-in zoom-in-95 duration-700">
      <div className="text-center">
        <div className="inline-flex items-center justify-center size-24 rounded-3xl bg-primary/10 text-primary mb-8 ring-8 ring-primary/5 animate-bounce-slow">
          <span className="material-symbols-outlined text-5xl font-black">verified</span>
        </div>

        <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-4">Verification Successful</h1>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-10">
          Your business account is now fully active. You've joined Nigeria's most trusted hardware procurement network.
        </p>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-10 text-left border border-slate-200/50 dark:border-slate-700/50 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 flex-shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-primary">rocket_launch</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Getting Started</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Complete your business profile next to start listing inventory or requesting quotes from vendors.
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            router.push(
              role === UserRole.MERCHANT
                ? "/merchant/onboarding"
                : "/buyer/dashboard",
            )
          }
          className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 px-8 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group"
        >
          <span>{role === UserRole.MERCHANT ? "Complete Onboarding" : "Go to Dashboard"}</span>
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
