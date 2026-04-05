import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "@/providers/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://twizrr.com",
  ),
  title: "twizrr \u2014 Nigeria's Escrow-Protected Marketplace",
  description: "Buy and sell safely with escrow-protected payments. WhatsApp-native social commerce.",
  manifest: "/manifest.json",
  openGraph: {
    title: "twizrr \u2014 Nigeria's Escrow-Protected Marketplace",
    siteName: "twizrr",
    description: "Buy and sell safely with escrow-protected payments. WhatsApp-native social commerce.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
