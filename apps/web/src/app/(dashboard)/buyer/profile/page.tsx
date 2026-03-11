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
    if (!/^[0-9]*$/.test(value)) return;
    const newOtp = [...waOtp];
    newOtp[index] = value;
    setWaOtp(newOtp);
    if (value && index < 5) waOtpRefs.current[index + 1]?.focus();
  }

  function handleWaOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !waOtp[index] && index > 0) {
      waOtpRefs.current[index - 1]?.focus();
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
    <div className="flex-1 flex flex-col font-display min-h-full">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your profile, security, and preferences
        </p>
      </header>

      <main className="p-4 md:p-8 space-y-6 max-w-4xl w-full mx-auto">

        {/* ═══════════════════════════════════════════════════
            SECTION 1: Personal Information
        ═══════════════════════════════════════════════════ */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">person</span>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">
              Personal Information
            </h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Name grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
              <div>
                <label htmlFor="middleName" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Middle Name
                </label>
                <input
                  id="middleName"
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Optional"
                  className="w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Adeyemi"
                  className="w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-slate-200 bg-slate-100 text-slate-500 text-sm font-medium rounded-l-lg">
                    +234
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="803 123 4567"
                    className="w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-r-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  className="w-full h-11 px-4 text-sm bg-slate-100 text-slate-400 border border-slate-200 rounded-lg cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">Email cannot be changed</p>
              </div>
            </div>

            {/* Save button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold px-8 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2"
              >
                {isSavingProfile ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-base">progress_activity</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">save</span>
                    Save Changes
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
            <span className="material-symbols-outlined text-primary text-xl">shield</span>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">
              Account Status
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Email Verification */}
            <div className={`p-4 rounded-xl border ${user?.emailVerified ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined text-lg ${user?.emailVerified ? "text-emerald-600" : "text-amber-600"}`}>
                  {user?.emailVerified ? "verified" : "warning"}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email
                </span>
              </div>
              {user?.emailVerified ? (
                <p className="text-sm font-semibold text-emerald-700">Verified ✓</p>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-amber-700 mb-2">Not verified</p>
                  <button
                    onClick={handleResendVerification}
                    disabled={isResendingEmail || emailResendCooldown > 0}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 disabled:opacity-50 underline transition-colors"
                  >
                    {emailResendCooldown > 0 ? `Resend in ${emailResendCooldown}s` : "Resend verification email"}
                  </button>
                </div>
              )}
            </div>

            {/* WhatsApp Link */}
            <div className={`p-4 rounded-xl border ${user?.isWhatsAppLinked ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50/50"}`}>
              <div className="flex items-center gap-2 mb-2">
                <svg className={`w-4 h-4 ${user?.isWhatsAppLinked ? "text-emerald-600" : "text-slate-400"}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.996-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  WhatsApp
                </span>
              </div>
              {user?.isWhatsAppLinked ? (
                <p className="text-sm font-semibold text-emerald-700">Linked ✓</p>
              ) : (
                <button
                  onClick={() => setWhatsappStep("phone")}
                  className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  Link WhatsApp →
                </button>
              )}
            </div>

            {/* Member Since */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg text-slate-400">calendar_month</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Member Since
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-700">{memberSince}</p>
            </div>
          </div>
        </section>

        {/* ─── WhatsApp Link Flow (inline expansion) ─── */}
        {whatsappStep !== "idle" && !user?.isWhatsAppLinked && (
          <section className="bg-white rounded-xl border border-[#25D366]/30 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="px-6 py-5 border-b border-[#25D366]/10 bg-[#25D366]/5 flex items-center gap-3">
              <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.996-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <h2 className="text-sm font-bold text-[#128C7E]">Link Your WhatsApp</h2>
            </div>

            <div className="p-6">
              {whatsappStep === "phone" && (
                <div className="max-w-sm space-y-4">
                  <p className="text-sm text-slate-600">
                    Enter your WhatsApp number to receive a verification code.
                  </p>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 border-slate-200 bg-slate-100 text-slate-500 text-sm font-medium rounded-l-lg">
                      +234
                    </span>
                    <input
                      type="tel"
                      value={waPhone}
                      onChange={(e) => setWaPhone(e.target.value)}
                      placeholder="08100000000"
                      className="w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-r-lg focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleInitiateWhatsAppLink}
                      disabled={isLinkingWhatsApp}
                      className="bg-[#25D366] hover:bg-[#128C7E] disabled:opacity-50 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-all flex items-center gap-2"
                    >
                      {isLinkingWhatsApp ? "Sending..." : "Send OTP"}
                    </button>
                    <button
                      onClick={() => setWhatsappStep("idle")}
                      className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors px-4"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {whatsappStep === "otp" && (
                <div className="max-w-sm space-y-4">
                  <p className="text-sm text-slate-600">
                    Enter the 6-digit code sent to <strong>{waPhone}</strong>
                  </p>
                  <div className="flex gap-2">
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
                        className={`w-11 h-13 text-center text-xl font-bold bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366] outline-none transition-all ${digit ? "border-[#25D366]/50" : "border-slate-200"}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleVerifyWhatsAppLink}
                      disabled={isLinkingWhatsApp || waOtp.join("").length !== 6}
                      className="bg-[#25D366] hover:bg-[#128C7E] disabled:opacity-50 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-all"
                    >
                      {isLinkingWhatsApp ? "Verifying..." : "Verify & Link"}
                    </button>
                    <button
                      onClick={() => setWhatsappStep("phone")}
                      className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors px-4"
                    >
                      Change number
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
            <span className="material-symbols-outlined text-primary text-xl">lock</span>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">
              Change Password
            </h2>
          </div>

          <form onSubmit={handleChangePassword} className="p-6 space-y-4 max-w-lg">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 px-4 pr-11 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300"
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
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="w-full h-11 px-4 pr-11 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300"
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
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  minLength={8}
                  className={`w-full h-11 px-4 pr-11 text-sm bg-slate-50 border rounded-lg focus:ring-2 outline-none transition-all placeholder:text-slate-300 ${
                    confirmPassword && confirmPassword !== newPassword
                      ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                      : "border-slate-200 focus:border-primary focus:ring-primary/20"
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
                <p className="text-xs text-red-500 font-medium mt-1">Passwords don&apos;t match</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-bold px-8 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-base">progress_activity</span>
                    Updating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">key</span>
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 4: Danger Zone
        ═══════════════════════════════════════════════════ */}
        <section className="bg-white rounded-xl border border-red-200/50 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-red-100/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500 text-xl">warning</span>
            <h2 className="text-sm font-bold uppercase tracking-widest text-red-600">
              Danger Zone
            </h2>
          </div>

          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Delete Account</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => toast.error("Please contact support at hello@swifta.store to delete your account.")}
              className="shrink-0 text-red-600 border border-red-200 bg-red-50/50 hover:bg-red-100 text-xs font-bold px-6 py-2.5 rounded-lg transition-all"
            >
              Delete Account
            </button>
          </div>
        </section>

        {/* Spacer */}
        <div className="h-8" />
      </main>
    </div>
  );
}
