"use client";

import { OrdersView } from "@/components/buyer/orders/orders-view";

export default function BuyerOrdersPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <main className="max-w-6xl mx-auto w-full px-4 lg:px-8 py-8">
        <OrdersView 
          title="My Orders"
          subtitle="Manage and track your recent purchases."
          orderDetailPrefix="/buyer/orders"
          catalogueHref="/buyer/catalogue"
        />
      </main>
    </div>
  );
}
