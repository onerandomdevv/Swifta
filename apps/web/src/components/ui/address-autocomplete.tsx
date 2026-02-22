import React, { useState, useEffect, useRef } from "react";
import { searchAddress, type LocationResult } from "@/lib/api/location.api";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  label,
}: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    // Only search if user typed something new and it has >3 chars
    if (query === value || query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await searchAddress(query);
      setResults(res);
      setIsOpen(true);
      setLoading(false);
    }, 600); // 600ms debounce to respect rate limits

    return () => clearTimeout(timer);
  }, [query, value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-3 relative" ref={wrapperRef}>
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value); // Sync incomplete changes to form state as well
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white h-32 resize-none"
          placeholder={placeholder}
        />
        {loading && (
          <span className="material-symbols-outlined absolute right-6 top-6 text-slate-300 animate-spin">
            progress_activity
          </span>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[1.5rem] shadow-xl z-50 overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-200">
          <div className="overflow-y-auto p-2">
            {results.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onClick={() => {
                  onChange(item.display_name);
                  setQuery(item.display_name);
                  setIsOpen(false);
                }}
                className="w-full text-left px-6 py-4 text-sm font-bold rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-start gap-4"
              >
                <span className="material-symbols-outlined text-slate-400 mt-0.5 text-xl shrink-0">
                  location_on
                </span>
                <span className="leading-relaxed line-clamp-3">
                  {item.display_name}
                </span>
              </button>
            ))}
          </div>

          <div className="px-6 py-3 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
            <span>Powered by OpenStreetMap</span>
            <span>Nigeria Only</span>
          </div>
        </div>
      )}
    </div>
  );
}
