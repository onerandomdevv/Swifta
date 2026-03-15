"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrder, addTracking, getTracking, downloadInvoice } from "@/lib/api/order.api";
import { type Order, OrderStatus } from "@swifta/shared";
import { formatKobo } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface TrackingEvent {
  id: string;
  orderId: string;
  toStatus: string;
  triggeredBy: string;
  metadata?: any;
  createdAt: string;
}

export default function MerchantOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [transitNote, setTransitNote] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        const [data, trackingData] = await Promise.all([
          getOrder(id as string),
          getTracking(id as string).catch(() => []),
        ]);
        const orderData = (data as any).data || data;
        const trackingList = (trackingData as any).data || trackingData;
        setOrder(orderData as Order);
        setTrackingEvents(Array.isArray(trackingList) ? trackingList : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  const trackingMutation = useMutation({
    mutationFn: ({ status, note }: { status: string; note?: string }) =>
      addTracking(order?.id as string, status as OrderStatus, note),
    onMutate: async ({ status }) => {
      await queryClient.cancelQueries({ queryKey: ["merchant", "orders"] });
      const previousOrder = { ...order };
      if (order) setOrder({ ...order, status: status as any });
      return { previousOrder };
    },
    onError: (err: any, _, context) => {
      setError(err?.message || `Failed to update status`);
      if (context?.previousOrder) setOrder(context.previousOrder as Order);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant", "orders"] });
    },
    onSuccess: (updated) => {
      const updatedOrder = (updated as any).data || updated;
      setOrder(updatedOrder as Order);
      getTracking(order?.id as string)
        .then((res) => {
          const list = (res as any).data || res;
          if (Array.isArray(list)) setTrackingEvents(list);
        })
        .catch(console.error);
      setTransitNote("");
    },
  });

  const handleUpdateStatus = (status: string, note?: string) => {
    if (!order) return;
    setError(null);
    trackingMutation.mutate({ status, note });
  };

  const isUpdating = trackingMutation.isPending;

  const handleDownloadInvoice = async () => {
    try {
      const blob = await downloadInvoice(order?.id as string);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${order?.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Failed to download invoice:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-slate-50 dark:bg-background-dark p-8 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Order Data...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="h-full bg-slate-50 dark:bg-background-dark p-8 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-red-500">terminal_error</span>
        </div>
        <div>
          <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">Order Error</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-1">{error}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-8 py-3 bg-navy-dark text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 shadow-lg shadow-navy-dark/20"
        >
          Return to Orders
        </button>
      </div>
    );
  }

  if (!order) return null;

  // totalAmountKobo already includes subtotal + platform fee + delivery fee
  const totalAmount = Number(order.totalAmountKobo);
  const escrowFee = Math.round((Number(order.totalAmountKobo) - Number(order.deliveryFeeKobo)) * 0.012);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-background-dark font-display text-navy-dark dark:text-slate-100 transition-colors duration-300">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navigation */}
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-navy-dark/80 px-8 py-4 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()}
                className="group flex items-center justify-center size-10 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-navy-dark dark:hover:text-white transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
              <div>
                <h2 className="text-navy-dark dark:text-white text-lg font-black tracking-tighter uppercase leading-none">
                  Swifta <span className="text-primary italic">Management</span>
                </h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Order Details View</p>
              </div>
            </div>
            <nav className="hidden lg:flex items-center gap-8">
              <Link href="/merchant/dashboard" className="text-slate-400 hover:text-primary text-[10px] font-black uppercase tracking-widest transition-colors">Dashboard</Link>
              <Link href="/merchant/orders" className="text-primary text-[10px] font-black uppercase tracking-widest border-b-2 border-primary pb-1">Orders</Link>
              <button className="text-slate-400 hover:text-primary text-[10px] font-black uppercase tracking-widest transition-colors">Inventory</button>
              <button className="text-slate-400 hover:text-primary text-[10px] font-black uppercase tracking-widest transition-colors">Analytics</button>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden xl:block">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                className="w-80 bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-12 pr-6 text-xs font-medium focus:ring-2 focus:ring-primary outline-none text-navy-dark dark:text-white" 
                placeholder="Search orders or IDs..."
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="size-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                <img alt="User Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQQpFp6iXZLYEEwP83hIA1GnOngtcA0mgbZL6du6OKe0SvLW91NRrWYNCB6mCFrOo_xwcjWcvUd-p93uu2iK-KPbhgNHtHR_SB3j1xTuQQ4wthJP5SQNltnSsBi_4EYxh2nVDd1BC3GlKi-7BY4Gxm0OPOujYkU3G86ByOHh4Y4rTb8fDERFPD_cafVC9ZTw9XBqprOoDQ_m88pYS9H7kg-QI-ABLR59M3IiXW4JxK6woU6VJJ2ogyHlJlVsn1yeeEc1RS0-rh0eod"/>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10">
          <div className="max-w-[1500px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-10">
            
            {/* Left Column: Lifecycle & Info */}
            <aside className="xl:col-span-4 flex flex-col gap-8">
              <div className="bg-white dark:bg-navy-dark border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex flex-col gap-2 mb-8">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Order ID</p>
                  <h3 className="text-navy-dark dark:text-white text-3xl font-black font-display tracking-tighter uppercase">
                    #{order.id.slice(0, 4).toUpperCase()}<span className="text-primary italic">-{order.id.slice(-4).toUpperCase()}</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse"></span> Payment Secured in Escrow
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl font-black">payments</span>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">Sales Value</p>
                      <p className="text-navy-dark dark:text-white text-2xl font-black tabular-nums tracking-tighter">
                        {formatKobo(totalAmount)}
                      </p>
                    </div>
                  </div>

                  <button className="w-full flex items-center gap-4 p-5 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent">
                    <span className="material-symbols-outlined text-slate-400 text-2xl">history</span>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 text-left flex-1">Customer History Profile</p>
                    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                  </button>

                  <button className="w-full flex items-center gap-4 p-5 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent text-left">
                    <span className="material-symbols-outlined text-slate-400 text-2xl">description</span>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 flex-1">General Sales Terms</p>
                    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                  </button>
                </div>

                <button 
                  onClick={() => router.push(`/merchant/orders/${order.id}/dispatch-slip`)}
                  className="w-full mt-10 py-5 bg-primary text-navy-dark rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-xl">local_shipping</span>
                  Generate Shipping Slip
                </button>
              </div>

              {/* Management Logs */}
              <div className="bg-white dark:bg-navy-dark border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-navy-dark dark:text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">history</span>
                    Order Timeline
                  </h3>
                  <div className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#00D084]"></div>
                </div>
                
                <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100 dark:before:bg-slate-800">
                  {trackingEvents.length > 0 ? (
                    trackingEvents.map((event, idx) => (
                      <div key={idx} className="relative pl-10">
                        <div className="absolute left-0 top-1.5 size-2 rounded-full bg-primary border-4 border-white dark:border-navy-dark ring-2 ring-primary/20 shadow-sm"></div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                          {new Date(event.createdAt).toLocaleTimeString("en-NG", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[11px] font-bold text-navy-dark dark:text-slate-200 leading-tight mt-1">{event.toStatus.replace(/_/g, " ")}</p>
                        {event.metadata?.note && (
                          <p className="text-[10px] text-slate-500 italic mt-1 font-medium">&quot;{event.metadata.note}&quot;</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-1.5 size-2 rounded-full bg-primary border-4 border-white dark:border-navy-dark shadow-sm"></div>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Placed</p>
                      <p className="text-[11px] font-bold text-navy-dark dark:text-slate-200 mt-1 uppercase">Order received</p>
                    </div>
                  )}
                  {/* Future Step Placeholder */}
                  <div className="relative pl-10 opacity-30">
                    <div className="absolute left-0 top-1.5 size-2 rounded-full bg-slate-300 border-4 border-white dark:border-navy-dark shadow-sm"></div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Future Event</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Pending Dispatch Commitment</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Column: Execution Terminal */}
            <div className="xl:col-span-8 flex flex-col gap-10">
              
              {/* Execution Timeline */}
              <section className="bg-white dark:bg-navy-dark border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 p-8 opacity-5">
                   <span className="material-symbols-outlined text-9xl">monitoring</span>
                </div>
                
                <div className="flex items-center justify-between mb-12 relative z-10">
                  <div>
                    <h2 className="text-navy-dark dark:text-white text-3xl font-black flex items-center gap-3 tracking-tighter uppercase font-display">
                      <span className="material-symbols-outlined text-primary text-3xl">local_shipping</span>
                      Order <span className="text-primary italic">Status</span>
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-2">Live tracking for this shipment</p>
                  </div>
                  <StatusBadge status={order.status} className="px-6 py-3 text-[10px] tracking-widest border-2" />
                </div>

                <div className="grid grid-cols-4 gap-4 relative">
                  {/* Progress Line Background */}
                  <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-100 dark:bg-slate-800 -z-0"></div>
                  <div 
                    className="absolute top-5 left-10 h-0.5 bg-primary transition-all duration-1000 -z-0"
                    style={{ 
                      width: 
                        order.status === OrderStatus.PAID ? '0%' :
                        order.status === OrderStatus.PREPARING ? '33%' :
                        order.status === OrderStatus.DISPATCHED ? '66%' :
                        (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.COMPLETED) ? '100%' : '0%'
                    }}
                  ></div>

                  {/* Steps */}
                  {[
                    { label: "Confirmed", status: OrderStatus.PAID, icon: "check_circle" },
                    { label: "Packaging", status: OrderStatus.PREPARING, icon: "package_2" },
                    { label: "In Transit", status: OrderStatus.DISPATCHED, icon: "local_shipping" },
                    { label: "Delivered", status: "COMPLETED", icon: "task_alt" }
                  ].map((step, idx) => {
                    const isCompleted = trackingEvents.some(e => e.toStatus === step.status) || (idx === 0);
                    const isActive = order.status === step.status;
                    
                    return (
                      <div key={idx} className="flex flex-col items-center text-center gap-4 z-10">
                        <div className={`size-12 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-navy-dark shadow-sm transition-all duration-500 ${
                          isCompleted ? 'bg-primary text-white' : 
                          isActive ? 'bg-primary/10 border-2 border-primary text-primary animate-pulse' : 
                          'bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-300'
                        }`}>
                          <span className="material-symbols-outlined text-xl">{step.icon}</span>
                        </div>
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${isCompleted || isActive ? 'text-navy-dark dark:text-white' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase opacity-60">
                            {isActive ? 'Processing' : isCompleted ? 'Validated' : 'Queued'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Action Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button 
                  onClick={() => handleUpdateStatus("PREPARING")}
                  disabled={order.status !== OrderStatus.PAID || isUpdating}
                  className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all group shadow-sm ${
                    order.status === OrderStatus.PAID 
                      ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' 
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="text-left">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${order.status === OrderStatus.PAID ? 'text-primary' : 'text-slate-400'}`}>Production</p>
                    <p className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-tight mt-1">Commit to Prep</p>
                  </div>
                  <span className={`material-symbols-outlined ${order.status === OrderStatus.PAID ? 'text-primary group-hover:translate-x-1' : 'text-slate-400'} transition-transform`}>
                    {order.status === OrderStatus.PAID ? 'arrow_forward' : 'lock'}
                  </span>
                </button>

                <button 
                  onClick={() => handleUpdateStatus("DISPATCHED")}
                  disabled={order.status !== OrderStatus.PREPARING || isUpdating}
                  className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all group shadow-sm ${
                    order.status === OrderStatus.PREPARING 
                      ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' 
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="text-left">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${order.status === OrderStatus.PREPARING ? 'text-primary' : 'text-slate-400'}`}>Logistics</p>
                    <p className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-tight mt-1">Authorize Dispatch</p>
                  </div>
                  <span className={`material-symbols-outlined ${order.status === OrderStatus.PREPARING ? 'text-primary group-hover:translate-x-1' : 'text-slate-400'} transition-transform`}>
                    {order.status === OrderStatus.PREPARING ? 'arrow_forward' : 'lock'}
                  </span>
                </button>

                <div className="bg-white dark:bg-navy-dark border border-slate-100 dark:border-slate-800 rounded-[2rem] p-3 flex items-center gap-2 shadow-sm">
                  <input 
                    type="text"
                    placeholder="Broadcast Broadcast..."
                    value={transitNote}
                    onChange={(e) => setTransitNote(e.target.value)}
                    disabled={order.status !== OrderStatus.DISPATCHED || isUpdating}
                    className="flex-1 bg-transparent border-none text-[11px] font-bold px-4 outline-none dark:text-white disabled:opacity-30"
                  />
                  <button 
                    onClick={() => handleUpdateStatus("IN_TRANSIT", transitNote)}
                    disabled={order.status !== OrderStatus.DISPATCHED || !transitNote || isUpdating}
                    className="size-12 bg-navy-dark dark:bg-slate-800 text-white rounded-2xl flex items-center justify-center hover:bg-primary transition-all disabled:opacity-30 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-xl">send</span>
                  </button>
                </div>
              </div>

              {/* Line Item Details Section */}
              <div className="bg-white dark:bg-navy-dark border border-slate-100 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div>
                    <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-[0.2em]">Order Details</h3>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">List of items purchased in this order</p>
                  </div>
                  <button 
                    onClick={handleDownloadInvoice}
                    className="text-[10px] font-black px-6 py-3 bg-white dark:bg-navy-dark border border-slate-200 dark:border-slate-800 text-navy-dark dark:text-white rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 uppercase tracking-widest transition-all"
                  >
                    Download Invoice
                  </button>
                </div>
                
                <div className="p-10">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                        <th className="pb-5 px-4 font-black">Item Name</th>
                        <th className="pb-5 px-4 text-center font-black">Quantity</th>
                        <th className="pb-5 px-4 text-right font-black">Unit Price</th>
                        <th className="pb-5 px-4 text-right font-black">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {/* Mapping for Cart Items, RFQ, or Direct Product */}
                      {(() => {
                        const items = [];
                        
                        // Case 1: Cart Checkout (Array in order.items)
                        if (Array.isArray((order as any).items)) {
                          items.push(...(order as any).items.map((item: any) => ({
                            name: item.name || "Hardware Item",
                            sku: `ST-${item.productId?.slice(0, 5) || "GEN"}-X`,
                            quantity: item.quantity,
                            unitPrice: item.unitPriceKobo,
                          })));
                        } 
                        // Case 2: Direct Order (Single product)
                        else if ((order as any).product) {
                          items.push({
                            name: (order as any).product.name,
                            sku: `ST-${(order as any).product.id.slice(0, 5)}-DIR`,
                            quantity: (order as any).quantity || 1,
                            unitPrice: (order as any).unitPriceKobo || (order as any).product.pricePerUnitKobo,
                          });
                        }

                        if (items.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="py-10 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                                No Procurement Records Found
                              </td>
                            </tr>
                          );
                        }

                        return items.map((item, idx) => (
                          <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                            <td className="py-6 px-4">
                              <div className="flex items-center gap-4">
                                <div className="size-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                                  <span className="material-symbols-outlined text-slate-300">inventory_2</span>
                                </div>
                                <div>
                                  <p className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-tight">{item.name}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">SKU: {item.sku}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-6 px-4 text-center">
                              <span className="text-xs font-black text-navy-dark dark:text-white tabular-nums tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                                {item.quantity.toString().padStart(2, '0')}
                              </span>
                            </td>
                            <td className="py-6 px-4 text-right">
                               <span className="text-xs font-black text-slate-500 dark:text-slate-400 tabular-nums">
                                  {formatKobo(item.unitPrice)}
                               </span>
                            </td>
                            <td className="py-6 px-4 text-right font-black text-navy-dark dark:text-white tabular-nums tracking-widest">
                              {formatKobo(Number(item.unitPrice) * Number(item.quantity))}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="pt-10 pb-2 px-4 text-right text-slate-400 font-black text-[9px] uppercase tracking-widest" colSpan={3}>Subtotal</td>
                        <td className="pt-10 pb-2 px-4 text-right font-black text-navy-dark dark:text-white tabular-nums">{formatKobo(order.totalAmountKobo)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-4 text-right text-slate-400 font-black text-[9px] uppercase tracking-widest" colSpan={3}>Shipping Fee</td>
                        <td className="py-1 px-4 text-right font-black text-navy-dark dark:text-white tabular-nums">{formatKobo(order.deliveryFeeKobo)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-4 text-right text-slate-400 font-black text-[9px] uppercase tracking-widest" colSpan={3}>Escrow Fee (1.2%)</td>
                        <td className="py-1 px-4 text-right font-black text-navy-dark dark:text-white tabular-nums">{formatKobo(escrowFee)}</td>
                      </tr>
                      <tr>
                        <td className="pt-8 pb-4 px-4 text-right text-navy-dark dark:text-white font-black uppercase text-[11px] tracking-[0.2em]" colSpan={3}>Total Payment</td>
                        <td className="pt-8 pb-4 px-4 text-right font-black text-primary text-3xl tabular-nums tracking-tighter">
                          {formatKobo(totalAmount + escrowFee)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Risk Assessment & Health */}
              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm relative overflow-hidden group">
                <div className="absolute left-0 top-0 size-40 bg-primary opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="size-24 rounded-full border-8 border-primary/20 bg-white dark:bg-navy-dark flex items-center justify-center shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-500">
                  <span className="text-3xl font-black text-primary">Safe</span>
                </div>
                <div className="flex-1 text-center md:text-left relative z-10">
                  <h4 className="font-black text-navy-dark dark:text-white uppercase tracking-[0.2em] text-lg">Order Security: <span className="text-primary italic">Verified</span></h4>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mt-2">
                    Payment is held securely in escrow and will only be released after the buyer confirms delivery. Our system ensures a safe trading environment for everyone.
                  </p>
                </div>
                <div className="flex gap-4 shrink-0 relative z-10">
                  <div className="px-8 py-4 bg-white dark:bg-navy-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Release Time</p>
                    <p className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-tight mt-1">Instant</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
