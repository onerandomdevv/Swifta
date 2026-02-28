import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    message: string;
    description?: string;
    icon?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export default function EmptyState({
    message,
    description,
    icon = 'inventory_2',
    actionLabel,
    onAction,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800",
            className
        )}>
            <div className="size-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-slate-300 text-3xl">{icon}</span>
            </div>
            <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">{message}</h3>
            {description && (
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight mt-2 max-w-xs">{description}</p>
            )}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="mt-8 px-8 py-4 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-light transition-all active:scale-95"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
