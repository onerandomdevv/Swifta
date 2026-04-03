"use client";

import React, { useState, useEffect } from "react";
import { getOrderSummary, getOrders } from "@/lib/api/order.api";
import { merchantApi } from "@/lib/api/merchant.api";
import type { Order, MerchantProfile } from "@twizrr/shared";
import { cn, formatKobo } from "@/lib/utils";
import { toast } from "sonner";

export function MerchantWalletDashboard() {
  const [summary, setSummary] = useState<{
    escrow: number | bigint;
    paidOut: number | bigint;
    pending: number | bigint;
    failed: number | bigint;
    orderCount: number;
  } | null>(null);
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryData, profileData, ordersData] = await Promise.all([
          getOrderSummary(),
          merchantApi.getProfile(),
          getOrders(1, 10)
        ]);
        setSummary(summaryData);
        setProfile(profileData);
        setOrders(ordersData);
      } catch (error) {
        console.error("Failed to fetch merchant wallet data:", error);
        toast.error("Could not load wallet details");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p className="text-xs font-bold text-foreground-muted uppercase tracking-widest">Calculating Earnings...</p>
      </div>
    );
  }

  // Escrow Locked: Money from buyers held until delivery confirmed
  const escrowLocked = summary ? Number(summary.escrow) : 0;
  // Net Earnings: Paid out + Pending
  const totalEarned = summary ? Number(summary.paidOut) + Number(summary.pending) : 0;
  // Available for Payout (Pending Payout in our DB usually means it's ready but not yet transferred)
  const availablePayout = summary ? Number(summary.pending) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-10 px-2 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight uppercase">Merchant Wallet</h2>
          <p className="text-xs text-foreground-muted mt-1 font-bold uppercase tracking-wider">Manage B2C Earnings & Escrow Funds</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
            disabled={availablePayout <= 0}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">payments</span>
            Request Payout
          </button>
        </div>
      </div>

      {/* Balance Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Earned */}
        <div className="bg-foreground rounded-xl p-8 border border-background/5 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-7xl text-background">monitoring</span>
          </div>
          <p className="text-[10px] font-bold text-background/60 uppercase tracking-widest mb-2">Total Life-time Earnings</p>
          <h3 className="text-4xl font-bold text-background tracking-tight">
            {formatKobo(totalEarned)}
          </h3>
          <div className="mt-8 flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary" />
            <span className="text-[10px] font-bold text-background/40 uppercase tracking-widest">Aggregated B2C Revenue</span>
          </div>
        </div>

        {/* Escrow Locked */}
        <div className="bg-surface rounded-xl p-8 border border-border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-7xl text-amber-500">security</span>
          </div>
          <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest mb-2">Locked in Escrow</p>
          <h3 className="text-4xl font-bold text-foreground tracking-tight">
            {formatKobo(escrowLocked)}
          </h3>
          <div className="mt-8 flex items-center gap-2">
            <div className="flex animate-pulse">
               <span className="size-2 rounded-full bg-amber-500" />
            </div>
            <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Pending Delivery Confirmed</span>
          </div>
        </div>

        {/* Payout Information */}
        <div className="bg-background-secondary/50 rounded-xl p-8 border border-border shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest mb-2">Settlement Account</p>
            {profile?.bankAccountNumber ? (
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground uppercase leading-tight">
                  {profile.settlementAccountName || "Settlement Account"}
                </h3>
                <p className="text-[10px] font-bold text-foreground-muted tracking-wider">
                  {profile.bankCode} • {profile.bankAccountNumber}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground-muted uppercase leading-tight italic">No Bank Account Linked</h3>
                <button className="text-[9px] font-bold text-primary uppercase underline">Setup Now</button>
              </div>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
            <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Available for Payout</span>
            <span className="text-sm font-bold text-foreground">{formatKobo(availablePayout)}</span>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Active Escrow Item History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">Escrow Details</h3>
            <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Recent B2C Payments</span>
          </div>

          <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
            {/* Mobile: Card View */}
            <div className="md:hidden divide-y divide-border">
              {orders.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-[10px] font-bold text-foreground-muted/40 uppercase tracking-widest">No order transactions found</p>
                </div>
              ) : (
                orders.map((order: any) => (
                  <div key={order.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground uppercase tracking-tight">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[10px] font-bold text-foreground-muted uppercase mt-0.5">{order.user?.firstName || "Customer"}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "size-1.5 rounded-full",
                        order.status === "COMPLETED" ? "bg-emerald-500" : order.status === "PAID" ? "bg-amber-500" : "bg-foreground-muted/30"
                      )} />
                      <span className="text-[9px] font-bold text-foreground-muted uppercase">{order.status}</span>
                    </div>
                    <span className="text-xs font-bold text-foreground tabular-nums">{formatKobo(order.totalAmountKobo)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Desktop: Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background-secondary/50 border-b border-border">
                    <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-foreground-muted">Order Ref</th>
                    <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-foreground-muted">Buyer</th>
                    <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-foreground-muted">Status</th>
                    <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-foreground-muted text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center">
                        <p className="text-[10px] font-bold text-foreground-muted/40 uppercase tracking-widest">No order transactions found</p>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-background-secondary transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-foreground uppercase tracking-tighter">#{order.id.slice(0, 8).toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-foreground-muted uppercase">{order.user?.firstName || "Customer"}</span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "size-1.5 rounded-full",
                                order.status === "COMPLETED" ? "bg-emerald-500" : order.status === "PAID" ? "bg-amber-500" : "bg-foreground-muted/30"
                              )} />
                              <span className="text-[10px] font-bold text-foreground-secondary uppercase tracking-wider">{order.status}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-bold text-foreground">
                            {formatKobo(order.totalAmountKobo)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Payout Quick Stats / Info */}
        <div className="space-y-8">
           <div className="bg-foreground rounded-xl p-6 text-background border border-background/5 shadow-lg">
              <h4 className="text-[10px] font-bold text-background/60 uppercase tracking-[0.2em] mb-4">Payout Schedule</h4>
              <div className="space-y-4">
                 <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">update</span>
                    <div>
                       <p className="text-[11px] font-bold uppercase tracking-tight">T+1 Settlement</p>
                       <p className="text-[9px] text-background/50 font-medium">Funds are available 24 hours after buyer confirms delivery.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-500 text-xl">verified_user</span>
                    <div>
                       <p className="text-[11px] font-bold uppercase tracking-tight">Escrow Secured</p>
                       <p className="text-[9px] text-background/50 font-medium">Full trade protection for both you and the buyer.</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-surface rounded-xl p-6 border border-border shadow-sm">
              <h4 className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] mb-4">Financial Support</h4>
              <p className="text-[11px] text-foreground-secondary font-medium mb-4 italic">Need help with settlements or trade reconciliation?</p>
              <button className="w-full py-2.5 rounded-xl border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-background-secondary transition-colors text-foreground">
                Contact Support
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
