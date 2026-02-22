import Link from "next/link";
import { ReactNode } from "react";

export function BuyerRecentActivity({ activities }: { activities: any[] }) {
  return (
    <div className="lg:col-span-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-navy-dark dark:text-white font-black">
            history
          </span>
          <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
            Recent Activity
          </h3>
        </div>
        <Link
          href="/buyer/orders"
          className="text-[10px] font-black text-slate-400 hover:text-navy-dark dark:hover:text-white uppercase tracking-widest transition-colors"
        >
          View All
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">
            inbox
          </span>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
            No recent activity
          </p>
        </div>
      ) : (
        <div className="relative pl-0 sm:pl-8 space-y-10">
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800 hidden sm:block"></div>

          {activities.map((activity, idx) => (
            <div key={idx} className="relative group">
              <div
                className={`absolute -left-[45px] top-0 size-8 rounded-full ${activity.bg} dark:bg-slate-900 border-2 border-white dark:border-slate-950 items-center justify-center z-10 group-hover:scale-110 transition-transform hidden sm:flex`}
              >
                <span
                  className={`material-symbols-outlined text-lg font-black ${activity.iconColor}`}
                >
                  {activity.icon}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 border border-slate-50 dark:border-slate-800 shadow-sm group-hover:shadow-xl transition-all">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                  <h4 className="font-black text-navy-dark dark:text-white text-sm uppercase tracking-widest">
                    {activity.title}
                  </h4>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {activity.time}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold leading-relaxed mb-6 uppercase tracking-tight opacity-80">
                  {activity.desc}
                </p>

                <Link
                  href={`/buyer/orders/${activity.orderId}`}
                  className="px-6 py-2.5 bg-navy-dark text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-navy-dark/10 active:scale-95 transition-all text-center inline-block"
                >
                  View Order
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
