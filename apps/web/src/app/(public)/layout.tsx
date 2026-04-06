import { PublicHeader } from "@/components/layout/public-header";
import { CategoryBar } from "@/components/layout/category-bar";
import { WhatsAppFab } from "@/components/shared/whatsapp-fab";
import { Suspense } from "react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-16 md:h-20 bg-background" />}>
        <PublicHeader />
      </Suspense>
      <Suspense fallback={<div className="h-14 bg-background" />}>
        <CategoryBar />
      </Suspense>
      <main className="flex-1">
        {children}
      </main>
      <WhatsAppFab />
    </div>
  );
}
