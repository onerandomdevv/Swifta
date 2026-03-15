"use client";

import { CartView } from "@/components/buyer/cart/cart-view";

export default function BuyerCartPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <CartView 
        title="Your Cart" 
        catalogueHref="/buyer/catalogue" 
      />
    </div>
  );
}
