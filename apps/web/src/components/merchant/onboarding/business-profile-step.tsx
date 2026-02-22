import React from "react";
import { OnboardingFormData } from "./types";

interface Props {
  formData: OnboardingFormData;
  updateForm: (updates: Partial<OnboardingFormData>) => void;
}

export function BusinessProfileStep({ formData, updateForm }: Props) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
          Business Profile
        </h3>
        <p className="text-slate-500 font-bold text-sm leading-relaxed">
          Tell us about your hardware business to help buyers trust your trades.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Trade Entity Name
          </label>
          <input
            value={formData.businessName}
            onChange={(e) => updateForm({ businessName: e.target.value })}
            className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white"
            placeholder="e.g. Lagos Tools & Machinery Ltd."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Business Type
            </label>
            <select
              value={formData.businessType}
              onChange={(e) => updateForm({ businessType: e.target.value })}
              className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all text-slate-400 appearance-none bg-transparent"
            >
              <option>Wholesale Distributor</option>
              <option>Retail Store</option>
              <option>Manufacturer</option>
              <option>Importer</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Establishment Year
            </label>
            <input
              value={formData.estYear}
              onChange={(e) => updateForm({ estYear: e.target.value })}
              className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all dark:text-white"
              placeholder="YYYY"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Primary Trade Category
          </label>
          <div className="flex flex-wrap gap-3">
            {[
              "Heavy Machinery",
              "Building Materials",
              "Power Tools",
              "Safety Gear",
            ].map((cat) => (
              <button
                key={cat}
                onClick={() => updateForm({ category: cat })}
                className={`px-6 py-3 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.category === cat ? "border-navy-dark bg-navy-dark text-white" : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-navy-dark hover:text-navy-dark"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
