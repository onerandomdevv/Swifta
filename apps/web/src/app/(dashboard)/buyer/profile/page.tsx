"use client";

import React, { useState } from "react";
import { useAuth } from "@/providers/auth-provider";

type Tab = "General" | "Documents" | "Billing";

export default function BuyerProfilePage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("General");
  const [isSaving, setIsSaving] = useState(false);

  function handleTabSelect(tab: Tab) {
    setActiveTab(tab);
  }

  async function handleSaveChanges() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // TODO: wire to profile update API when endpoint is available
      // e.g. await profileApi.updateProfile({ fullName, phone, deliveryAddress });
      await new Promise((res) => setTimeout(res, 800)); // placeholder
    } catch {
      // TODO: surface error to user via toast
    } finally {
      setIsSaving(false);
    }
  }

  function handleDocumentUpload() {
    handleTabSelect("Documents");
  }

  return (
    <div className="flex-1 flex flex-col font-display bg-[#f9fafb] min-h-full">
      {/* Header Section */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold uppercase tracking-tight text-slate-900">
              My Profile
            </h1>
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] mt-1">
              Account Details • Security
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex border border-slate-200">
              {(["General", "Documents", "Billing"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabSelect(tab)}
                  className={`px-6 py-2 text-xs font-bold border-b-2 uppercase transition-colors ${
                    activeTab === tab
                      ? "border-primary text-slate-900"
                      : "border-transparent text-slate-400 hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="bg-primary text-white text-xs font-bold px-8 py-3 uppercase tracking-widest hover:bg-orange-800 transition-colors w-full md:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {activeTab === "General" && (
          <>
            {/* Top Grid (Business & Contact) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Business Information Section */}
              <section className="bg-white border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                  <span className="material-symbols-outlined text-primary">factory</span>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">
                    Business Information
                  </h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="userFullName"
                      className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider"
                    >
                      Full Name
                    </label>
                    <input
                      id="userFullName"
                      type="text"
                      defaultValue={user?.fullName || ""}
                      placeholder="Enter your full name"
                      className="w-full h-12 px-4 text-sm rounded-none border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-slate-300"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="businessName"
                      className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider"
                    >
                      Business Name
                    </label>
                    <input
                      id="businessName"
                      type="text"
                      defaultValue=""
                      placeholder="Enter your registered business name"
                      className="w-full h-12 px-4 text-sm rounded-none border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="industryType"
                        className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider"
                      >
                        Industry Type
                      </label>
                      <select
                        id="industryType"
                        className="w-full h-12 px-4 text-sm bg-white rounded-none border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="construction">Construction</option>
                        <option value="real_estate">Real Estate Developer</option>
                        <option value="wholesale">Wholesale</option>
                        <option value="retail">Retail Hardware</option>
                        <option value="manufacturing">Manufacturing</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="tin"
                        className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider"
                      >
                        TIN (Tax ID)
                      </label>
                      <input
                        id="tin"
                        type="text"
                        placeholder="Enter TIN"
                        className="w-full h-12 px-4 text-sm rounded-none border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact & Delivery Section */}
              <section className="bg-white border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                  <span className="material-symbols-outlined text-primary">local_shipping</span>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">
                    Contact &amp; Delivery
                  </h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider"
                    >
                      Email Address (Read-only)
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      readOnly
                      className="w-full h-12 px-4 text-sm bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed rounded-none focus:ring-0 focus:border-slate-200"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider"
                    >
                      Phone Number
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm font-medium">
                        +234
                      </span>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="803 123 4567"
                        className="w-full h-12 px-4 text-sm rounded-none border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="deliveryAddress"
                      className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider"
                    >
                      Full Delivery Address
                    </label>
                    <textarea
                      id="deliveryAddress"
                      rows={3}
                      placeholder="Enter your default delivery address (e.g. Plot 12, Industrial Avenue...)"
                      className="w-full p-4 text-sm rounded-none border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-slate-300 resize-none"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Security Settings Section */}
            <section className="bg-white border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                <span className="material-symbols-outlined text-primary">security</span>
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">
                  Security Settings
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Password */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border border-slate-100 gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                      Account Password
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Last changed today • Standard Complexity
                    </p>
                  </div>
                  <button className="text-primary text-[10px] font-bold border border-primary px-6 py-2 uppercase tracking-widest hover:bg-primary hover:text-white transition-all w-full sm:w-auto text-center">
                    Update
                  </button>
                </div>

                {/* 2FA */}
                <div className="flex items-start sm:items-center justify-between p-6 border border-slate-100 gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                      Two-Factor Authentication
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Require an OTP code sent to your phone when logging in.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 sm:mt-0">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </section>

            {/* Account Utilities Footer */}
            <div className="pt-12 pb-8 border-t border-slate-200">
              <div className="flex flex-col items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-4 text-center">
                  Account Utilities
                </p>
                <button className="px-10 py-4 text-[10px] font-bold text-red-600 border border-red-200 bg-red-50/50 uppercase tracking-[0.2em] hover:bg-red-50 transition-colors">
                  Deactivate Wholesale Account
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === "Documents" && (
          <section className="bg-white border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
              <span className="material-symbols-outlined text-primary">folder_open</span>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">
                Documents
              </h2>
            </div>
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-400">
              <span className="material-symbols-outlined text-5xl">upload_file</span>
              <p className="text-sm font-bold uppercase tracking-widest">No documents uploaded yet</p>
              <button
                onClick={handleDocumentUpload}
                className="mt-2 bg-primary text-white text-xs font-bold px-8 py-3 uppercase tracking-widest hover:bg-orange-800 transition-colors"
              >
                Upload Document
              </button>
            </div>
          </section>
        )}

        {activeTab === "Billing" && (
          <section className="bg-white border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
              <span className="material-symbols-outlined text-primary">credit_card</span>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">
                Billing
              </h2>
            </div>
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-400">
              <span className="material-symbols-outlined text-5xl">receipt_long</span>
              <p className="text-sm font-bold uppercase tracking-widest">No billing information</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
