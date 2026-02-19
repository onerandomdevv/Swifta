'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-lg border px-3 py-2 text-sm',
            'bg-white text-gray-900 placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors duration-150',
            error ? 'border-danger' : 'border-border',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
