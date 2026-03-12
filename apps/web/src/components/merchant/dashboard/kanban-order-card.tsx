import React from "react";
import type { Order } from "@hardware-os/shared";

interface Props {
  order: Order;
  onAction: (orderId: string) => void;
}

export function KanbanOrderCard({ order, onAction }: Props) {
  if (!order) {
    return (
      <div className="border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-[1.5rem] p-10 flex flex-col items-center justify-center bg-slate-50/30 dark:bg-slate-900/10 min-h-[200px] group-hover:bg-slate-50/50 transition-all">
        <div className="size-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm mb-4">
          <span className="material-symbols-outlined text-slate-300 dark:text-slate-600">add</span>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Drop orders here</p>
      </div>
    );
  }

  const shortId = `#ORD-${order.id.slice(0, 4).toUpperCase()}`;
  // Prioritize product name from order object directly, then fallbacks
  const productName = order.product?.name || (order as any).quote?.product?.name || (order as any).rfq?.product?.name || "Premium Hardware Materials";
  // Safely access buyer name if populated by backend joins
  const buyerName = (order as any).buyer?.name || (order as any).quote?.rfq?.buyer?.name;
  const buyerInitial = buyerName?.slice(0, 2).toUpperCase() || order.buyerId?.slice(0, 2).toUpperCase() || "CU";
  const amount = Number(order.totalAmountKobo || 0) / 100;
  
  const CardWrapper = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-[1.5rem] shadow-sm hover:border-primary/50 dark:hover:border-primary/50 transition-all group active:scale-[0.98] relative overflow-hidden flex flex-col cursor-pointer ${className}`}
    >
      {children}
    </div>
  );

  // --- New Orders (PENDING_PAYMENT) ---
  if (order.status === "PENDING_PAYMENT") {
    return (
      <CardWrapper onClick={() => onAction(order.id)}>
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{shortId}</span>
          <span className="px-3 py-1 rounded bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-black uppercase tracking-widest border border-orange-100 dark:border-orange-500/20">Urgent</span>
        </div>
        <h4 className="text-sm font-black text-navy-dark dark:text-white mb-6 leading-tight tracking-tight line-clamp-2">{productName}</h4>
        <div className="flex items-center justify-between mt-auto">
          <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-500">
            {buyerInitial}
          </div>
          <span className="text-sm font-black text-navy-dark dark:text-white tabular-nums tracking-widest">₦{amount.toLocaleString()}</span>
        </div>
      </CardWrapper>
    );
  }

  // --- Awaiting Dispatch (PAID) ---
  if (order.status === "PAID") {
    return (
      <CardWrapper onClick={() => onAction(order.id)}>
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{shortId}</span>
          <span className="px-3 py-1 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">Ready</span>
        </div>
        <h4 className="text-sm font-black text-navy-dark dark:text-white mb-6 leading-tight tracking-tight line-clamp-2">{productName}</h4>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <span className="size-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Awaiting Truck</span>
          </div>
          <span className="text-sm font-black text-navy-dark dark:text-white tabular-nums tracking-widest">₦{amount.toLocaleString()}</span>
        </div>
      </CardWrapper>
    );
  }

  // --- On The Road (DISPATCHED) ---
  if (order.status === "DISPATCHED") {
    const transitId = order.id?.startsWith("ORD") ? order.id.replace("ORD", "TRK") : `#TRK-${order.id.slice(0, 4).toUpperCase()}`;
    const location = order.deliveryDetails?.state || "In Transit";

    return (
      <CardWrapper onClick={() => onAction(order.id)} className="bg-indigo-50/10 dark:bg-indigo-900/5 border-indigo-100/50 dark:border-indigo-900/30">
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{transitId}</span>
          <span className="px-3 py-1 rounded bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest">Transit</span>
        </div>
        <h4 className="text-sm font-black text-navy-dark dark:text-white mb-4 leading-tight tracking-tight line-clamp-2">{productName}</h4>
        
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4 border border-white/10">
          <div className="bg-indigo-500 h-full w-[45%] animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.5)]"></div>
        </div>

        <div className="flex items-baseline justify-between mt-auto">
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Location: {location}</span>
          <span className="text-sm font-black text-navy-dark dark:text-white tabular-nums tracking-widest">₦{amount.toLocaleString()}</span>
        </div>
      </CardWrapper>
    );
  }

  // --- Completed ---
  return (
    <CardWrapper onClick={() => onAction(order.id)} className="opacity-80">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{shortId}</span>
        <span className="px-3 py-1 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">Delivered</span>
      </div>
      <h4 className="text-sm font-black text-navy-dark dark:text-white mb-6 leading-tight tracking-tight line-clamp-2">{productName}</h4>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-emerald-500">task_alt</span>
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Cycle Complete</span>
        </div>
        <span className="text-sm font-black text-navy-dark dark:text-white tabular-nums tracking-widest">₦{amount.toLocaleString()}</span>
      </div>
    </CardWrapper>
  );
}
