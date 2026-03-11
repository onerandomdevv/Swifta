import React from "react";
import type { Order } from "@hardware-os/shared";

interface Props {
  order: Order;
  onAction: (orderId: string) => void;
}

export function KanbanOrderCard({ order, onAction }: Props) {
  const shortId = `#SW-${order.id.slice(0, 6).toUpperCase()}`;
  const productName = order.rfq?.product?.name || order.quote?.rfq?.product?.name || "Industrial Materials";
  const quantity = order.rfq?.quantity || order.quote?.rfq?.quantity || 0;
  const unit = order.rfq?.product?.unit || order.quote?.rfq?.product?.unit || "";
  const buyerName = order.buyerId.split("-")[0].toUpperCase();

  const CardWrapper = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group active:scale-[0.98] relative overflow-hidden flex flex-col gap-4 ${className}`}
    >
      {children}
    </div>
  );

  // --- Awaiting Dispatch (PAID) ---
  if (order.status === "PAID") {
    return (
      <CardWrapper className="border-primary/30 ring-1 ring-primary/5">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-mono text-primary font-black bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
            {shortId}
          </span>
          <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 font-black rounded-full uppercase tracking-widest">
            <span className="material-symbols-outlined text-[12px] animate-pulse">priority_high</span>
            Urgent Dispatch
          </span>
        </div>
        
        <div className="space-y-1">
          <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
            {quantity} {unit}{quantity !== 1 ? 's' : ''} of {productName}
          </h4>
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">person</span>
            Buyer ID: {buyerName}
          </div>
        </div>

        <div className="pt-2 mt-auto">
          <button
            className="w-full bg-primary text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            onClick={(e) => { e.stopPropagation(); onAction(order.id); }}
          >
            <span className="material-symbols-outlined text-sm">key</span>
            Generate Delivery OTP
          </button>
        </div>
      </CardWrapper>
    );
  }

  // --- In Transit (DISPATCHED) ---
  if (order.status === "DISPATCHED") {
    return (
      <CardWrapper onClick={() => onAction(order.id)} className="cursor-pointer">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-mono text-slate-400 font-bold">
            {shortId}
          </span>
          <div className="flex items-center gap-1 text-[9px] text-blue-500 font-black uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px] animate-bounce-horizontal">local_shipping</span>
            In Transit
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
            {quantity} {unit}{quantity !== 1 ? 's' : ''} of {productName}
          </h4>
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">person</span>
            Buyer: {buyerName}
          </div>
        </div>

        <div className="pt-2 mt-auto">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
            <div className="bg-blue-500 h-full w-[65%] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          </div>
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-1">
              <span className="size-1 bg-blue-400 rounded-full animate-ping" />
              Tracking
            </span>
            <span className="text-blue-500/80">65% Progress</span>
          </div>
        </div>
      </CardWrapper>
    );
  }

  // --- Completed / History ---
  return (
    <CardWrapper onClick={() => onAction(order.id)} className="cursor-pointer border-emerald-500/10 hover:border-emerald-500/30">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-mono text-slate-300 font-bold">
          {shortId}
        </span>
        <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 font-black rounded-full uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/50">
          <span className="material-symbols-outlined text-[12px]">verified</span>
          Settled
        </span>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight opacity-70">
          {quantity} {unit}{quantity !== 1 ? 's' : ''} of {productName}
        </h4>
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider">
          <span className="material-symbols-outlined text-[14px]">person</span>
          Buyer: {buyerName}
        </div>
      </div>
      
      <div className="mt-auto flex items-center justify-between">
        <span className="text-[10px] font-black text-emerald-600/50 uppercase tracking-widest">
          Payout Confirmed
        </span>
        <span className="material-symbols-outlined text-emerald-500/20 text-4xl -mb-4 -mr-2">check_circle</span>
      </div>
    </CardWrapper>
  );
}
