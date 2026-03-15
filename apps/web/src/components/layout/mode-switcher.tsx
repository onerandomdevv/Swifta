"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Mode = "MERCHANT" | "BUYER";

interface ModeSwitcherProps {
  onModeChange: (mode: Mode) => void;
  className?: string;
}

export function ModeSwitcher({ onModeChange, className }: ModeSwitcherProps) {
  const [mode, setMode] = useState<Mode>("MERCHANT");

  useEffect(() => {
    const savedMode = localStorage.getItem("Swifta_activeMode") as Mode;
    if (savedMode) {
      setMode(savedMode);
      onModeChange(savedMode);
    }
  }, [onModeChange]);

  const toggleMode = () => {
    const newMode = mode === "MERCHANT" ? "BUYER" : "MERCHANT";
    setMode(newMode);
    localStorage.setItem("Swifta_activeMode", newMode);
    onModeChange(newMode);
  };

  return (
    <div className={cn("bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center relative", className)}>
      <div 
        className={cn(
          "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-navy-dark rounded-xl shadow-sm transition-all duration-300 ease-out",
          mode === "MERCHANT" ? "left-1" : "left-[calc(50%+1px)]"
        )}
      />
      <button
        onClick={() => mode !== "MERCHANT" && toggleMode()}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 px-3 relative z-10 transition-colors duration-300",
          mode === "MERCHANT" ? "text-navy-dark dark:text-white" : "text-slate-400 hover:text-slate-600"
        )}
      >
        <span className="material-symbols-outlined text-lg">storefront</span>
        <span className="text-[10px] font-black uppercase tracking-widest">Merchant</span>
      </button>
      <button
        onClick={() => mode !== "BUYER" && toggleMode()}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 px-3 relative z-10 transition-colors duration-300",
          mode === "BUYER" ? "text-navy-dark dark:text-white" : "text-slate-400 hover:text-slate-600"
        )}
      >
        <span className="material-symbols-outlined text-lg">shopping_bag</span>
        <span className="text-[10px] font-black uppercase tracking-widest">Buyer</span>
      </button>
    </div>
  );
}
