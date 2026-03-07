'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatKobo } from '@hardware-os/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { getOrder } from '@/lib/api/order.api';
import { initializePayment } from '@/lib/api/payment.api';
import { checkBnplEligibility, joinBnplWaitlist, type BnplEligibilityResponse } from '@/lib/api/bnpl.api';
import { useAuth } from '@/providers/auth-provider';
import type { Order } from '@hardware-os/shared';

function CheckoutBnplSection() {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<BnplEligibilityResponse | null>(null);
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkBnplEligibility().then(setEligibility).catch(console.error);
  }, []);

  if (!eligibility) return null;

  return (
    <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-indigo-400">payments</span>
        <h3 className="text-xs font-black uppercase text-slate-300 tracking-widest">Pay Later</h3>
        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Coming Soon</span>
      </div>

      {eligibility.eligible ? (
        <div className="space-y-3">
          <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
            💳 Pay Later — Coming Soon! You're pre-approved based on your order history.
          </p>
          {waitlistStatus === "success" ? (
             <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-2 rounded text-center">
               {message}
             </p>
          ) : waitlistStatus === "error" ? (
             <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-3 py-2 rounded text-center">
               {message}
             </p>
          ) : (
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                if (!user?.email) {
                  setWaitlistStatus("error");
                  setMessage("User email not found");
                  return;
                }
                setWaitlistStatus("loading");
                try {
                  const res = await joinBnplWaitlist();
                  setWaitlistStatus("success");
                  setMessage(res.message);
                } catch (err: any) {
                  setWaitlistStatus("error");
                  setMessage(err?.message || String(err) || "Failed to join waitlist");
                }
              }}
              disabled={waitlistStatus === "loading"}
              className="w-full py-3 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 rounded text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {waitlistStatus === "loading" ? "Processing..." : "Notify Me"}
            </button>
          )}
        </div>
      ) : (
        <div className="p-3 bg-slate-800/50 border border-slate-700 rounded opacity-60">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
            💳 Pay Later — Complete {eligibility.ordersNeeded} more orders to unlock
          </p>
        </div>
      )}
    </div>
  );
}

export default function RFQCheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [order, setOrder] = useState<Order | null>(null);

    useEffect(() => {
        async function fetchOrder() {
            if (!orderId) {
                setError('No order specified. Please accept a quote first.');
                setLoading(false);
                return;
            }
            try {
                const data = await getOrder(orderId);
                setOrder(data as any as Order);
            } catch (err: any) {
                setError(err?.message || 'Failed to load order');
            } finally {
                setLoading(false);
            }
        }
        fetchOrder();
    }, [orderId]);

    const handleCheckout = async () => {
        if (!order) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const result = await initializePayment({ orderId: order.id });
            const paymentData = result as any;
            if (paymentData.authorization_url) {
                window.location.href = paymentData.authorization_url;
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to initialize payment');
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-10 py-4 animate-in fade-in duration-500">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8"><Skeleton className="h-80 w-full rounded-[2.5rem]" /></div>
                    <div className="lg:col-span-4"><Skeleton className="h-[500px] w-full rounded-[2.5rem]" /></div>
                </div>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                <span className="material-symbols-outlined text-5xl text-red-400">error</span>
                <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">{error}</p>
                <button onClick={() => router.push('/buyer/orders')} className="px-6 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">View Orders</button>
            </div>
        );
    }

    if (!order) return null;

    const total = BigInt(order.totalAmountKobo);
    const deliveryFee = BigInt(order.deliveryFeeKobo);

    return (
        <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-6">
                <button onClick={() => router.back()} className="size-12 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Secure Checkout</h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Finalize payment for your order</p>
                </div>
            </div>

            {error && (
                <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex gap-4">
                    <span className="material-symbols-outlined text-red-500">error</span>
                    <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-10">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="material-symbols-outlined text-navy-dark dark:text-white font-black">payments</span>
                            <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Payment Method</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {[
                                { id: 'paystack', label: 'Online Payment', icon: 'credit_card', active: true },
                                { id: 'wallet', label: 'Vault Wallet', icon: 'account_balance_wallet', active: false },
                                { id: 'transfer', label: 'Bank Transfer', icon: 'account_balance', active: false },
                            ].map((method) => (
                                <button key={method.id} className={`p-6 rounded-[2rem] border-2 transition-all text-center space-y-3 ${method.active ? 'border-navy-dark bg-slate-50 dark:bg-slate-800' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 opacity-50 cursor-not-allowed'}`} disabled={!method.active}>
                                    <span className={`material-symbols-outlined text-3xl ${method.active ? 'text-navy-dark dark:text-white' : 'text-slate-300'}`}>{method.icon}</span>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${method.active ? 'text-navy-dark dark:text-white' : 'text-slate-400'}`}>{method.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm sticky top-10">
                        <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-10 pb-4 border-b border-slate-50 dark:border-slate-800">Order Summary</h3>

                        <div className="space-y-4 mb-10">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Order Total</span>
                                <span className="text-navy-dark dark:text-white">{formatKobo(total - deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Delivery Fee</span>
                                <span className="text-navy-dark dark:text-white">{formatKobo(deliveryFee)}</span>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50 dark:border-slate-800 mb-10">
                            <div className="flex justify-between items-end">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Final Total</p>
                                <p className="text-4xl font-black text-navy-dark dark:text-white tracking-tighter uppercase leading-none">{formatKobo(total)}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isSubmitting}
                            className={`w-full py-5 bg-navy-dark text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/20 flex items-center justify-center gap-3 transition-all relative overflow-hidden ${isSubmitting ? 'opacity-80 cursor-wait' : 'hover:scale-[1.02] active:scale-95'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Redirecting to Paystack...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">verified_user</span>
                                    Pay with Paystack
                                </>
                            )}
                        </button>

                        <p className="mt-8 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60 px-6 leading-relaxed">
                            By placing the order, you agree to our terms of escrow and hardware procurement standards.
                        </p>

                        <CheckoutBnplSection />
                    </div>
                </div>
            </div>
        </div>
    );
}
