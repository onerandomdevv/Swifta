import { Button } from "@/components/ui/button";

interface OtpVerificationStepProps {
  email: string;
  otp: string[];
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onOtpChange: (index: number, value: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onVerify: (e: React.FormEvent) => void;
  isLoading: boolean;
  resendCooldown: number;
  onResend: () => void;
  onBack: () => void;
  error?: string | null;
}

export function OtpVerificationStep({
  email,
  otp,
  otpRefs,
  onOtpChange,
  onOtpKeyDown,
  onVerify,
  isLoading,
  resendCooldown,
  onResend,
  onBack,
  error,
}: OtpVerificationStepProps) {
  return (
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
              {email || "john.doe@lagostrade.com"}
            </span>
            . Enter it below to secure your account.
          </p>
        </div>
        <form onSubmit={onVerify} className="space-y-8">
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
                onChange={(e) => onOtpChange(index, e.target.value)}
                onKeyDown={(e) => onOtpKeyDown(index, e)}
              />
            ))}
          </div>
          {error && (
            <div className="text-red-500 text-sm font-medium text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}
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
            onClick={onResend}
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
            onClick={onBack}
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
  );
}
