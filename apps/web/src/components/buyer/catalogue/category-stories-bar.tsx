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
    <section className="space-y-3">
      {/* Stories Row */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 scroll-smooth no-scrollbar px-1"
      >
        {allCategories.map((cat) => {
          const isActive =
            cat.slug === activeCategory ||
            (cat.slug === "All Categories" &&
              activeCategory === "All Categories");

          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.slug)}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              {/* Circle with gradient ring - Command Center Style */}
              <div
                className={`size-16 sm:size-20 rounded-full p-[2.5px] transition-all duration-500 ${
                  isActive
                    ? "bg-gradient-to-br from-primary via-blue-400 to-primary-dark shadow-[0_0_25px_rgba(59,130,246,0.4)] scale-110"
                    : "bg-slate-200 dark:bg-slate-800 group-hover:bg-primary/50"
                }`}
              >
                <div
                  className={`size-full rounded-full flex items-center justify-center transition-all duration-500 ${
                    isActive
                      ? "bg-navy-dark"
                      : "bg-white dark:bg-slate-900 group-hover:scale-95"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-2xl sm:text-3xl transition-all duration-500 ${
                      isActive
                        ? "text-white scale-110 rotate-[10deg]"
                        : "text-slate-500 dark:text-slate-400 group-hover:text-primary"
                    }`}
                  >
                    {getIcon(cat)}
                  </span>
                </div>
              </div>

              {/* Label */}
              <span
                className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center leading-tight max-w-[60px] sm:max-w-[70px] line-clamp-1 transition-colors ${
                  isActive
                    ? "text-primary font-black"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Subcategory Chips */}
      {categories.find(
        (c) =>
          c.slug === activeCategory ||
          c.children?.some((sc) => sc.slug === activeCategory),
      ) && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {categories
            .find(
              (c) =>
                c.slug === activeCategory ||
                c.children?.some((sc) => sc.slug === activeCategory),
            )
            ?.children?.map((sub) => (
              <button
                key={sub.id}
                onClick={() => onSelect(sub.slug)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  activeCategory === sub.slug
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary"
                }`}
              >
                {sub.name}
              </button>
            ))}
        </div>
      )}
    </section>
  );
}
