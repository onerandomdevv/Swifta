import React from "react";
import { type Category } from "@hardware-os/shared";

interface Props {
  category: Category & { productCount?: number };
  isSelected: boolean;
  onClick: () => void;
}

export function CategoryCard({ category, isSelected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all min-w-[140px] md:min-w-0 ${
        isSelected
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 -translate-y-1"
          : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md"
      }`}
    >
      <div
        className={`size-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
          isSelected
            ? "bg-primary text-white"
            : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-primary"
        }`}
      >
        <span className="material-symbols-outlined text-3xl">
          {category.icon || "category"}
        </span>
      </div>
      <h3
        className={`text-xs font-black uppercase tracking-widest text-center ${
          isSelected ? "text-primary" : "text-slate-600 dark:text-slate-300"
        }`}
      >
        {category.name}
      </h3>
      {category.productCount !== undefined && (
        <span className="text-[10px] font-bold text-slate-400 mt-1">
          {category.productCount} Products
        </span>
      )}
    </button>
  );
}
