import { Metadata } from "next";
import { MerchantWalletDashboard } from "@/components/merchant/wallet/merchant-wallet-dashboard";

export const metadata: Metadata = {
  title: "Merchant Wallet | twizrr",
  description: "Manage your B2C earnings, payouts, and escrow funds.",
};

export default function MerchantWalletPage() {
  return (
    <div className="p-6 md:p-8 lg:p-10 min-h-screen">
      <MerchantWalletDashboard />
    </div>
  );
}
