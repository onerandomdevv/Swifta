"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import {
  getProfile,
  updateProfile,
  updateBankAccount,
  getBanks,
  resolveBankAccount,
} from "@/lib/api/merchant.api";
import { useToast } from "@/providers/toast-provider";
import { authApi } from "@/lib/api/auth.api";
import { MerchantProfile } from "@hardware-os/shared";

type SettingsTab = "account" | "notifications" | "security";

interface NotifPref {
  email: boolean;
  sms: boolean;
  push: boolean;
}

const defaultNotifPrefs: Record<string, NotifPref> = {
  "Order Dispatched": { email: true, sms: false, push: true },
  "Delivery Confirmed": { email: true, sms: true, push: true },
  "Order Paid": { email: true, sms: false, push: true },
  "Payout Sent": { email: true, sms: true, push: true },
};

const SectionHeader = ({ icon, title, subtitle }: { icon: string, title: string, subtitle: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-1">
      <span className="p-2 bg-primary/10 text-primary rounded-xl material-symbols-outlined text-sm">
        {icon}
      </span>
      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
        {title}
      </h2>
    </div>
    <p className="text-slate-500 text-sm font-medium">{subtitle}</p>
  </div>
);

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 sm:p-8 shadow-sm ${className}`}>
    {children}
  </div>
);

const Input = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
      {label}
    </label>
    <input
      {...props}
      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-navy-dark dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
    />
  </div>
);

export default function MerchantSettingsPage() {

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary transition-colors rounded-xl shadow-sm"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-3xl font-black text-navy-dark dark:text-white tracking-tight uppercase">
              Account Settings
            </h1>
            <p className="text-slate-500 font-medium">Manage your merchant presence and security.</p>
          </div>
        </div>
      </header>

      {/* Nav Tabs */}
      <nav className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit">
        {(["account", "notifications", "security"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab
                ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="space-y-12">
        {/* ACCOUNT TAB */}
        {activeTab === "account" && (
          <div className="space-y-12">
            {/* Identity section */}
            <section>
              <SectionHeader
                icon="person"
                title="Personal Identity"
                subtitle="Your details are used for verifications and correspondence."
              />
              <Card>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input
                      label="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                    <Input
                      label="Middle Name"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                    />
                    <Input
                      label="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Email Address"
                      value={email}
                      disabled
                    />
                    <Input
                      label="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-8 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {savingProfile ? "Saving..." : "Save Identity"}
                    </button>
                  </div>
                </form>
              </Card>
            </section>

            {/* Settlement section */}
            <section>
              <SectionHeader
                icon="account_balance"
                title="Settlement Account"
                subtitle="Specify where you receive your payouts from sales."
              />
              <Card>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
                        Bank Name
                      </label>
                      <select
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-navy-dark dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        <option value="">Select a Bank</option>
                        {banksList.map((b) => (
                          <option key={b.code} value={b.code}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Account Number"
                      value={bankAccountNo}
                      maxLength={10}
                      onChange={(e) => setBankAccountNo(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-1.5">
                      Account Name (Resolved)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={resolvingAccount ? "Resolving..." : bankAccountName}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl px-4 py-3 text-sm font-black text-slate-500 outline-none"
                      />
                      {resolvingAccount && (
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary">
                          progress_activity
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile || resolvingAccount || !bankAccountName || bankAccountName.includes("failed")}
                      className="px-8 py-3 bg-navy-dark dark:bg-white text-white dark:text-navy-dark rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:bg-navy-dark/90 dark:hover:bg-slate-100 shadow-lg disabled:opacity-50"
                    >
                      Update Bank Details
                    </button>
                  </div>
                </div>
              </Card>
            </section>

            {/* Danger Zone */}
            <section>
              <SectionHeader
                icon="report"
                title="Danger Zone"
                subtitle="Permanent actions that cannot be reversed."
              />
              <Card className="border-red-100 dark:border-red-900/30 bg-red-50/20 dark:bg-red-950/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Deactivate Merchant Account</h3>
                    <p className="text-slate-500 text-sm font-medium">This will stop all your listings and freeze pending payouts.</p>
                  </div>
                  <button className="px-6 py-3 border-2 border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-xl font-bold uppercase tracking-widest text-[10px]">
                    Deactivate Account
                  </button>
                </div>
              </Card>
            </section>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <div className="space-y-8 max-w-4xl">
            <SectionHeader
              icon="notifications_active"
              title="Global Notifications"
              subtitle="Control how and when you receive alerts from SwiftTrade."
            />
            <Card>
              <div className="space-y-1">
                <div className="grid grid-cols-12 px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  <div className="col-span-6">Event Type</div>
                  <div className="col-span-2 text-center">Email</div>
                  <div className="col-span-2 text-center">SMS</div>
                  <div className="col-span-2 text-center">Push</div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {Object.entries(notifPrefs).map(([event, prefs]) => (
                    <div key={event} className="grid grid-cols-12 px-4 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="col-span-6 flex flex-col justify-center">
                        <span className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-wider">{event}</span>
                      </div>
                      {(["email", "sms", "push"] as const).map((channel) => (
                        <div key={channel} className="col-span-2 flex justify-center items-center">
                          <button
                            onClick={() => toggleNotif(event, channel)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${prefs[channel] ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                          >
                            <div className={`absolute top-1 size-3 bg-white rounded-full transition-all ${prefs[channel] ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button className="px-8 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:bg-primary/90 shadow-lg shadow-primary/20">
                  Save Preferences
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <div className="space-y-12 max-w-2xl">
            <section>
              <SectionHeader
                icon="lock"
                title="Change Password"
                subtitle="Update your login credentials regularly for better security."
              />
              <Card>
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="w-full py-4 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {changingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </Card>
            </section>
          </div>
        )}
      </div>
      
      <div className="h-20" />
    </div>
  );
}
