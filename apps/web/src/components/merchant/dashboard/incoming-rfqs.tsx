import Link from "next/link";

export function IncomingRfqs({ recentRfqs }: { recentRfqs: any[] }) {
  return (
    <div className="lg:col-span-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-navy-dark dark:text-white font-black">
            mail
          </span>
          <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
            Incoming RFQs
          </h3>
        </div>
        <Link
          href="/merchant/rfqs"
          className="text-[10px] font-black text-slate-400 hover:text-navy-dark dark:hover:text-white uppercase tracking-widest transition-colors"
        >
          View All Requests
        </Link>
      </div>

      {recentRfqs.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">
            inbox
          </span>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
            No RFQs yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentRfqs.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-navy-dark dark:text-white">
                    description
                  </span>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mb-1">
                    <h4 className="font-black text-navy-dark dark:text-white text-base uppercase tracking-tight">
                      RFQ #{rfq.id.slice(0, 8)}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest ${rfq.status === "OPEN" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}
                    >
                      {rfq.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                    Qty: {rfq.quantity} • {rfq.deliveryAddress}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {new Date(rfq.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/merchant/rfqs/${rfq.id}`}
                    className="size-12 rounded-2xl bg-navy-dark text-white flex items-center justify-center shadow-lg shadow-navy-dark/10 hover:bg-slate-800 transition-all active:scale-95"
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
