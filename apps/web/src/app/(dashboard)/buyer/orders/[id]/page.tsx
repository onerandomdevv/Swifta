'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatKobo } from '@hardware-os/shared';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getOrder, confirmDelivery } from '@/lib/api/order.api';
import { initializePayment } from '@/lib/api/payment.api';
import type { Order } from '@hardware-os/shared';

export default function BuyerOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [paying, setPaying] = useState(false);
  const [confirmingOtp, setConfirmingOtp] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const data = await getOrder(id as string);
        setOrder(data as any as Order);
      } catch (err: any) {
        setError(err?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    setError(null);
    try {
      const result = await initializePayment({ orderId: order.id });
      const paymentData = result as any;
      if (paymentData.authorization_url) {
        window.location.href = paymentData.authorization_url;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize payment');
      setPaying(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order || !confirmingOtp) return;
    setConfirming(true);
    setError(null);
    try {
      const updated = await confirmDelivery(order.id, confirmingOtp);
      setOrder(updated as any as Order);
    } catch (err: any) {
      setError(err?.message || 'Failed to confirm delivery');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8"><Skeleton className="h-96 w-full rounded-[2.5rem]" /></div>
          <div className="lg:col-span-4"><Skeleton className="h-80 w-full rounded-[2.5rem]" /></div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">{error}</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Go Back</button>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => router.back()} className="size-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Order #{order.id.slice(0, 8)}</h1>
          </div>
          <p className="text-slate-500 font-bold text-sm tracking-wide ml-14">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <StatusBadge status={order.status} className="px-6 py-3 text-[10px] tracking-[0.2em]" />
      </div>

      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex gap-4">
          <span className="material-symbols-outlined text-red-500">error</span>
          <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Order Summary</h3>
            </div>

            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                  <p className="text-3xl font-black text-navy-dark dark:text-white tabular-nums">{formatKobo(BigInt(order.totalAmountKobo))}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivery Fee</p>
                  <p className="text-lg font-black text-navy-dark dark:text-white tabular-nums">{formatKobo(BigInt(order.deliveryFeeKobo))}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Currency</p>
                  <p className="text-sm font-black text-navy-dark dark:text-white">{order.currency}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Created</p>
                  <p className="text-sm font-black text-navy-dark dark:text-white">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery OTP Section - only show when dispatched */}
          {order.status === 'DISPATCHED' && order.deliveryOtp && (
            <div className="bg-navy-dark rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-navy-dark/20">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="space-y-4 text-center md:text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Security Verification</p>
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-tight max-w-sm">Provide this OTP to the rider upon delivery.</h3>
                </div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] text-center min-w-[240px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Delivery OTP</p>
                  <p className="text-5xl font-black tracking-widest">{order.deliveryOtp}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-10">
          {/* Pay Now - only for PENDING_PAYMENT */}
          {order.status === 'PENDING_PAYMENT' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-6">Payment Required</h3>
              <p className="text-xs font-bold text-slate-500 mb-8">Complete payment to process your order.</p>
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full py-5 bg-navy-dark text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-80"
              >
                {paying ? (
                  <>
                    <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Initializing Payment...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">payments</span>
                    Pay {formatKobo(BigInt(order.totalAmountKobo))}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Confirm Delivery - only for DISPATCHED */}
          {order.status === 'DISPATCHED' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-6">Confirm Delivery</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={confirmingOtp}
                  onChange={(e) => setConfirmingOtp(e.target.value)}
                  placeholder="Enter delivery OTP"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 px-6 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark transition-all text-center tracking-widest"
                />
                <button
                  onClick={handleConfirmDelivery}
                  disabled={confirming || !confirmingOtp}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {confirming ? 'Confirming...' : 'Confirm Receipt'}
                </button>
              </div>
            </div>
          )}

          {/* Order Info */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Reference</p>
              <p className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-widest break-all">{order.id}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quote Reference</p>
              <p className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-widest break-all">{order.quoteId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
