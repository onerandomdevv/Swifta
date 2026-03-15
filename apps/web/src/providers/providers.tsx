"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth-provider";
import { ToastProvider } from "./toast-provider";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 300 * 1000, // 5 minutes
            gcTime: 600 * 1000, // 10 minutes (v5)
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
