import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "@/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://swifta.store",
  ),
  title: "Swifta — Nigeria's WhatsApp E-Commerce Platform",
  /*
  ### Instant Checkout & Toast Fixes
  - **Redirection Delay:** Removed the 1.5s delay in `InstantCheckoutModal` that was causing browsers to block the Paystack redirect.
  - **Backend Optimizations:** Made `sendDirectOrderNotification` in `OrderService` non-blocking to prevent checkout timeouts.
  - **Fixed Toast Notifications:** Added the `sonner` `Toaster` component to the root `Providers`, resolving the issue where error/success messages were not appearing.

  ### Phone Number Input Validation
  - Implemented real-time numeric-only validation across all phone fields (Login, Register, Profile, Cart, Instant Checkout).
  */
  description:
    "Buy and sell anything on WhatsApp with escrow payment protection. Verified merchants, tracked delivery, instant payouts.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Swifta — Nigeria's WhatsApp E-Commerce Platform",
    siteName: "Swifta",
    description:
      "Buy and sell anything on WhatsApp with escrow payment protection. Verified merchants, tracked delivery, instant payouts.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Caveat:wght@400..700&family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-display">
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
