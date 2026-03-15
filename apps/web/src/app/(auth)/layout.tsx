import { ReactNode } from 'react';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="bg-background min-h-screen flex flex-col font-display transition-colors duration-500">
            <header className="absolute top-4 right-4 z-50">
                <ThemeToggle />
            </header>
            <main className="flex-grow flex flex-col">
                {children}
            </main>
        </div>
    );
}
