import Link from "next/link";

export function IncomingRfqs({ recentRfqs }: { recentRfqs: any[] }) {
  return (
    <div className="lg:col-span-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-foreground font-black">
            mail
          </span>
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
            Incoming RFQs
          </h3>
        </div>
        <Link
          href="/merchant/rfqs"
          className="text-[10px] font-black text-foreground-muted hover:text-foreground uppercase tracking-widest transition-colors"
        >
          View All Requests
        </Link>
      </div>

      {recentRfqs.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-border mb-4">
            inbox
          </span>
          <p className="text-foreground-muted font-bold text-sm uppercase tracking-widest">
            No RFQs yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentRfqs?.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-surface border border-border rounded-[2rem] p-6 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="size-16 rounded-3xl bg-background-secondary flex items-center justify-center border border-border-light shadow-inner group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-foreground">
                    description
                  </span>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mb-1">
                    <h4 className="font-black text-foreground text-base uppercase tracking-tight">
                      RFQ #{rfq.id.slice(0, 8)}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest ${rfq.status === "OPEN" ? "bg-primary text-primary-foreground" : "bg-background-secondary text-foreground-muted"}`}
                    >
                      {rfq.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-secondary font-bold uppercase tracking-tight">
                    Qty: {rfq.quantity} • {rfq.deliveryAddress}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-foreground-muted uppercase tracking-widest mb-1">
                      {new Date(rfq.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/merchant/rfqs/${rfq.id}`}
                    className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/10 hover:bg-primary-hover transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
