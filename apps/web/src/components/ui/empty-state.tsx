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
            "flex flex-col items-center justify-center p-12 text-center bg-surface rounded-[2rem] border-2 border-dashed border-border-light",
            className
        )}>
            <div className="size-16 rounded-2xl bg-background-secondary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-foreground-muted text-3xl">{icon}</span>
            </div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{message}</h3>
            {description && (
                <p className="text-[11px] text-foreground-muted font-bold uppercase tracking-tight mt-2 max-w-xs">{description}</p>
            )}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="mt-8 px-8 py-4 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
