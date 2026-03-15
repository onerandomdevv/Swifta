import React from "react";
import type { Order } from "@hardware-os/shared";

interface Props {
  order: Order;
  onAction: (orderId: string) => void;
}

export function KanbanOrderCard({ order, onAction }: Props) {
  if (!order) {
    return (
      <div className="border-2 border-dashed border-border-light rounded-[1.5rem] p-10 flex flex-col items-center justify-center bg-background-secondary/30 min-h-[200px] group-hover:bg-background-secondary/50 transition-all">
        <div className="size-12 rounded-full bg-surface flex items-center justify-center border border-border shadow-sm mb-4">
          <span className="material-symbols-outlined text-foreground-muted">add</span>
        </div>
        <p className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.2em]">Drop orders here</p>
      </div>
    );
  }

  const shortId = `#ORD-${order.id.slice(0, 4).toUpperCase()}`;
  // Prioritize product name from order object directly
  const productName = order.product?.name || "Product";
  // Safely access buyer name if populated by backend joins
  const buyerName = (order as any).buyer?.name;
  const buyerInitial = buyerName?.slice(0, 2).toUpperCase() || order.buyerId?.slice(0, 2).toUpperCase() || "CU";
  const amount = Number(order.totalAmountKobo || 0) / 100;
  
  const CardWrapper = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <button 
      type="button"
      onClick={onClick}
      className={`appearance-none outline-none text-left w-full bg-surface border border-border p-5 rounded-[1.5rem] shadow-sm hover:border-primary/50 transition-all group active:scale-[0.98] relative overflow-hidden flex flex-col ${className}`}
    >
      {children}
    </button>
  );

  // --- New Orders (PENDING_PAYMENT) ---
  if (order.status === "PENDING_PAYMENT") {
    return (
      <CardWrapper onClick={() => onAction(order.id)}>
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-black text-foreground-muted/40 uppercase tracking-widest">{shortId}</span>
          <span className="px-3 py-1 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-black uppercase tracking-widest border border-orange-500/20">Urgent</span>
        </div>
        <h4 className="text-sm font-black text-foreground mb-6 leading-tight tracking-tight line-clamp-2">{productName}</h4>
        <div className="flex items-center justify-between mt-auto">
          <div className="size-8 rounded-full bg-background-secondary flex items-center justify-center border border-border text-[10px] font-black text-foreground-secondary">
            {buyerInitial}
          </div>
          <span className="text-sm font-black text-foreground tabular-nums tracking-widest">₦{amount.toLocaleString()}</span>
        </div>
      </CardWrapper>
    );
  }

  // --- Awaiting Dispatch (PAID) ---
  if (order.status === "PAID") {
    return (
      <CardWrapper onClick={() => onAction(order.id)}>
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-black text-foreground-muted/40 uppercase tracking-widest">{shortId}</span>
          <span className="px-3 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">Ready</span>
        </div>
        <h4 className="text-sm font-black text-foreground mb-6 leading-tight tracking-tight line-clamp-2">{productName}</h4>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <span className="size-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Ready to Ship</span>
          </div>
          <span className="text-sm font-black text-foreground tabular-nums tracking-widest">₦{amount.toLocaleString()}</span>
        </div>
      </CardWrapper>
    );
  }

  // --- On The Road (DISPATCHED) ---
  if (order.status === "DISPATCHED") {
    const transitId = order.id?.startsWith("ORD") ? order.id.replace("ORD", "TRK") : `#TRK-${order.id.slice(0, 4).toUpperCase()}`;
    const location = order.deliveryDetails?.state || "In Transit";

    return (
      <CardWrapper onClick={() => onAction(order.id)} className="bg-indigo-500/5 border-indigo-500/20 dark:border-indigo-900/30">
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-black text-indigo-500/60 uppercase tracking-widest">{transitId}</span>
          <span className="px-3 py-1 rounded bg-indigo-500 text-primary-foreground text-[9px] font-black uppercase tracking-widest">Transit</span>
        </div>
        <h4 className="text-sm font-black text-foreground mb-4 leading-tight tracking-tight line-clamp-2">{productName}</h4>
        
        <div className="w-full bg-background-secondary h-1.5 rounded-full overflow-hidden mb-4 border border-border/10">
          <div className="bg-indigo-500 h-full w-[45%] animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.5)]"></div>
        </div>

        <div className="flex items-baseline justify-between mt-auto">
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Location: {location}</span>
          <span className="text-sm font-black text-foreground tabular-nums tracking-widest">₦{amount.toLocaleString()}</span>
        </div>
      </CardWrapper>
    );
  }

  // --- Completed ---
  return (
    <CardWrapper onClick={() => onAction(order.id)} className="opacity-80">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-black text-foreground-muted/40 uppercase tracking-widest">{shortId}</span>
        <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">Delivered</span>
      </div>
      <h4 className="text-sm font-black text-foreground mb-6 leading-tight tracking-tight line-clamp-2">{productName}</h4>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-emerald-500">task_alt</span>
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Completed</span>
        </div>
        <span className="text-sm font-black text-foreground tabular-nums tracking-widest">₦{amount.toLocaleString()}</span>
      </div>
    </CardWrapper>
  );
}
