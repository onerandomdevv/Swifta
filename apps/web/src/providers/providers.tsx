'use client';

import { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { ToastProvider } from "./toast-provider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
