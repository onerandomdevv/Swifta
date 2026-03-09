"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/ui/logo";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileDrawer({ isOpen, onClose, children }: MobileDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-dark/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div
        className={`absolute top-0 left-0 h-full w-[280px] bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-2xl transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <Logo variant="light" size="md" />
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-400 hover:text-navy-dark dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto" onClick={onClose}>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
