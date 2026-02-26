"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function StorefrontCustomizePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Local form state (not persisted in V1 — future backend endpoint)
  const [businessName, setBusinessName] = useState("Adamu Cement Supplies");
  const [biography, setBiography] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("Ojo (Alaba International)");
  const [phone, setPhone] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  const handleSave = () => {
    // V1: No backend endpoint for profile editing yet — placeholder
    alert("Storefront settings saved (local only in V1).");
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-10 py-5 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Storefront Customization
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Configure your public B2B digital presence
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/merchant/catalogue")}
            className="px-6 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Preview Storefront
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2.5 bg-primary text-white font-bold text-sm uppercase tracking-wider hover:bg-green-600 transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </header>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          {/* ═══════════ Section 1: Store Branding (Logo Only) ═══════════ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="material-symbols-outlined text-slate-400">
                palette
              </span>
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">
                Store Branding
              </h2>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">
                Store Logo
              </label>
              <div
                className="bg-slate-50 dark:bg-slate-800 h-48 w-48 flex flex-col items-center justify-center group cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                style={{ border: "2px dashed #cbd5e1" }}
              >
                <div className="w-20 h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-slate-200 dark:text-slate-600 text-4xl">
                    image
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">
                  Upload Square Logo
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════ Section 2: Business Identity ═══════════ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="material-symbols-outlined text-slate-400">
                badge
              </span>
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">
                Business Identity
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
                  placeholder="Enter formal business name"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">
                  Business Biography
                </label>
                <textarea
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  rows={4}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none text-slate-900 dark:text-white"
                  placeholder="Describe your business specialization, years in market, and supply capacity..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">
                    Lagos District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-slate-900 dark:text-white appearance-none"
                  >
                    <option>Ojo (Alaba International)</option>
                    <option>Lagos Island</option>
                    <option>Ikeja</option>
                    <option>Lekki/Ajah</option>
                    <option>Apapa</option>
                    <option>Oshodi</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════ Section 3: Trust & Contact ═══════════ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="material-symbols-outlined text-slate-400">
                verified_user
              </span>
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">
                Trust & Contact
              </h2>
            </div>

            <div className="space-y-8">
              {/* WhatsApp Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-green-600">
                    chat
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      WhatsApp Business Link
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Allow customers to start a chat directly from your
                      storefront
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                    whatsappEnabled
                      ? "bg-primary"
                      : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      whatsappEnabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Phone & Verification */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">
                    Public Contact Phone
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400 text-sm font-bold">
                      +234
                    </span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-14 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">
                    Verification Status
                  </label>
                  <div className="flex items-center gap-2 h-[46px] px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-primary text-sm">
                      verified
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                      Verified Industrial Merchant
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="h-12"></div>
        </div>
      </div>
    </div>
  );
}
