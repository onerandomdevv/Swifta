import React from "react";
import { OnboardingFormData } from "./types";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";

interface Props {
  formData: OnboardingFormData;
  updateForm: (updates: Partial<OnboardingFormData>) => void;
}

export function WarehouseStep({ formData, updateForm }: Props) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
          Warehouse Setup
        </h3>
        <p className="text-slate-500 font-bold text-sm leading-relaxed">
          Define your distribution point for logistics integration.
        </p>
      </div>

      <div className="space-y-8">
        <AddressAutocomplete
          label="Business Address"
          value={formData.businessAddress}
          onChange={(val) => updateForm({ businessAddress: val })}
          placeholder="Enter your registered business address..."
        />

        <AddressAutocomplete
          label="Warehouse Physical Address"
          value={formData.warehouseLocation}
          onChange={(val) => updateForm({ warehouseLocation: val })}
          placeholder="Enter warehouse street address in Lagos..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Distribution Hub
            </label>
            <select
              value={formData.distributionCenter}
              onChange={(e) =>
                updateForm({ distributionCenter: e.target.value })
              }
              className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all text-slate-400 appearance-none bg-transparent"
            >
              <option value="" disabled hidden>Select an LGA in Lagos</option>
              <option>Agege</option>
              <option>Ajeromi-Ifelodun</option>
              <option>Alimosho</option>
              <option>Amuwo-Odofin</option>
              <option>Apapa</option>
              <option>Badagry</option>
              <option>Epe</option>
              <option>Eti-Osa</option>
              <option>Ibeju-Lekki</option>
              <option>Ifako-Ijaiye</option>
              <option>Ikeja</option>
              <option>Ikorodu</option>
              <option>Kosofe</option>
              <option>Lagos Island</option>
              <option>Lagos Mainland</option>
              <option>Mushin</option>
              <option>Ojo</option>
              <option>Oshodi-Isolo</option>
              <option>Shomolu</option>
              <option>Surulere</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Storage Capacity
            </label>
            <select
              value={formData.warehouseCapacity}
              onChange={(e) =>
                updateForm({ warehouseCapacity: e.target.value })
              }
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
  );
}
