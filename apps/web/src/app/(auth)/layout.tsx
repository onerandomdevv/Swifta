import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-[480px]">
                {/* Logo / Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-primary tracking-tight">
                        HARDWARE OS
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        B2B Trade Platform for Construction Materials
                    </p>
                </div>

                {/* Auth card content */}
                {children}
            </div>
        </div>
    );
}
