"use client";

import { OrdersView } from "@/components/buyer/orders/orders-view";

export default function MerchantProcurementOrdersPage() {
  return (
    <div className="max-w-7xl mx-auto px-2 py-4">
      <OrdersView 
        title="Procurement Orders"
        subtitle="Manage and track your supplies and stock restock manifests."
        orderDetailPrefix="/merchant/orders" // Keep it simple or use a new route later
        catalogueHref="/buyer/catalogue"
      />
    </div>
  );
}
