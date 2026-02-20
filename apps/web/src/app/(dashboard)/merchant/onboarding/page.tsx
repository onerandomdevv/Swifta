'use client';

import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';

export default function MerchantOnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'Wholesale Distributor',
    estYear: '',
    category: 'Power Tools',
    regNumber: '',
    taxId: '',
    warehouseLocation: '',
    warehouseCapacity: 'Medium',
    distributionCenter: 'Lagos Island'
  });

  const steps = [
    { id: 1, label: 'Business Profile', icon: 'store' },
    { id: 2, label: 'Identity & KYC', icon: 'badge' },
    { id: 3, label: 'Warehouse Setup', icon: 'inventory_2' },
    { id: 4, label: 'Review & Finish', icon: 'verified' },
  ];

  const handleContinue = () => {
    if (step < 4) {
      setLoading(true);
      setTimeout(() => {
        setStep(s => s + 1);
        setLoading(false);
      }, 600);
    } else {
      // Final submission logic
      setLoading(true);
      setTimeout(() => {
        window.location.href = '/merchant/dashboard';
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-10">
      {/* Branding Header */}
      <div className="mb-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="size-10 bg-navy-dark rounded-xl flex items-center justify-center text-white shadow-xl shadow-navy-dark/20 text-xl font-black">H</div>
          <span className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-[0.3em]">Hardware OS</span>
        </div>
        <h2 className="text-3xl font-black text-navy-dark dark:text-white uppercase tracking-tight">Merchant Onboarding</h2>
      </div>

      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-navy-dark/10 overflow-hidden flex flex-col md:flex-row min-h-[600px]">

        {/* Left Sidebar Stepper */}
        <aside className="w-full md:w-80 bg-navy-dark p-12 text-white space-y-12">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Progress</p>
            <h3 className="text-xl font-black uppercase tracking-tight">Onboarding <br /> Milestone</h3>
          </div>

          <div className="space-y-8 relative">
            <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-white/10"></div>
            {steps.map((s) => (
              <div key={s.id} className="relative z-10 flex items-center gap-4 group cursor-default">
                <div className={`size-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${step === s.id ? 'bg-white text-navy-dark border-white scale-110 shadow-xl shadow-white/20' : step > s.id ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-navy-dark border-white/20 text-white/40'}`}>
                  <span className="material-symbols-outlined text-xl font-black">
                    {step > s.id ? 'check' : s.icon}
                  </span>
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${step >= s.id ? 'text-white' : 'text-white/30'}`}>{s.label}</p>
                  {step === s.id && <p className="text-[9px] font-bold text-white/60 uppercase mt-1">In Progress</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-12 border-t border-white/10 space-y-4">
            <p className="text-[10px] font-bold text-white/40 uppercase leading-relaxed font-italic italic">
              "Verified merchants experience 3x faster trade completions."
            </p>
          </div>
        </aside>

        {/* Right Content Form */}
        <main className="flex-1 p-12 lg:p-16 space-y-10 flex flex-col">
          {loading ? (
            <div className="space-y-10 flex-1 flex flex-col animate-in fade-in duration-300">
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-8 flex-1">
                <Skeleton className="h-56 w-full rounded-3xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-10">
              {step === 1 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">Business Profile</h3>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed">Tell us about your hardware business to help buyers trust your trades.</p>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trade Entity Name</label>
                      <input
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white"
                        placeholder="e.g. Lagos Tools & Machinery Ltd."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Type</label>
                        <select
                          value={formData.businessType}
                          onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                          className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all text-slate-400 appearance-none bg-transparent"
                        >
                          <option>Wholesale Distributor</option>
                          <option>Retail Store</option>
                          <option>Manufacturer</option>
                          <option>Importer</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Establishment Year</label>
                        <input
                          value={formData.estYear}
                          onChange={(e) => setFormData({ ...formData, estYear: e.target.value })}
                          className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all dark:text-white"
                          placeholder="YYYY"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Trade Category</label>
                      <div className="flex flex-wrap gap-3">
                        {['Heavy Machinery', 'Building Materials', 'Power Tools', 'Safety Gear'].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setFormData({ ...formData, category: cat })}
                            className={`px-6 py-3 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.category === cat ? 'border-navy-dark bg-navy-dark text-white' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-navy-dark hover:text-navy-dark'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">Identity & KYC</h3>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed">Official business registration details for trust verification.</p>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CAC Registration Number</label>
                      <input
                        value={formData.regNumber}
                        onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                        className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white"
                        placeholder="RC-1234567"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tax Identification Number (TIN)</label>
                      <input
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white"
                        placeholder="23145678-0001"
                      />
                    </div>

                    <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] bg-slate-50/50 dark:bg-slate-950/50 group hover:border-navy-dark transition-all cursor-pointer">
                      <div className="flex flex-col items-center gap-4 py-4">
                        <div className="size-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-3xl text-slate-300 group-hover:text-navy-dark transition-colors">upload_file</span>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-navy-dark dark:text-white">Upload CAC Document</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">PDF, JPG or PNG (MAX. 5MB)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">Warehouse Setup</h3>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed">Define your distribution point for logistics integration.</p>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Warehouse Physical Address</label>
                      <textarea
                        value={formData.warehouseLocation}
                        onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                        className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white h-32 resize-none"
                        placeholder="Enter full street address in Lagos..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Distribution Hub</label>
                        <select
                          value={formData.distributionCenter}
                          onChange={(e) => setFormData({ ...formData, distributionCenter: e.target.value })}
                          className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all text-slate-400 appearance-none bg-transparent"
                        >
                          <option>Lagos Island</option>
                          <option>Ikeja Industrial</option>
                          <option>Lekki Free Zone</option>
                          <option>Apapa Wharf</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Storage Capacity</label>
                        <select
                          value={formData.warehouseCapacity}
                          onChange={(e) => setFormData({ ...formData, warehouseCapacity: e.target.value })}
                          className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all text-slate-400 appearance-none bg-transparent"
                        >
                          <option>Small (Under 500 sqm)</option>
                          <option>Medium (500 - 2000 sqm)</option>
                          <option>Large (2000+ sqm)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-[500px] pr-4">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">Review & Finish</h3>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed">Confirm your details before activation.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {[
                      { label: 'Business', val: formData.businessName || 'Not Provided', icon: 'store' },
                      { label: 'Type', val: formData.businessType, icon: 'category' },
                      { label: 'Registration', val: formData.regNumber || 'Pending', icon: 'badge' },
                      { label: 'Warehouse', val: formData.distributionCenter, icon: 'location_on' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-navy-dark dark:text-white">
                            <span className="material-symbols-outlined text-lg">{item.icon}</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                            <p className="text-sm font-black text-navy-dark dark:text-white uppercase mt-0.5">{item.val}</p>
                          </div>
                        </div>
                        <StatusBadge status="PENDING" />
                      </div>
                    ))}
                  </div>

                  <div className="p-8 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 rounded-[2rem] flex gap-5">
                    <span className="material-symbols-outlined text-emerald-500 scale-125">info</span>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 leading-relaxed uppercase tracking-wide">
                      Upon completion, your profile will enter internal review. You can still list products meanwhile.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-10 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center mt-auto">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1 || loading}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${step === 1 ? 'opacity-0' : 'text-slate-400 hover:text-navy-dark active:scale-95 disabled:opacity-30'}`}
            >
              Previous Step
            </button>

            <button
              onClick={handleContinue}
              disabled={loading}
              className="px-10 py-5 bg-navy-dark text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-navy-dark/30 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
            >
              {step === 4 ? 'Complete Registration' : 'Continue Step'}
            </button>
          </div>
        </main>
      </div>

      <div className="mt-12 flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-300 text-lg">lock</span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Secured 256-bit Encryption</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-300 text-lg">verified_user</span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identity Verified by KYC Lagos</span>
        </div>
      </div>
    </div>
  );
}
