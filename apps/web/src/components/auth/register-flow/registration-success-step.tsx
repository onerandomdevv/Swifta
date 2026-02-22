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
              Your email has been verified and your account is now fully active.
              Welcome to the Hardware OS trading marketplace!
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
                    ? "/merchant/onboarding"
                    : "/buyer/dashboard",
                )
              }
              className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 px-6 rounded-lg transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {role === UserRole.MERCHANT
                ? "Complete Profile"
                : "Go to Dashboard"}
              <span className="material-symbols-outlined font-bold">
                dashboard
              </span>
            </button>
          </div>
        </div>
      </div>
      <p className="mt-6 text-[10px] text-slate-400 text-center uppercase tracking-[0.2em] font-black">
        Success State
      </p>
    </div>
  );
}
