import { PublicHeader } from "@/components/layout/public-header";
import { CategoryBar } from "@/components/layout/category-bar";
import { WhatsAppFab } from "@/components/shared/whatsapp-fab";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <CategoryBar />
      <main className="flex-1">
        {children}
      </main>
      <WhatsAppFab />
    </div>
  );
}
