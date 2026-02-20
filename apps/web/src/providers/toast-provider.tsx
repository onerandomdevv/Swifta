'use client';

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
    useEffect
} from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-dismiss after 5 seconds
        setTimeout(() => dismiss(id), 5000);
    }, [dismiss]);

    const success = (msg: string) => addToast(msg, 'success');
    const error = (msg: string) => addToast(msg, 'error');
    const warning = (msg: string) => addToast(msg, 'warning');
    const info = (msg: string) => addToast(msg, 'info');

    return (
        <ToastContext.Provider value={{ success, error, warning, info, dismiss }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md w-full sm:w-auto">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        onClick={() => dismiss(toast.id)}
                        className={`
              animate-slide-in p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800
              flex items-center justify-between cursor-pointer transition-all
              ${toast.type === 'success' ? 'bg-white text-green-600' : ''}
              ${toast.type === 'error' ? 'bg-white text-red-600' : ''}
              ${toast.type === 'warning' ? 'bg-white text-yellow-600' : ''}
              ${toast.type === 'info' ? 'bg-white text-blue-600' : ''}
            `}
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined">
                                {toast.type === 'success' && 'check_circle'}
                                {toast.type === 'error' && 'error'}
                                {toast.type === 'warning' && 'warning'}
                                {toast.type === 'info' && 'info'}
                            </span>
                            <p className="text-sm font-semibold">{toast.message}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 hover:text-slate-600">close</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
