import Link from "next/link";

export function MerchantQuickActions() {
  return (
    <div className="lg:col-span-4 space-y-8">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-foreground font-black">
          warehouse
        </span>
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
          Quick Actions
        </h3>
      </div>

      <div className="bg-surface border border-border rounded-[2.5rem] p-8 shadow-sm space-y-4">
        <Link
          href="/merchant/inventory"
          className="w-full py-4 border-2 border-border-light rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-foreground transition-all hover:bg-background-secondary flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined text-lg">inventory_2</span>
          Manage Inventory
        </Link>
        <Link
          href="/merchant/orders"
          className="w-full py-4 border-2 border-border-light rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-foreground transition-all hover:bg-background-secondary flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined text-lg">
            local_shipping
          </span>
          View Orders
        </Link>
        <Link
          href="/merchant/products"
          className="w-full py-4 border-2 border-border-light rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-foreground transition-all hover:bg-background-secondary flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined text-lg">storefront</span>
          My Products
        </Link>
      </div>

      <div className="bg-gradient-to-br from-navy-dark to-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
        <div className="relative z-10 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
            Trading Tip
          </p>
          <h4 className="text-xl font-black leading-tight uppercase">
            Update your stock levels daily to rank higher in buyer searches.
          </h4>
        </div>
        <span className="material-symbols-outlined absolute -right-10 -bottom-10 text-[15rem] text-white/5 group-hover:scale-125 transition-transform duration-[2s] rotate-12">
          lightbulb
        </span>
      </div>
    </div>
  );
}
