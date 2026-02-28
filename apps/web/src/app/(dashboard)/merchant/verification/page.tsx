"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import {
  getProfile,
  updateProfile,
  uploadDocument,
  getBanks,
  resolveBankAccount,
} from "@/lib/api/merchant.api";
import { authApi } from "@/lib/api/auth.api";
import type { MerchantProfile } from "@hardware-os/shared";

export default function MerchantVerificationPage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Step 1 state: email OTP verification
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  // Step 2 state
  const [rcNumber, setRcNumber] = useState("");
  const [cacFile, setCacFile] = useState<File | null>(null);
  const [submittingCac, setSubmittingCac] = useState(false);

  // Step 3 state
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailResent, setEmailResent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);

  // Step 4 state
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [submittingBank, setSubmittingBank] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  const [phoneVerified, setPhoneVerified] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: banksList = [], isLoading: isLoadingBanks } = useQuery({
    queryKey: ["merchant-banks"],
    queryFn: getBanks,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close drop down
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        bankDropdownRef.current &&
        !bankDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBankDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // auto-resolve bank details
  useEffect(() => {
    if (bankCode && bankAccountNo.length === 10) {
      setIsResolving(true);
      setResolveError("");

      resolveBankAccount(bankAccountNo, bankCode)
        .then((data) => {
          setBankAccountName(data.accountName);
          setIsResolving(false);
        })
        .catch((err) => {
          setResolveError("Account resolution failed. Please check details.");
          setBankAccountName("");
          setIsResolving(false);
        });
    } else {
      setBankAccountName("");
      setResolveError("");
    }
  }, [bankCode, bankAccountNo]);

  const filteredBanks = banksList.filter((bank) =>
    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()),
  );

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data);
        if (data.cacNumber) setRcNumber(data.cacNumber);
        if (data.bankAccountNo) setBankAccountNo(data.bankAccountNo);
        if (data.bankAccountName) setBankAccountName(data.bankAccountName);
        if (data.bankCode) setBankCode(data.bankCode);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Compute steps
  const isManuallyVerified = profile?.verification === "VERIFIED";

  const step1Complete = isManuallyVerified || user?.emailVerified === true;
  const step2Complete = isManuallyVerified || !!profile?.cacNumber;
  const step3Complete =
    isManuallyVerified || (step2Complete && step1Complete && phoneVerified);
  const step4Complete =
    isManuallyVerified ||
    !!(profile?.bankAccountNo && profile?.bankAccountName);

  const completedSteps = [
    step1Complete,
    step2Complete,
    step3Complete,
    step4Complete,
  ].filter(Boolean).length;
  const progressPercent = (completedSteps / 4) * 100;

  // Step 1: Send email OTP
  const handleSendOtp = async () => {
    if (!user?.email) return;
    setSendingOtp(true);
    setError(null);
    try {
      await authApi.resendVerification({ email: user.email });
      setOtpSent(true);
      setSuccess("Verification code sent to " + user.email);
    } catch (err: any) {
      setError(
        err?.message || err?.error || "Failed to send verification code",
      );
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 1: Verify email OTP
  const handleVerifyEmail = async () => {
    if (!user?.email || emailOtp.length !== 6) return;
    setVerifyingEmail(true);
    setError(null);
    try {
      await authApi.verifyEmail({ email: user.email, code: emailOtp });
      setSuccess("Email verified successfully! Steps unlocked.");
      // Refresh user data so emailVerified flips to true
      await refreshUser();
    } catch (err: any) {
      setError(
        err?.message || err?.error || "Invalid or expired verification code",
      );
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Step 2: Submit CAC
  const handleSubmitCac = async () => {
    if (!rcNumber.trim()) return;
    setSubmittingCac(true);
    setError(null);
    setSuccess(null);
    try {
      let docUrl: string | undefined = profile?.cacDocumentUrl ?? undefined;
      if (cacFile) {
        try {
          const uploadResult = await uploadDocument(cacFile);
          docUrl = uploadResult.url;
        } catch (uploadErr: any) {
          console.warn(
            "File upload failed (Cloudinary may not be configured):",
            uploadErr,
          );
          // Continue without the document — RC number is the critical field
        }
      }
      const payload: Record<string, any> = { cacNumber: rcNumber };
      if (docUrl) payload.cacDocumentUrl = docUrl;
      const updated = await updateProfile(payload);
      setProfile(updated);
      if (cacFile && !docUrl) {
        setSuccess(
          "RC number saved! Note: Document upload failed — you can re-upload later.",
        );
      } else {
        setSuccess("Business registration submitted for review.");
      }
    } catch (err: any) {
      console.error("CAC submit error:", err);
      setError(
        err?.error || err?.message || "Failed to submit business registration",
      );
    } finally {
      setSubmittingCac(false);
    }
  };

  // Step 3: Resend email verification
  const handleResendEmail = async () => {
    if (!user?.email) return;
    setResendingEmail(true);
    setError(null);
    try {
      await authApi.resendVerification({ email: user.email });
      setEmailResent(true);
    } catch (err: any) {
      setError(err?.error || err?.message || "Failed to resend verification");
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!user?.phone) {
      setError("No phone number associated with your account.");
      return;
    }
    setSendingPhoneOtp(true);
    setError(null);
    try {
      await authApi.sendPhoneOtp({ phone: user.phone });
      setPhoneOtpSent(true);
      setSuccess("Verification code sent to " + user.phone);
    } catch (err: any) {
      setError(err?.error || err?.message || "Failed to send SMS code");
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!user?.phone || phoneOtp.length !== 6) return;
    setVerifyingPhoneOtp(true);
    setError(null);
    try {
      await authApi.verifyPhoneOtp({ phone: user.phone, code: phoneOtp });
      setSuccess("Phone number verified successfully!");
      setPhoneVerified(true);
      await refreshUser();
    } catch (err: any) {
      setError(
        err?.error || err?.message || "Invalid or expired verification code",
      );
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  // Step 4: Submit bank details
  const handleSubmitBank = async () => {
    if (!bankAccountNo.trim() || !bankAccountName.trim()) return;
    setSubmittingBank(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateProfile({
        bankAccountNo,
        bankAccountName,
        bankCode,
      });
      setProfile(updated);
      setSuccess("Bank account details saved successfully.");
    } catch (err: any) {
      setError(err?.error || err?.message || "Failed to save bank details");
    } finally {
      setSubmittingBank(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shrink-0">
        <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
          Merchant Trust Center
        </h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="size-2 bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 tracking-widest">
              System Operational
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-10 max-w-7xl w-full mx-auto">
        {/* Status Alert Banner */}
        <div className="mb-10 bg-white dark:bg-slate-800 border-l-4 border-l-amber-500 border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-start gap-5">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3">
                <span className="material-symbols-outlined text-amber-600 text-3xl">
                  {completedSteps === 4 ? "verified" : "report"}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white mb-1">
                  {completedSteps === 4
                    ? "Account Verified"
                    : "Account Unverified"}
                </h2>
                <p className="text-slate-500 text-sm max-w-lg">
                  {completedSteps === 4
                    ? "Your account is fully verified. All features are unlocked."
                    : "Your account functionality is currently restricted. Complete the required business documentation to unlock wholesale trading, bulk logistics, and credit facilities."}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 min-w-[300px]">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Completion Progress
                </span>
                <span className="text-sm font-black text-amber-600">
                  {completedSteps} OF 4 STEPS
                </span>
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                <div
                  className={`h-full transition-all duration-500 ${completedSteps === 4 ? "bg-emerald-500" : "bg-amber-500"}`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
            {success}
          </div>
        )}

        {/* 4-Step Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Step 1: Personal Identity */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 flex flex-col relative">
            <div className="flex justify-between items-start mb-10">
              <div>
                <p
                  className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${step1Complete ? "text-emerald-600" : "text-amber-600"}`}
                >
                  Step 01 // {step1Complete ? "Completed" : "Pending"}
                </p>
                <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white">
                  Personal Identity
                </h3>
                <p className="text-sm text-slate-500">
                  Primary business owner identification
                </p>
              </div>
              {step1Complete ? (
                <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-3 py-1 border border-emerald-200 dark:border-emerald-800 uppercase tracking-widest">
                  Verified
                </span>
              ) : (
                <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black px-3 py-1 border border-amber-200 dark:border-amber-800 uppercase tracking-widest">
                  Pending
                </span>
              )}
            </div>
            <div className="mt-auto space-y-4">
              <div className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined ${step1Complete ? "text-emerald-600" : "text-amber-500"}`}
                  >
                    {step1Complete ? "check_circle" : "pending"}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {user?.email || "Email"}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase">
                      Email Verification
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase ${step1Complete ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {step1Complete ? "Verified" : "Unverified"}
                </span>
              </div>

              {/* Action: Full OTP verification flow */}
              {!step1Complete && (
                <div className="space-y-4">
                  {!otpSent ? (
                    <>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-primary p-3 flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary text-sm mt-0.5">
                          info
                        </span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          Click below to send a 6-digit verification code to
                          your email address. You'll enter it here to verify.
                        </p>
                      </div>
                      <button
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 font-black uppercase tracking-[0.15em] text-xs hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">
                          mail
                        </span>
                        {sendingOtp ? "Sending..." : "Send Verification Code"}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-3 flex items-start gap-3">
                        <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5">
                          mark_email_read
                        </span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          A 6-digit code has been sent to{" "}
                          <strong className="text-slate-900 dark:text-white">
                            {user?.email}
                          </strong>
                          . Enter it below to verify your email.
                        </p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">
                          Enter 6-Digit Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={emailOtp}
                          onChange={(e) =>
                            setEmailOtp(e.target.value.replace(/\D/g, ""))
                          }
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 text-xl font-mono focus:ring-1 focus:ring-primary focus:border-primary outline-none tracking-[0.5em] text-center text-slate-900 dark:text-white"
                          placeholder="000000"
                        />
                      </div>
                      <button
                        onClick={handleVerifyEmail}
                        disabled={verifyingEmail || emailOtp.length !== 6}
                        className="w-full bg-emerald-600 text-white py-3 font-black uppercase tracking-[0.15em] text-xs hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">
                          verified
                        </span>
                        {verifyingEmail ? "Verifying..." : "Verify Email"}
                      </button>
                      <button
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
                        className="w-full border border-slate-200 dark:border-slate-700 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-xs">
                          refresh
                        </span>
                        {sendingOtp ? "Sending..." : "Resend Code"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Business Registration */}
          <div
            className={`bg-white dark:bg-slate-800 p-8 flex flex-col ${!step1Complete ? "grayscale opacity-60" : step2Complete ? "border border-slate-200 dark:border-slate-700" : "border-2 border-primary shadow-xl"}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <p
                  className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${step2Complete ? "text-emerald-600" : step1Complete ? "text-primary" : "text-slate-400"}`}
                >
                  Step 02 //{" "}
                  {step2Complete
                    ? "Completed"
                    : step1Complete
                      ? "Action Required"
                      : "Queued"}
                </p>
                <h3
                  className={`text-lg font-black uppercase ${!step1Complete ? "text-slate-400" : "text-slate-900 dark:text-white"}`}
                >
                  Business Registration
                </h3>
                <p className="text-sm text-slate-500">
                  Corporate Affairs Commission details
                </p>
              </div>
              {step2Complete ? (
                <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-3 py-1 border border-emerald-200 dark:border-emerald-800 uppercase tracking-widest">
                  Verified
                </span>
              ) : step1Complete ? (
                <span className="bg-primary text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest">
                  In Progress
                </span>
              ) : (
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-500 text-[10px] font-black px-3 py-1 border border-slate-300 dark:border-slate-600 uppercase tracking-widest">
                  Locked
                </span>
              )}
            </div>

            {step1Complete && !step2Complete ? (
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest">
                    RC Number (Business Registration)
                  </label>
                  <input
                    type="text"
                    value={rcNumber}
                    onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 text-sm font-bold placeholder:text-slate-300 focus:ring-0 focus:border-primary uppercase text-slate-900 dark:text-white"
                    placeholder="RC-00000000"
                  />
                </div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-10 flex flex-col items-center justify-center group hover:border-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl mb-4 group-hover:text-primary">
                    upload_file
                  </span>
                  <p className="text-xs font-black uppercase tracking-widest mb-1 text-slate-900 dark:text-white">
                    {cacFile ? cacFile.name : "Upload CAC Certificate"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    PDF, JPG, OR PNG (MAX 5MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size > 5 * 1024 * 1024) {
                        setError("File size must be under 5MB");
                        return;
                      }
                      setCacFile(file || null);
                    }}
                  />
                </div>
                <button
                  onClick={handleSubmitCac}
                  disabled={submittingCac || !rcNumber.trim()}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all disabled:opacity-50"
                >
                  {submittingCac
                    ? "Submitting..."
                    : "Save and Submit for Review"}
                </button>
              </div>
            ) : step2Complete ? (
              <div className="mt-auto border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-600">
                    check_circle
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {profile?.cacNumber}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase">
                      CAC Registration Number
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase text-emerald-600">
                  Submitted
                </span>
              </div>
            ) : (
              <div className="mt-auto flex items-center gap-3 text-slate-400">
                <span className="material-symbols-outlined text-sm">lock</span>
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  Complete step 1 to unlock
                </p>
              </div>
            )}
          </div>

          {/* Step 3: Contact Verification */}
          <div
            className={`p-8 flex flex-col ${!step2Complete ? "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grayscale opacity-60" : step3Complete ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" : "bg-white dark:bg-slate-800 border-2 border-primary shadow-xl"}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <p
                  className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${step3Complete ? "text-emerald-600" : step2Complete ? "text-primary" : "text-slate-400"}`}
                >
                  Step 03 //{" "}
                  {step3Complete
                    ? "Completed"
                    : step2Complete
                      ? "Action Required"
                      : "Queued"}
                </p>
                <h3
                  className={`text-lg font-black uppercase ${!step2Complete ? "text-slate-400" : "text-slate-900 dark:text-white"}`}
                >
                  Contact Verification
                </h3>
                <p className="text-sm text-slate-500">
                  Email & phone authentication
                </p>
              </div>
              {step3Complete ? (
                <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-3 py-1 border border-emerald-200 dark:border-emerald-800 uppercase tracking-widest">
                  Verified
                </span>
              ) : (
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-500 text-[10px] font-black px-3 py-1 border border-slate-300 dark:border-slate-600 uppercase tracking-widest">
                  {step2Complete ? "In Progress" : "Locked"}
                </span>
              )}
            </div>

            {step2Complete && !step3Complete ? (
              <div className="space-y-6">
                {/* Email Verification */}
                <div className="border border-slate-200 dark:border-slate-700 p-4">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Email
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                    {user?.email}
                  </p>
                  {user?.emailVerified ? (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <span className="material-symbols-outlined text-sm">
                        check_circle
                      </span>
                      <span className="text-[10px] font-bold uppercase">
                        Verified
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-primary p-3 flex items-start gap-3 mb-3">
                        <span className="material-symbols-outlined text-primary text-sm mt-0.5">
                          info
                        </span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {emailResent
                            ? "Verification link resent! Check your inbox."
                            : "A confirmation link has been sent to your inbox."}
                        </p>
                      </div>
                      <button
                        onClick={handleResendEmail}
                        disabled={resendingEmail}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-900 dark:border-white text-slate-900 dark:text-white text-xs font-bold uppercase py-3 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">
                          refresh
                        </span>
                        {resendingEmail ? "Sending..." : "Resend Link"}
                      </button>
                    </>
                  )}
                </div>
                <div className="border border-slate-200 dark:border-slate-700 p-4">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Phone Verification
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                    {user?.phone}
                  </p>
                  <div className="space-y-3">
                    {!phoneOtpSent ? (
                      <>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-primary p-3 flex items-start gap-3 mb-3">
                          <span className="material-symbols-outlined text-primary text-sm mt-0.5">
                            info
                          </span>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            A verification code will be sent to your phone
                            number.
                          </p>
                        </div>
                        <button
                          onClick={handleSendPhoneOtp}
                          disabled={sendingPhoneOtp}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-900 dark:border-white text-slate-900 dark:text-white text-xs font-bold uppercase py-3 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-sm">
                            sms
                          </span>
                          {sendingPhoneOtp ? "Sending..." : "Send SMS Code"}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-3 flex items-start gap-3 mb-3">
                          <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5">
                            mark_email_read
                          </span>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            An SMS code has been sent to your phone.
                          </p>
                        </div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400">
                          Enter 6-Digit OTP
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={phoneOtp}
                          onChange={(e) =>
                            setPhoneOtp(e.target.value.replace(/\D/g, ""))
                          }
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 text-xl font-mono focus:ring-1 focus:ring-primary focus:border-primary outline-none tracking-[0.5em] text-center text-slate-900 dark:text-white"
                          placeholder="000000"
                        />
                        <button
                          onClick={handleVerifyPhone}
                          disabled={phoneOtp.length !== 6 || verifyingPhoneOtp}
                          className="w-full bg-primary text-white text-xs font-bold uppercase py-3 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {verifyingPhoneOtp
                            ? "Verifying..."
                            : "Verify via SMS"}
                          {!verifyingPhoneOtp && (
                            <span className="material-symbols-outlined text-sm">
                              arrow_forward
                            </span>
                          )}
                        </button>
                        <button
                          onClick={handleSendPhoneOtp}
                          disabled={sendingPhoneOtp}
                          className="w-full border border-slate-200 dark:border-slate-700 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 mt-2"
                        >
                          <span className="material-symbols-outlined text-xs">
                            refresh
                          </span>
                          {sendingPhoneOtp ? "Sending..." : "Resend Code"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : !step2Complete ? (
              <div className="mt-auto flex items-center gap-3 text-slate-400">
                <span className="material-symbols-outlined text-sm">lock</span>
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  Complete step 2 to unlock
                </p>
              </div>
            ) : (
              <div className="mt-auto border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600">
                  check_circle
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Contact details verified
                </p>
              </div>
            )}
          </div>

          {/* Step 4: Bank Account */}
          <div
            className={`p-8 flex flex-col ${!step3Complete ? "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grayscale opacity-60" : step4Complete ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" : "bg-white dark:bg-slate-800 border-2 border-primary shadow-xl"}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <p
                  className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${step4Complete ? "text-emerald-600" : step3Complete ? "text-primary" : "text-slate-400"}`}
                >
                  Step 04 //{" "}
                  {step4Complete
                    ? "Completed"
                    : step3Complete
                      ? "Action Required"
                      : "Queued"}
                </p>
                <h3
                  className={`text-lg font-black uppercase ${!step3Complete ? "text-slate-400" : "text-slate-900 dark:text-white"}`}
                >
                  Bank Account
                </h3>
                <p className="text-sm text-slate-500">
                  BVN linkage & settlement details
                </p>
              </div>
              {step4Complete ? (
                <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-3 py-1 border border-emerald-200 dark:border-emerald-800 uppercase tracking-widest">
                  Verified
                </span>
              ) : (
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-500 text-[10px] font-black px-3 py-1 border border-slate-300 dark:border-slate-600 uppercase tracking-widest">
                  {step3Complete ? "In Progress" : "Locked"}
                </span>
              )}
            </div>

            {step3Complete && !step4Complete ? (
              <div className="space-y-6 pt-2">
                <div className="relative" ref={bankDropdownRef}>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest">
                    Bank
                  </label>
                  <input
                    type="text"
                    value={bankSearchQuery}
                    onChange={(e) => {
                      setBankSearchQuery(e.target.value);
                      setBankCode("");
                      setIsBankDropdownOpen(true);
                    }}
                    onFocus={() => setIsBankDropdownOpen(true)}
                    placeholder={
                      isLoadingBanks ? "Loading banks..." : "Search bank..."
                    }
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 text-sm font-bold text-slate-900 dark:text-white"
                    disabled={isLoadingBanks}
                  />
                  {isBankDropdownOpen && !isLoadingBanks && (
                    <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
                      {filteredBanks.length > 0 ? (
                        filteredBanks.map((bank) => (
                          <li
                            key={bank.code}
                            onClick={() => {
                              setBankCode(bank.code);
                              setBankSearchQuery(bank.name);
                              setIsBankDropdownOpen(false);
                            }}
                            className="p-4 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer uppercase"
                          >
                            {bank.name}
                          </li>
                        ))
                      ) : (
                        <li className="p-4 text-sm text-slate-500 italic">
                          No banks found
                        </li>
                      )}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankAccountNo}
                    onChange={(e) =>
                      setBankAccountNo(e.target.value.replace(/\D/g, ""))
                    }
                    maxLength={10}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 text-sm font-bold placeholder:text-slate-300 focus:ring-0 focus:border-primary font-mono text-slate-900 dark:text-white"
                    placeholder="0123456789"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={bankAccountName}
                    readOnly
                    placeholder={
                      isResolving
                        ? "Resolving name..."
                        : "Auto-filled from bank"
                    }
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 text-sm font-bold uppercase text-slate-900 dark:text-white disabled:opacity-50"
                  />
                  {resolveError && (
                    <p className="text-[10px] text-red-500 mt-2 font-bold uppercase tracking-widest">
                      {resolveError}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSubmitBank}
                  disabled={
                    submittingBank ||
                    !bankAccountNo.trim() ||
                    !bankAccountName.trim()
                  }
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all disabled:opacity-50"
                >
                  {submittingBank ? "Saving..." : "Save Settlement Details"}
                </button>
              </div>
            ) : step4Complete ? (
              <div className="mt-auto border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-600">
                    check_circle
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {profile?.bankAccountName} — ****
                      {profile?.bankAccountNo?.slice(-4)}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase">
                      Settlement Account
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase text-emerald-600">
                  Linked
                </span>
              </div>
            ) : (
              <div className="mt-auto flex items-center gap-3 text-slate-400">
                <span className="material-symbols-outlined text-sm">lock</span>
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  Complete all previous steps
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            SwiftTrade Industrial Verification Engine
          </p>
          <div className="flex gap-8">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:text-primary">
              Contact Compliance
            </span>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:text-primary">
              KYC Guidelines
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
