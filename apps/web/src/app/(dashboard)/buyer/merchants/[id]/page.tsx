"use client";

import React from "react";
import { useParams } from "next/navigation";
import { MerchantProfileView } from "@/components/merchant/merchant-profile-view";

export default function BuyerMerchantProfilePage() {
  const { id } = useParams();
  
  return <MerchantProfileView merchantId={id as string} />;
}
