"use client";

import React, { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  hideHeader?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  className,
  children,
  hideHeader,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Don't render anything on SSR
  const [mounted, setMounted] = React.useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div
        className="absolute inset-0 bg-navy-dark/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        className={cn(
          "relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-xl mx-4 overflow-hidden animate-in zoom-in-95 duration-300 transform transition-all",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
      >
        {!hideHeader && (
          <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div>
              {title && (
                <h3
                  id={titleId}
                  className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight leading-none"
                >
                  {title}
                </h3>
              )}
              {description && (
                <p
                  id={descriptionId}
                  className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium"
                >
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="size-10 flex items-center justify-center rounded-full text-slate-400 hover:text-navy-dark dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        )}
        <div className="max-h-[80vh] overflow-y-auto w-full inline-block">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
