"use client";

import { CartView } from "@/components/buyer/cart/cart-view";

export default function MerchantProcurementCartPage() {
  return (
    <div className="max-w-7xl mx-auto px-2 py-4">
      <CartView 
        title="Procurement Cart" 
        catalogueHref="/buyer/catalogue"
        isProcurement={true}
      />
    </div>
  );
}
