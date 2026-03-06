import React from "react";
import Link from "next/link";
import { Money } from "@/components/ui/money";
import type { Order } from "@hardware-os/shared";

interface Props {
  orders: Order[];
}

export function MerchantOrdersTable({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-sm">
        <div className="size-24 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
          <span className="material-symbols-outlined text-4xl text-slate-200">
            inventory_2
          </span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
            No Orders Yet
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Orders will appear here when buyers accept your quotes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] w-full overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 dark:bg-slate-100">
              <th className="px-6 py-4 text-[10px] font-bold text-white dark:text-slate-900 uppercase tracking-widest border-r border-slate-800 dark:border-slate-200">
                Order ID
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-white dark:text-slate-900 uppercase tracking-widest border-r border-slate-800 dark:border-slate-200">
                Order Date
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-white dark:text-slate-900 uppercase tracking-widest border-r border-slate-800 dark:border-slate-200">
                Amount
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-white dark:text-slate-900 uppercase tracking-widest border-r border-slate-800 dark:border-slate-200">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-white dark:text-slate-900 uppercase tracking-widest text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-800">
            {orders?.map((order) => (
              <tr
                key={order.id}
                className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-6 py-5 border-r border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    ORD-{order.id.slice(0, 6)}
                  </p>
                </td>
                <td className="px-6 py-5 border-r border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-6 py-5 border-r border-slate-100 dark:border-slate-800">
                  <div className="text-sm font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                    <Money amount={BigInt(order.totalAmountKobo)} />
                  </div>
                </td>
                <td className="px-6 py-5 border-r border-slate-100 dark:border-slate-800">
                  <span
                    className={`inline-block px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${
                      order.status === "PENDING_PAYMENT"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : order.status === "PAID"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : order.status === "DISPATCHED"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <Link
                    href={`/merchant/orders/${order.id}`}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest hover:border-slate-900 dark:hover:border-slate-100 transition-colors inline-flex items-center gap-2"
                  >
                    <span>View</span>
                    <span className="material-symbols-outlined text-sm leading-none">
                      arrow_forward
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
