"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { getProfile, updateProfile } from "@/lib/api/merchant.api";
import { authApi } from "@/lib/api/auth.api";
import { MerchantProfile, getDisplayName } from "@hardware-os/shared";

type SettingsTab = "account" | "notifications" | "security";

// ──────────────────────────────────────────────────
// Notification preferences (UI-only state for V1)
// ──────────────────────────────────────────────────
interface NotifPref {
  email: boolean;
  sms: boolean;
  push: boolean;
}
const defaultNotifPrefs: Record<string, NotifPref> = {
  "New RFQ": { email: true, sms: false, push: true },
  "Quote Accepted": { email: true, sms: true, push: false },
  "Order Paid": { email: true, sms: false, push: true },
  "Delivery Confirmed": { email: false, sms: false, push: true },
  "Payout Sent": { email: true, sms: true, push: true },
};

export default function MerchantSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Account tab state
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Notifications tab state
  const [notifPrefs, setNotifPrefs] = useState(defaultNotifPrefs);

  // Security tab state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p);
        setFirstName(user?.firstName || "");
        setMiddleName(user?.middleName || "");
        setLastName(user?.lastName || "");
        setEmail(user?.email || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setFeedback(null);
    try {
      const updated = await updateProfile({
        businessName: profile?.businessName,
      });
      setProfile(updated);
      setFeedback({ type: "success", msg: "Profile updated successfully." });
    } catch (err: any) {
      setFeedback({
        type: "error",
        msg: err?.message || "Failed to update profile",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", msg: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setFeedback({
        type: "error",
        msg: "Password must be at least 8 characters.",
      });
      return;
    }
    setChangingPassword(true);
    setFeedback(null);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setFeedback({ type: "success", msg: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setFeedback({
        type: "error",
        msg: err?.message || "Failed to update password",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const toggleNotif = (event: string, channel: keyof NotifPref) => {
    setNotifPrefs((prev) => ({
      ...prev,
      [event]: { ...prev[event], [channel]: !prev[event][channel] },
    }));
  };

  const tabs: { label: string; value: SettingsTab }[] = [
    { label: "Account", value: "account" },
    { label: "Notifications", value: "notifications" },
    { label: "Security", value: "security" },
  ];

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
      <div className="flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-10 shrink-0">
        <button
          onClick={() => router.back()}
          className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 px-2 uppercase">
          Merchant Settings
        </h1>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-[73px] z-10 shrink-0">
        <div className="flex px-4 gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                setFeedback(null);
              }}
              className={`flex flex-col items-center justify-center border-b-2 pb-3 pt-4 shrink-0 transition-colors ${
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 dark:text-slate-400"
              }`}
            >
              <p className="text-sm font-bold uppercase tracking-wider">
                {tab.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`mx-4 mt-4 p-3 text-xs font-bold uppercase tracking-wide border ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-600"
              : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-600"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* ═══════════════════ ACCOUNT TAB ═══════════════════ */}
        {activeTab === "account" && (
          <div className="p-4 space-y-6">
            {/* Profile Photo */}
            <section>
              <h2 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                Profile Information
              </h2>
              <div className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="relative group cursor-pointer border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 w-24 h-24 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-slate-400 text-3xl">
                    photo_camera
                  </span>
                </div>
                <div className="flex flex-col justify-center py-1">
                  <p className="text-slate-900 dark:text-slate-100 text-base font-bold uppercase">
                    Upload Photo
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                    PNG or JPG. Sharp square format (max 2MB).
                  </p>
                  <button className="mt-3 bg-primary text-white text-xs font-bold uppercase py-2 px-4 w-fit hover:bg-blue-700">
                    Change Photo
                  </button>
                </div>
              </div>
            </section>

            {/* Form Fields */}
            <section className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Middle Name (Optional)
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-sm text-slate-900 dark:text-white outline-none"
                  />
                  {user?.emailVerified && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-0.5">
                      <span className="material-symbols-outlined text-[14px] text-green-600 dark:text-green-400">
                        check_circle
                      </span>
                      <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase">
                        Verified
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Phone Number
                </label>
                <div className="flex">
                  <div className="bg-slate-100 dark:bg-slate-800 border-y border-l border-slate-200 dark:border-slate-800 p-3 text-sm font-medium flex items-center">
                    <span className="text-slate-900 dark:text-slate-100">
                      +234
                    </span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-800" />

            {/* Notification Preferences Preview */}
            <div className="space-y-4">
              <h2 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
                Notification Preferences
              </h2>
              <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-bold uppercase text-slate-900 dark:text-white">
                      RFQs & Quotes
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Notify on new incoming requests
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Email
                    </span>
                    <div
                      className={`w-8 h-4 relative cursor-pointer ${notifPrefs["New RFQ"].email ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"}`}
                      onClick={() => toggleNotif("New RFQ", "email")}
                    >
                      <div
                        className={`absolute bg-white w-3 h-3 top-0.5 ${notifPrefs["New RFQ"].email ? "right-0.5" : "left-0.5"}`}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-bold uppercase text-slate-900 dark:text-white">
                      Payments & Payouts
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Transaction status updates
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      SMS
                    </span>
                    <div
                      className={`w-8 h-4 relative cursor-pointer ${notifPrefs["Payout Sent"].sms ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"}`}
                      onClick={() => toggleNotif("Payout Sent", "sms")}
                    >
                      <div
                        className={`absolute bg-white w-3 h-3 top-0.5 ${notifPrefs["Payout Sent"].sms ? "right-0.5" : "left-0.5"}`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest py-4 hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-colors disabled:opacity-50"
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>

            <hr className="border-slate-200 dark:border-slate-800" />

            {/* Danger Zone */}
            <div className="border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 p-4">
              <h2 className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest mb-2">
                Danger Zone
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                Deactivating your merchant account will halt all active quotes
                and pending payouts. This action is irreversible.
              </p>
              <button className="border border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 text-xs font-bold uppercase py-2 px-4 hover:bg-red-600 hover:text-white transition-colors">
                Deactivate Account
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════ NOTIFICATIONS TAB ═══════════════════ */}
        {activeTab === "notifications" && (
          <div className="p-4">
            <div className="mb-6">
              <h2 className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                Configuration Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Configure multi-channel alerts for HARDWARE OS events.
              </p>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 border-t border-x border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
              <div className="col-span-6 p-3 border-r border-slate-200 dark:border-slate-800">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                  Event Type
                </span>
              </div>
              <div className="col-span-2 flex justify-center items-center border-r border-slate-200 dark:border-slate-800">
                <span className="material-symbols-outlined text-sm text-slate-500">
                  mail
                </span>
              </div>
              <div className="col-span-2 flex justify-center items-center border-r border-slate-200 dark:border-slate-800">
                <span className="material-symbols-outlined text-sm text-slate-500">
                  sms
                </span>
              </div>
              <div className="col-span-2 flex justify-center items-center">
                <span className="material-symbols-outlined text-sm text-slate-500">
                  notifications_active
                </span>
              </div>
            </div>

            {/* Table Rows */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {Object.entries(notifPrefs).map(([event, prefs]) => (
                <div key={event} className="grid grid-cols-12">
                  <div className="col-span-6 p-3 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                    <span className="text-[11px] font-bold uppercase text-slate-900 dark:text-slate-100">
                      {event}
                    </span>
                  </div>
                  {(["email", "sms", "push"] as const).map((channel) => (
                    <div
                      key={channel}
                      className="col-span-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 flex justify-center items-center p-2"
                    >
                      <div
                        className={`w-8 h-[18px] relative cursor-pointer ${prefs[channel] ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"}`}
                        onClick={() => toggleNotif(event, channel)}
                      >
                        <div
                          className={`absolute bg-white w-3.5 h-3.5 top-0.5 ${prefs[channel] ? "right-0.5" : "left-0.5"}`}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-8">
              <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest py-4 border border-slate-900 dark:border-white hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-colors">
                Save Preferences
              </button>
              <p className="text-[10px] text-center text-slate-400 mt-4 uppercase tracking-tighter">
                Changes apply to all registered sub-accounts.
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════ SECURITY TAB ═══════════════════ */}
        {activeTab === "security" && (
          <div className="p-4 space-y-6">
            {/* Password Management */}
            <section className="space-y-4">
              <h2 className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                Password Management
              </h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 12 characters"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={
                    changingPassword || !currentPassword || !newPassword
                  }
                  className="w-full bg-primary text-white text-xs font-bold uppercase py-4 px-4 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </section>

            {/* Two-Factor Authentication */}
            <section className="space-y-4">
              <h2 className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                Two-Factor Authentication
              </h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-400">
                        vibration
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                        Status: <span className="text-red-600">OFF</span>
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">
                        Enhance account security
                      </p>
                    </div>
                  </div>
                </div>
                <button className="w-full border border-primary text-primary text-xs font-bold uppercase py-4 px-4 hover:bg-primary hover:text-white transition-colors">
                  Set Up 2FA
                </button>
              </div>
            </section>

            {/* Session Management */}
            <section className="space-y-4">
              <h2 className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                Session Management
              </h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400">
                      laptop_mac
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                          Current Session
                        </p>
                        <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[8px] font-bold px-1.5 py-0.5 uppercase">
                          Current
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Lagos, Nigeria • Web Browser
                      </p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-red-600 transition-colors">
                    <span className="material-symbols-outlined text-xl">
                      logout
                    </span>
                  </button>
                </div>
              </div>
              <button className="w-full text-red-600 text-[10px] font-bold uppercase py-2 hover:underline">
                Log out from all other devices
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
