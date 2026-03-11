import React from "react";
import { type Category } from "@hardware-os/shared";

interface Props {
  category: Category & { productCount?: number };
  isSelected: boolean;
  onClick: () => void;
}

export function CategoryCard({ category: cat, isSelected, onClick }: Props) {
  const getIcon = (cat: Category) => {
    if (cat.icon) return cat.icon;
    const name = cat.name.toLowerCase();
    if (name.includes("electronic")) return "devices";
    if (name.includes("fashion") || name.includes("cloth")) return "apparel";
    if (name.includes("hardware") || name.includes("tool")) return "construction";
    if (name.includes("auto")) return "minor_crash";
    if (name.includes("food") || name.includes("grocery")) return "fastfood";
    if (name.includes("home")) return "home_appliance";
    if (name.includes("health") || name.includes("beauty")) return "medical_services";
    return "category";
  };

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center p-5 sm:p-7 rounded-[2rem] border-2 transition-all duration-500 min-w-[120px] sm:min-w-[150px] md:min-w-0 flex-shrink-0 ${
        isSelected
          ? "border-primary bg-primary/5 shadow-[0_10px_40px_-10px_rgba(255,102,0,0.2)] -translate-y-1 scale-[1.02]"
          : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-0.5"
      }`}
    >
      <div
        className={`size-12 sm:size-16 rounded-2xl sm:rounded-[1.25rem] flex items-center justify-center mb-3 sm:mb-5 transition-all duration-500 ${
          isSelected
            ? "bg-primary text-white rotate-[8deg] shadow-lg shadow-primary/30"
            : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-primary group-hover:scale-110"
        }`}
      >
        <span className="material-symbols-outlined text-2xl sm:text-3xl">
          {getIcon(cat)}
        </span>
      </div>
      <h3
        className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-center leading-tight px-1 transition-colors duration-300 ${
          isSelected ? "text-primary" : "text-slate-600 dark:text-slate-300 group-hover:text-navy-dark dark:group-hover:text-white"
        }`}
      >
        {cat.name}
      </h3>
      
      {isSelected && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full animate-in fade-in zoom-in duration-500" />
      )}
    </button>
  );
}
