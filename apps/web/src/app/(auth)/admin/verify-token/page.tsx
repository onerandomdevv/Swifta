"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../providers/auth-provider";
import { useToast } from "../../../../providers/toast-provider";
import { authApi } from "../../../../lib/api/auth.api";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

export default function VerifyTokenPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const toast = useToast();

  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: only OPERATOR and SUPPORT should be here
  if (!user || !["OPERATOR", "SUPPORT"].includes(user.role)) {
    if (typeof window !== "undefined") {
      router.push("/admin/login");
    }
    return null;
  }

  const roleLabel = user.role === "OPERATOR" ? "Operator" : "Support";
  const roleColor =
    user.role === "OPERATOR"
      ? "from-orange-500 to-amber-500"
      : "from-blue-500 to-cyan-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await authApi.verifyStaffToken(token);
      toast.success("Access verified. Welcome to your dashboard.");

      if (user.role === "OPERATOR") {
        router.push("/operator");
      } else {
        router.push("/support");
      }
    } catch (err: any) {
      const errorMessage =
        typeof err === "string"
          ? err
          : err.error || err.message || "Invalid access token.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-slate-900 shadow-xl border border-slate-700/50 rounded-xl p-8 md:p-10 relative overflow-hidden">
        {/* Accent bar */}
        <div
          className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${roleColor}`}
        ></div>

        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-4 text-slate-200 flex items-center justify-center size-14 rounded-full bg-slate-800 ring-4 ring-slate-800/50">
            <span className="material-symbols-outlined text-3xl font-bold">
              verified_user
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {roleLabel} Verification
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium leading-relaxed max-w-[300px]">
            Enter your {roleLabel.toLowerCase()} access token to continue.
            Contact your Super Admin if you don't have one.
          </p>
        </div>

        {/* User info badge */}
        <div className="mb-6 p-3 bg-slate-800 rounded-lg border border-slate-700 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-300">
              person
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {user.fullName || user.email}
            </p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {user.role}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm font-medium text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-2 animate-slide-in">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label
              className="text-sm font-bold text-slate-300 block"
              htmlFor="accessToken"
            >
              Access Token
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg z-10">
                key
              </span>
              <Input
                className={`pl-10 pr-10 bg-slate-800 text-white h-12 font-mono tracking-wider uppercase ${
                  token.length > 0 && !/^[A-Z0-9-]+$/.test(token.toUpperCase())
                    ? "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
                    : token.length >= 29
                      ? "border-green-500 ring-1 ring-green-500 focus-visible:ring-green-500"
                      : "border-slate-700 focus-visible:ring-slate-600"
                }`}
                id="accessToken"
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                value={token}
                onChange={(e) => {
                  const val = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9-]/g, "");
                  setToken(val);
                  setError(null);
                }}
                maxLength={29}
                autoFocus
              />
              {token.length > 0 && (
                <span
                  className={`absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-lg ${
                    token.length >= 29 && /^[A-Z0-9-]+$/.test(token)
                      ? "text-green-400"
                      : "text-slate-500"
                  }`}
                >
                  {token.length >= 29 && /^[A-Z0-9-]+$/.test(token)
                    ? "check_circle"
                    : "pending"}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Alphanumeric only (A-Z, 0-9)
              </p>
              <p
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  token.length >= 29 ? "text-green-400" : "text-slate-500"
                }`}
              >
                {token.length}/29
              </p>
            </div>
          </div>

          <Button
            disabled={isSubmitting || !token.trim()}
            className="w-full h-12 text-md font-bold shadow-md gap-2 bg-slate-100 text-slate-900 hover:bg-white"
            type="submit"
          >
            {isSubmitting ? "Verifying..." : "Verify & Continue"}
            {!isSubmitting && (
              <span className="material-symbols-outlined text-sm font-bold">
                arrow_forward
              </span>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            STEP 2 OF 2
          </p>
          <button
            onClick={() => {
              logout();
              router.push("/admin/login");
            }}
            className="text-xs text-slate-400 hover:text-white font-bold uppercase tracking-wider transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
