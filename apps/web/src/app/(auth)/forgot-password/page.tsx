"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authApi } from "../../../lib/api/auth.api";
import { useToast } from "../../../providers/toast-provider";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading || !email) return;

    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setIsSubmitted(true);
      toast.success("Recovery link sent!");
    } catch (err: any) {
      toast.error(
        err?.message || "Failed to process request. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-xl p-8 md:p-10 text-center">
          <div className="mx-auto mb-6 text-green-600 dark:text-green-400 flex items-center justify-center size-16 rounded-full bg-green-50 dark:bg-green-500/10 ring-8 ring-green-50 dark:ring-green-500/5">
            <span className="material-symbols-outlined text-4xl font-black">
              mark_email_read
            </span>
          </div>
          <h1 className="text-2xl font-black text-navy-dark dark:text-white tracking-tight uppercase mb-4">
            Check Your Email
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold leading-relaxed mb-8">
            If an account exists for{" "}
            <span className="text-navy-dark dark:text-white font-black">
              {email}
            </span>
            , we have sent a password reset link. Please check your inbox and
            spam folder.
          </p>
          <Link
            href="/login"
            className="w-full inline-flex justify-center items-center h-12 rounded-xl bg-slate-50 dark:bg-slate-800 text-navy-dark dark:text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg mr-2">
              arrow_back
            </span>
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-xl p-8 md:p-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-4 text-accent-orange dark:text-orange-400 flex items-center justify-center size-14 rounded-full bg-orange-50 dark:bg-orange-500/10 ring-4 ring-orange-50 dark:ring-orange-500/5">
            <span className="material-symbols-outlined text-3xl font-bold">
              lock_reset
            </span>
          </div>
          <h1 className="text-2xl font-black text-navy-dark dark:text-white tracking-tight uppercase">
            Reset Password
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs font-bold uppercase tracking-widest">
            Enter your email to receive a recovery link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1"
              htmlFor="email"
            >
              Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10">
                mail
              </span>
              <Input
                className="pl-12 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 h-14 rounded-2xl text-sm font-bold focus:border-navy-dark dark:focus:border-white transition-all shadow-none"
                id="email"
                type="email"
                placeholder="e.g. name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <Button
            disabled={isLoading || !email}
            className="w-full h-14 rounded-2xl bg-navy-dark dark:bg-white text-white dark:text-navy-dark text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/10 hover:scale-[1.02] active:scale-95 transition-all gap-2"
            type="submit"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
            {!isLoading && (
              <span className="material-symbols-outlined text-lg">send</span>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800/50 text-center">
          <Link
            href="/login"
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-navy-dark dark:hover:text-white transition-colors gap-2 inline-flex items-center"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
