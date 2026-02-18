import type { Metadata } from "next";
import Providers from "../providers/providers";
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
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
