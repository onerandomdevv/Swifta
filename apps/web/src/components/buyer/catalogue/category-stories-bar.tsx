"use client";

import React, { useRef } from "react";
import { type Category } from "@hardware-os/shared";

interface Props {
  categories: Category[];
  activeCategory: string;
  onSelect: (slug: string) => void;
}

const ALL_CATEGORY: Category = {
  id: "all",
  name: "All",
  slug: "All Categories",
  icon: "grid_view",
  isActive: true,
  sortOrder: 0,
} as any;

export function CategoryStoriesBar({
  categories,
  activeCategory,
  onSelect,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const allCategories = [ALL_CATEGORY, ...categories];

  const getIcon = (cat: Category) => {
    if (cat.icon) return cat.icon;
    const name = cat.name.toLowerCase();
    if (name.includes("electronic") || name.includes("tech")) return "rebase_edit";
    if (name.includes("fashion") || name.includes("apparel") || name.includes("cloth")) return "apparel";
    if (name.includes("hardware") || name.includes("tool") || name.includes("construction")) return "home_repair_service";
    if (name.includes("auto") || name.includes("vehicle")) return "minor_crash";
    if (name.includes("food") || name.includes("grocery")) return "shopping_basket";
    if (name.includes("home") || name.includes("furniture")) return "inventory_2";
    if (name.includes("health") || name.includes("beauty")) return "health_and_safety";
    if (name.includes("general") || name.includes("machine")) return "settings_input_component";
    return "package_2";
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto pb-4 px-2 scroll-smooth no-scrollbar font-display">
      {allCategories.map((cat) => {
        const isActive =
          cat.slug === activeCategory ||
          (cat.slug === "All Categories" &&
            activeCategory === "All Categories");

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.slug)}
            className="flex flex-col items-center gap-2.5 group cursor-pointer min-w-max outline-none"
          >
            <div className={`size-14 rounded-full transition-all duration-200 ${isActive ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              <div className="size-full flex items-center justify-center">
                <span className={`material-symbols-outlined text-xl transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                  {getIcon(cat)}
                </span>
              </div>
            </div>
            <span className={`text-[10px] sm:text-[11px] uppercase tracking-wider transition-colors ${isActive ? 'text-primary font-black' : 'text-slate-400 font-bold group-hover:text-slate-600'}`}>
              {cat.name}
            </span>
          </button>
        );
      })}
      </div>
    </div>
  );
}
