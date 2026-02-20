import type { Metadata } from "next";
import Providers from "@/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hardware OS",
  description: "B2B Trade Platform for Construction Materials",
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-display">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
