import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display transition-colors duration-500">
            <main className="flex-grow flex flex-col">
                {children}
            </main>
        </div>
    );
}
