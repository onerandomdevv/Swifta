"use client";

import { useState, type FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "../../../lib/api/auth.api";
import { useToast } from "../../../providers/toast-provider";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { PasswordInput } from "../../../components/ui/password-input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const toast = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Cannot reset password without a valid token.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      toast.success("Password successfully reset! Please sign in.");
      router.push("/login");
    } catch (err: any) {
      setError(
        err?.message || "Failed to reset password. The link may have expired.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-xl p-8 md:p-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-4 text-green-600 dark:text-green-400 flex items-center justify-center size-14 rounded-full bg-green-50 dark:bg-green-500/10 ring-4 ring-green-50 dark:ring-green-500/5">
            <span className="material-symbols-outlined text-3xl font-bold">
              password
            </span>
          </div>
          <h1 className="text-2xl font-black text-navy-dark dark:text-white tracking-tight uppercase">
            Create New Password
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs font-bold uppercase tracking-widest leading-relaxed">
            Please enter a strong, secure password below
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl flex gap-3 animate-in shake">
            <span className="material-symbols-outlined text-red-500">
              error
            </span>
            <p className="text-[11px] font-black uppercase tracking-widest text-red-700 dark:text-red-400 leading-normal">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1"
              htmlFor="newPassword"
            >
              New Password
            </label>
            <div className="relative">
              <PasswordInput
                className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 h-14 rounded-2xl text-sm font-bold focus:border-navy-dark dark:focus:border-white transition-all shadow-none"
                id="newPassword"
                placeholder="Required 8+ characters"
                required
                disabled={!token}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 flex flex-col pt-3">
            <label
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10">
                check_circle
              </span>
              <Input
                className={`pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border-2 h-14 rounded-2xl text-sm font-bold focus:border-navy-dark dark:focus:border-white transition-all shadow-none ${newPassword && confirmPassword && newPassword === confirmPassword ? "border-green-400 focus:border-green-500" : "border-slate-100 dark:border-slate-700"}`}
                id="confirmPassword"
                type="password"
                placeholder="Type password again"
                required
                disabled={!token}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            disabled={isLoading || !token}
            className="w-full h-14 rounded-2xl bg-navy-dark dark:bg-white text-white dark:text-navy-dark text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/10 hover:scale-[1.02] active:scale-95 transition-all gap-2"
            type="submit"
          >
            {isLoading ? "Saving New Password..." : "Update Password"}
            {!isLoading && (
              <span className="material-symbols-outlined text-lg">save</span>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800/50 text-center">
          <Link
            href="/login"
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-navy-dark dark:hover:text-white transition-colors gap-2 inline-flex items-center"
          >
            Cancel and Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
