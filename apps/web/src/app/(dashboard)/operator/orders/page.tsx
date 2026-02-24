"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/button";

interface Order {
  id: string;
  status: string;
  totalAmountKobo: number;
  createdAt: string;
  buyer: { email: string; fullName: string | null };
  merchant: { businessName: string };
}

export default function OperatorOrdersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["admin", "orders"],
    queryFn: () => apiClient.get("/admin/orders"),
  });

  const resolveMutation = useMutation({
    mutationFn: (data: { orderId: string; status: string }) =>
      apiClient.patch(`/admin/orders/${data.orderId}/force-resolve`, {
        status: data.status,
      }),
    onSuccess: () => {
      toast.success("Order resolved.");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (err: any) =>
      toast.error(err?.message || "Failed to resolve order."),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-orange-500">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-navy-dark dark:text-white">
          Order Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          View and manage all platform orders. Force-resolve disputed orders.
        </p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">
            inbox
          </span>
          <p className="mt-4 text-slate-500 font-bold">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-navy-dark dark:text-white text-sm uppercase tracking-wider">
                      {order.id.slice(0, 8)}...
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {order.buyer.fullName || order.buyer.email} →{" "}
                    {order.merchant.businessName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ₦{(order.totalAmountKobo / 100).toLocaleString()} •{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold tracking-wider uppercase text-xs"
                    onClick={() =>
                      resolveMutation.mutate({
                        orderId: order.id,
                        status: "DELIVERED",
                      })
                    }
                    disabled={
                      resolveMutation.isPending ||
                      order.status === "DELIVERED" ||
                      order.status === "CANCELLED"
                    }
                  >
                    <span className="material-symbols-outlined text-[16px] mr-1">
                      gavel
                    </span>
                    Override
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
