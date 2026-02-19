'use client';

import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    toasts: Toast[];
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (type: ToastType, message: string) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            setToasts((prev) => [...prev, { id, type, message }]);
            setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
        },
        [dismiss],
    );

    const success = useCallback((msg: string) => addToast('success', msg), [addToast]);
    const error = useCallback((msg: string) => addToast('error', msg), [addToast]);
    const warning = useCallback((msg: string) => addToast('warning', msg), [addToast]);
    const info = useCallback((msg: string) => addToast('info', msg), [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, success, error, warning, info, dismiss }}>
            {children}
            {/* Toast container — bottom-right stack */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({
    toast,
    onDismiss,
}: {
    toast: Toast;
    onDismiss: (id: string) => void;
}) {
    const bgColor = {
        success: 'bg-green-50 border-green-400 text-green-800',
        error: 'bg-red-50 border-red-400 text-red-800',
        warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
        info: 'bg-blue-50 border-blue-400 text-blue-800',
    }[toast.type];

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-in ${bgColor}`}
            role="alert"
        >
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
                onClick={() => onDismiss(toast.id)}
                className="text-current opacity-60 hover:opacity-100 text-lg leading-none"
                aria-label="Dismiss"
            >
                ×
            </button>
        </div>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return ctx;
}
