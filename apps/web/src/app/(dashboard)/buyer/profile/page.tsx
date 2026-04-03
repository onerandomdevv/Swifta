"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/providers/auth-provider";
import { authApi } from "@/lib/api/auth.api";
import { useToast } from "@/providers/toast-provider";

export default function BuyerProfilePage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  // ─── Personal Info State ───
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ─── Password Change State ───
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // ─── WhatsApp Link State ───
  const [whatsappStep, setWhatsappStep] = useState<"idle" | "phone" | "otp">("idle");
  const [waPhone, setWaPhone] = useState("");
  const [waOtp, setWaOtp] = useState(["", "", "", "", "", ""]);
  const waOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isLinkingWhatsApp, setIsLinkingWhatsApp] = useState(false);

  // ─── Email Verification ───
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setMiddleName(user.middleName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    if (emailResendCooldown <= 0) return;
    const timer = setInterval(() => setEmailResendCooldown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [emailResendCooldown]);

  // ─── Handlers ───

  async function handleSaveProfile() {
    if (isSavingProfile) return;
    setIsSavingProfile(true);
    try {
      await authApi.updateProfile({ firstName, middleName, lastName, phone });
      await refreshUser();
      toast.success("Profile updated successfully.");
    } catch (err: any) {
      toast.error(err?.message || err?.error || "Failed to save changes.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setIsChangingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || err?.error || "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleResendVerification() {
    if (!user?.email || isResendingEmail || emailResendCooldown > 0) return;
    setIsResendingEmail(true);
    try {
      await authApi.resendVerification({ email: user.email });
      toast.success("Verification email sent! Check your inbox.");
      setEmailResendCooldown(60);
    } catch (err: any) {
      toast.error(err?.message || err?.error || "Could not resend verification email.");
    } finally {
      setIsResendingEmail(false);
    }
  }

  async function handleInitiateWhatsAppLink() {
    if (!waPhone) {
      toast.error("Please enter your WhatsApp number.");
      return;
    }
    setIsLinkingWhatsApp(true);
    try {
      await authApi.initiateWhatsAppLink(waPhone);
      setWhatsappStep("otp");
      setWaOtp(["", "", "", "", "", ""]);
      toast.success("OTP sent to your WhatsApp!");
      setTimeout(() => waOtpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast.error(err?.message || err?.error || "Failed to send OTP.");
    } finally {
      setIsLinkingWhatsApp(false);
    }
  }

  function handleWaOtpChange(index: number, value: string) {
    // Take only the last character entered to allow replacing existing digit
    const char = value.length > 1 ? value.slice(-1) : value;
    if (!/^[0-9]*$/.test(char)) return;

    const newOtp = [...waOtp];
    newOtp[index] = char;
    setWaOtp(newOtp);

    // Auto-focus next input if a value was entered
    if (char && index < 5) {
      waOtpRefs.current[index + 1]?.focus();
    }
  }

  function handleWaOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace") {
      if (!waOtp[index] && index > 0) {
        // If current is empty, move back and clear previous
        const newOtp = [...waOtp];
        newOtp[index - 1] = "";
        setWaOtp(newOtp);
        waOtpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      waOtpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      waOtpRefs.current[index + 1]?.focus();
    }
  }

  async function handleVerifyWhatsAppLink() {
    const code = waOtp.join("");
    if (code.length !== 6) return;
    setIsLinkingWhatsApp(true);
    try {
      await authApi.verifyWhatsAppLink(waPhone, code);
      await refreshUser();
      toast.success("WhatsApp linked successfully!");
      setWhatsappStep("idle");
    } catch (err: any) {
      toast.error(err?.message || err?.error || "Invalid OTP.");
    } finally {
      setIsLinkingWhatsApp(false);
    }
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="flex-1 flex flex-col font-display min-h-screen bg-slate-50/30">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 md:px-10 py-10">
        <div className="max-w-4xl mx-auto w-full">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Account Settings
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-2">
            Manage your personal profile, security settings, and linked accounts
          </p>
        </div>
      </header>

      <main className="px-6 md:px-10 py-12 space-y-10 max-w-4xl w-full mx-auto">

        {/* ═══════════════════════════════════════════════════
            SECTION 1: Personal Information
        ═══════════════════════════════════════════════════ */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl font-variation-light">person</span>
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900">
              Personal Information
            </h2>
          </div>

          <div className="p-8 space-y-8">
            {/* Name grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full h-11 px-4 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="middleName" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Middle Name
                </label>
                <input
                  id="middleName"
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Optional"
                  className="w-full h-11 px-4 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Adeyemi"
                  className="w-full h-11 px-4 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 border border-r-0 border-slate-200 bg-slate-100/50 text-slate-500 text-xs font-bold rounded-l-lg">
                    +234
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="803 123 4567"
                    className="w-full h-11 px-4 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-r-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  className="w-full h-11 px-4 text-sm font-semibold bg-slate-100/70 text-slate-400 border border-slate-200 rounded-lg cursor-not-allowed"
                />
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Email protected & non-editable</p>
              </div>
            </div>

            {/* Save button */}
            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="bg-primary hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold px-10 py-3 rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-2 active:scale-95"
              >
                {isSavingProfile ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                    Updating Profile...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    Save Profile Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 2: Account Status
        ═══════════════════════════════════════════════════ */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl font-variation-light">verified_user</span>
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900">
              Account Security Status
            </h2>
          </div>

          <div className="p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Email Verification */}
            <div className={`p-5 rounded-xl border ${user?.emailVerified ? "border-emerald-100 bg-emerald-50/30" : "border-amber-100 bg-amber-50/30"}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`material-symbols-outlined text-xl ${user?.emailVerified ? "text-emerald-500" : "text-amber-500"}`}>
                  {user?.emailVerified ? "verified" : "warning"}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Email Status
                </span>
              </div>
              {user?.emailVerified ? (
                <p className="text-sm font-bold text-emerald-700">Fully Verified</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-amber-700">Verification Pending</p>
                  <button
                    onClick={handleResendVerification}
                    disabled={isResendingEmail || emailResendCooldown > 0}
                    className="text-[10px] font-bold text-amber-600 hover:text-amber-800 disabled:opacity-50 uppercase tracking-widest transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">mail</span>
                    {emailResendCooldown > 0 ? `Retry in ${emailResendCooldown}s` : "Resend Link"}
                  </button>
                </div>
              )}
            </div>

            {/* WhatsApp Link */}
            <div className={`p-5 rounded-xl border ${user?.isWhatsAppLinked ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100 bg-slate-50/30"}`}>
              <div className="flex items-center gap-2 mb-3">
                <svg className={`w-5 h-5 ${user?.isWhatsAppLinked ? "text-emerald-500" : "text-slate-400"}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.996-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Secure Trade
                </span>
              </div>
              {user?.isWhatsAppLinked ? (
                <p className="text-sm font-bold text-emerald-700">WhatsApp Linked</p>
              ) : (
                <button
                  onClick={() => setWhatsappStep("phone")}
                  className="text-[10px] font-bold text-primary hover:text-emerald-700 uppercase tracking-widest transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">link</span>
                  Connect Now
                </button>
              )}
            </div>

            {/* Member Since */}
            <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-xl text-slate-400 font-variation-light">history</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Tenure
                </span>
              </div>
              <p className="text-sm font-bold text-slate-700">{memberSince}</p>
            </div>
          </div>
        </section>

        {/* ─── WhatsApp Link Flow (inline expansion) ─── */}
        {whatsappStep !== "idle" && !user?.isWhatsAppLinked && (
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="px-6 py-5 border-b border-emerald-50 bg-emerald-50/30 flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-500 text-xl font-variation-fill">chat</span>
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">Link Secure Messenger</h2>
            </div>

            <div className="p-8">
              {whatsappStep === "phone" && (
                <div className="max-w-md space-y-6">
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    Verify your WhatsApp number to receive real-time order updates and secure trade notifications directly.
                  </p>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number (WhatsApp)</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 border border-r-0 border-slate-200 bg-slate-100/50 text-slate-500 text-xs font-bold rounded-l-lg">
                        +234
                      </span>
                      <input
                        type="tel"
                        value={waPhone}
                        onChange={(e) => setWaPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="0810 000 0000"
                        className="w-full h-11 px-4 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-r-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={handleInitiateWhatsAppLink}
                      disabled={isLinkingWhatsApp}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold px-8 py-3 rounded-xl transition-all flex items-center gap-2 active:scale-95"
                    >
                      {isLinkingWhatsApp ? "Processing..." : "Submit Number"}
                    </button>
                    <button
                      onClick={() => setWhatsappStep("idle")}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {whatsappStep === "otp" && (
                <div className="max-w-md space-y-6">
                  <p className="text-sm font-medium text-slate-500 mb-6">
                    Enter the 6-digit verification code sent to <span className="text-slate-900 font-bold">+{waPhone}</span>
                  </p>
                  <div className="flex gap-2 sm:gap-3 justify-center">
                    {waOtp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { waOtpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleWaOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleWaOtpKeyDown(i, e)}
                        className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border-2 transition-all outline-none ${digit ? "border-emerald-500 bg-emerald-50/20" : "border-slate-100 bg-slate-50 focus:border-emerald-300"}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-6 items-center pt-4">
                    <button
                      onClick={handleVerifyWhatsAppLink}
                      disabled={isLinkingWhatsApp || waOtp.join("").length !== 6}
                      className="flex-1 bg-primary hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95"
                    >
                      {isLinkingWhatsApp ? "Verifying..." : "Confirm & Connect"}
                    </button>
                    <button
                      onClick={() => setWhatsappStep("phone")}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                    >
                      Wrong number?
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 3: Change Password
        ═══════════════════════════════════════════════════ */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl font-variation-light">lock_reset</span>
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900">
              Security Settings
            </h2>
          </div>

          <form onSubmit={handleChangePassword} className="p-8 space-y-6 max-w-lg">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Verification: Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 px-4 pr-11 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showCurrentPw ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                New Security Credential
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="w-full h-11 px-4 pr-11 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showNewPw ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Re-enter New Credential
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                  className={`w-full h-11 px-4 pr-11 text-sm font-semibold bg-slate-50 border rounded-lg focus:ring-1 outline-none transition-all placeholder:text-slate-300 ${
                    confirmPassword && confirmPassword !== newPassword
                      ? "border-rose-200 focus:border-rose-500 focus:ring-rose-500/10"
                      : "border-slate-200 focus:border-primary focus:ring-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showConfirmPw ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1">Credentials do not match</p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold px-10 py-3.5 rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95"
              >
                {isChangingPassword ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                    Updating Key...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">key</span>
                    Update Security Key
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 4: Danger Zone
        ═══════════════════════════════════════════════════ */}
        <section className="bg-slate-50 rounded-xl border border-rose-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-rose-100 flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-500 text-xl font-variation-light">warning</span>
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-rose-700">
              Account Termination
            </h2>
          </div>

          <div className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="max-w-md">
              <p className="text-sm font-bold text-slate-900">Deactivate Local Terminal</p>
              <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">
                Permanently eliminate your buyer identity and trade history from the twizrr network. This operation is non-reversible.
              </p>
            </div>
            <button
              onClick={() => toast.error("Global deactivation requires direct assistance. Contact support.")}
              className="shrink-0 text-rose-600 border border-rose-200 bg-white hover:bg-rose-50 text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95"
            >
              Terminate Identity
            </button>
          </div>
        </section>

        {/* Bottom Metadata */}
        <div className="pt-10 flex items-center justify-center gap-2 opacity-30 select-none">
          <span className="material-symbols-outlined text-sm">shield</span>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Terminal Encrypted • End-to-End Secure</p>
        </div>

        {/* Spacer */}
        <div className="h-10" />
      </main>
    </div>
  );
}
