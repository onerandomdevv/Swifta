import { Metadata } from "next";
import { NotificationsSharedPage } from "@/components/notifications/notifications-page";

export const metadata: Metadata = {
  title: "Notifications | SwiftTrade Merchant",
  description: "View your recent activities and alerts.",
};

export default function MerchantNotificationsPage() {
  return (
    <div className="p-6 md:p-8 lg:p-10 min-h-screen">
      <NotificationsSharedPage role="merchant" />
    </div>
  );
}
