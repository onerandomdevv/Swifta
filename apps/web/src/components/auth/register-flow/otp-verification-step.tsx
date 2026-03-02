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
    <div className="max-w-md w-full mx-auto animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.1em]">Step 3 of 3</span>
          <span className="text-[10px] font-medium text-slate-400">Security Verification</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary w-full rounded-full transition-all duration-1000 ease-out"></div>
        </div>
      </div>

      <div className="mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 ring-4 ring-primary/5">
          <span className="material-symbols-outlined text-primary text-3xl font-bold">verified_user</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-3">Check your inbox</h1>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
          We've sent a 6-digit verification code to <span className="text-slate-900 dark:text-slate-100 font-bold">{email}</span>. Enter it below to secure your business account.
        </p>
      </div>

      <form onSubmit={onVerify} className="space-y-8">
        <div className="flex justify-between gap-2 max-w-sm">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                otpRefs.current[index] = el;
              }}
              className="w-12 h-16 text-center text-2xl font-black bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 dark:text-white outline-none shadow-sm"
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
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg flex items-start gap-3 animate-in fade-in duration-300">
            <span className="material-symbols-outlined text-red-500 mt-0.5">error</span>
            <p className="text-sm font-medium text-red-700 dark:text-red-400 leading-snug">{error}</p>
          </div>
        )}

        <button
          disabled={isLoading || otp.some(d => !d)}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
          type="submit"
        >
          <span>{isLoading ? "Verifying..." : "Verify Code"}</span>
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">verified</span>
        </button>
      </form>

      <div className="mt-8 text-center space-y-6">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-2">Didn't receive the code?</p>
          <button
            onClick={onResend}
            disabled={resendCooldown > 0}
            className={`text-primary font-bold text-sm hover:underline flex items-center justify-center gap-1 mx-auto transition-all ${resendCooldown > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            <span>{resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}</span>
          </button>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-bold mx-auto"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Details
          </button>
        </div>
      </div>
    </div>
  );
}
