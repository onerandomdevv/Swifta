import { Metadata } from "next";
import { MerchantDiscovery } from "@/components/buyer/merchants/merchant-discovery";

export const metadata: Metadata = {
  title: "Merchant Directory | Swifta",
  description: "Find and follow verified merchants.",
};

export default function MerchantDiscoveryPage() {
  return (
    <div className="p-6 md:p-8 lg:p-10 min-h-screen">
      <MerchantDiscovery />
    </div>
  );
}
