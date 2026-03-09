import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "@/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwiftTrade — Nigeria's WhatsApp E-Commerce Platform",
  description:
    "Buy and sell anything on WhatsApp with escrow payment protection. Verified merchants, tracked delivery, instant payouts.",
  manifest: "/manifest.json",
  openGraph: {
    title: "SwiftTrade — Nigeria's WhatsApp E-Commerce Platform",
    siteName: "SwiftTrade",
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
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Caveat:wght@400..700&family=Inter:wght@400;500;600;700;800;900&display=swap"
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
