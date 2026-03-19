"use client";

import React, { useState, useEffect } from "react";

interface Props {
  selectedState: string;
  selectedLga: string;
  onStateChange: (state: string) => void;
  onLgaChange: (lga: string) => void;
}

export function StateLgaSelector({
  selectedState,
  selectedLga,
  onStateChange,
  onLgaChange,
}: Props) {
  const [states, setStates] = useState<string[]>([]);
  const [lgas, setLgas] = useState<string[]>([]);
  
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingLgas, setLoadingLgas] = useState(false);

  // Fetch States on mount
  useEffect(() => {
    let active = true;
    setLoadingStates(true);
    fetch("https://nga-states-lga.onrender.com/fetch")
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data)) {
          setStates(data);
        }
      })
      .catch((err) => console.error("Failed to load states:", err))
      .finally(() => {
        if (active) setLoadingStates(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Fetch LGAs when State changes
  useEffect(() => {
    let active = true;
    if (!selectedState) {
      setLgas([]);
      return;
    }

    setLoadingLgas(true);
    fetch(`https://nga-states-lga.onrender.com/?state=${encodeURIComponent(selectedState)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data)) {
          setLgas(data);
          // Auto clear LGA if current LGA isn't in new state's list
          if (selectedLga && !data.includes(selectedLga)) {
            onLgaChange("");
          }
        }
      })
      .catch((err) => console.error("Failed to load LGAs:", err))
      .finally(() => {
        if (active) setLoadingLgas(false);
      });

    return () => {
      active = false;
    };
  }, [selectedState, onLgaChange, selectedLga]);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* State Dropdown */}
      <div className="relative">
        <select
          value={selectedState}
          onChange={(e) => {
            onStateChange(e.target.value);
            onLgaChange(""); // Reset LGA upon new state selection
          }}
          className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 p-3 pl-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-navy-dark dark:text-white outline-none focus:border-primary transition-colors cursor-pointer"
          disabled={loadingStates}
        >
          <option value="" disabled>Select State</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 pointer-events-none">
          {loadingStates ? "sync" : "expand_more"}
        </span>
      </div>

      {/* LGA Dropdown */}
      <div className="relative">
        <select
          value={selectedLga}
          onChange={(e) => onLgaChange(e.target.value)}
          className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 p-3 pl-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-navy-dark dark:text-white outline-none focus:border-primary transition-colors cursor-pointer disabled:opacity-50"
          disabled={!selectedState || loadingLgas || lgas.length === 0}
        >
          <option value="" disabled>Select LGA</option>
          {lgas.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 pointer-events-none">
          {loadingLgas ? "sync" : "expand_more"}
        </span>
      </div>
    </div>
  );
}
