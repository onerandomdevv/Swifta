"use client";

import React, { useState } from "react";
import { Input, InputProps } from "@/components/ui/input";

interface PasswordInputProps extends Omit<InputProps, "type"> {}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(({ className, value, onChange, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [localValue, setLocalValue] = useState(value || "");

  // Sync internal state if a controlled value is explicitly passed from outside
  React.useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  };

  // Ensure value is always a string for safety
  const strValue = String(value !== undefined ? value : localValue);

  const rules = [
    {
      id: "length",
      label: "At least 8 characters",
      test: (v: string) => v.length >= 8,
    },
    {
      id: "upper",
      label: "One uppercase letter",
      test: (v: string) => /[A-Z]/.test(v),
    },
    {
      id: "lower",
      label: "One lowercase letter",
      test: (v: string) => /[a-z]/.test(v),
    },
    { id: "number", label: "One number", test: (v: string) => /\d/.test(v) },
    {
      id: "special",
      label: "One special character",
      test: (v: string) => /[@$!%*?&#]/.test(v),
    },
  ];

  return (
    <div className="space-y-3 w-full">
      <div className="relative">
        <Input
          ref={ref}
          type={showPassword ? "text" : "password"}
          value={value !== undefined ? value : localValue}
          onChange={handleChange}
          className={`pr-10 ${className || ""}`}
          {...props}
        />
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          <span className="material-symbols-outlined text-[20px]">
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>

      {/* Strength Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {rules.map((rule) => {
          const isMet = rule.test(strValue);
          return (
            <div
              key={rule.id}
              className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                isMet
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <div
                className={`flex items-center justify-center size-4 rounded-full border transition-all ${
                  isMet
                    ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-900/30 dark:border-emerald-500"
                    : "bg-transparent border-slate-300 dark:border-slate-700"
                }`}
              >
                {isMet && (
                  <span className="material-symbols-outlined text-[10px] font-bold">
                    check
                  </span>
                )}
              </div>
              {rule.label}
            </div>
          );
        })}
      </div>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";
