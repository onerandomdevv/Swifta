"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  emptyMessage?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  className,
  disabled,
  emptyMessage = "No results found"
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Re-enable body scroll if modal closes
  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  return (
    <div className={cn("space-y-1.5 relative", className)} ref={wrapperRef}>
      {label && (
        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
          {label}
        </label>
      )}
      
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-navy-dark dark:text-white outline-none cursor-pointer flex justify-between items-center transition-all",
          isOpen && "ring-2 ring-primary/20 border-primary shadow-sm",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className={cn("truncate mr-2", !selectedOption && "text-slate-400 font-medium")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="material-symbols-outlined text-slate-400 transition-transform duration-300 shrink-0" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-[100] overflow-hidden flex flex-col max-h-80 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-navy-dark dark:text-white outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <div className="overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-between group",
                    value === option.value 
                      ? "bg-primary text-white" 
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  )}
                >
                  <span className="truncate mr-2">{option.label}</span>
                  {value === option.value && (
                    <span className="material-symbols-outlined text-sm shrink-0">check</span>
                  )}
                </button>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-slate-300 text-3xl">search_off</span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">
                  {emptyMessage}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
