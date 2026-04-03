"use client";

import { useState, useEffect, useCallback } from "react";
import { getOrder, confirmDelivery as apiConfirmDelivery, reportIssue as apiReportIssue } from "@/lib/api/order.api";
import { initializePayment } from "@/lib/api/payment.api";
import { type Order, type Review } from "@twizrr/shared";
import { getOrderReview } from "@/lib/api/review.api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useOrder(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);

  // States for Actions
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmingOtp, setConfirmingOtp] = useState("");

  const router = useRouter();

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOrder(orderId);
      const orderData = (data as any).data ? (data as any).data : data;
      setOrder(orderData as Order);

      if (orderData.status === "COMPLETED" || orderData.status === "DELIVERED") {
        try {
          const review = await getOrderReview(orderId);
          setExistingReview(review);
        } catch {
          setExistingReview(null);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId, fetchOrder]);

  const onPay = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const paymentData = await initializePayment({ orderId: order.id });
      if (paymentData.access_code) {
        const handler = (window as any).PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_x",
          access_code: paymentData.access_code,
          onClose: () => setPaying(false),
          callback: (response: any) => {
            router.push(`/buyer/orders/payment/callback?reference=${response.reference}`);
          },
        });
        handler.openIframe();
      } else if (paymentData.authorization_url) {
        window.location.href = paymentData.authorization_url;
      }
    } catch (err: any) {
      toast.error(err.message || "Payment initialization failed");
      setPaying(false);
    }
  };

  const onConfirmDelivery = async () => {
    if (!order || !confirmingOtp) return;
    setConfirming(true);
    try {
      const updated = await apiConfirmDelivery(order.id, confirmingOtp);
      setOrder((updated as any).data || updated);
      toast.success("Delivery confirmed");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm delivery");
    } finally {
      setConfirming(false);
    }
  };

  const reportIssue = async (reason: string) => {
    if (!order) return;
    try {
      const updated = await apiReportIssue(order.id, reason);
      setOrder((updated as any).data || updated);
      toast.success("Issue reported");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to report issue");
      throw err;
    }
  };

  return {
    order,
    loading,
    error,
    existingReview,
    paying,
    onPay,
    confirming,
    confirmingOtp,
    setConfirmingOtp,
    onConfirmDelivery,
    reportIssue,
    refresh: fetchOrder,
  };
}
