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
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-navy-dark/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Order ID
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Order Date
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Amount
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Status
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300"
              >
                <td className="px-8 py-8">
                  <p className="text-sm font-black text-navy-dark dark:text-white uppercase leading-tight">
                    #{order.id.slice(0, 8)}
                  </p>
                </td>
                <td className="px-8 py-8">
                  <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-8 py-8">
                  <div className="text-sm font-black text-navy-dark dark:text-white tracking-tight">
                    <Money amount={BigInt(order.totalAmountKobo)} />
                  </div>
                </td>
                <td className="px-8 py-8">
                  <span
                    className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border h-7 ${
                      order.status === "PENDING_PAYMENT"
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : order.status === "PAID"
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : order.status === "DISPATCHED"
                            ? "bg-purple-50 text-purple-700 border-purple-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                    }`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-8 py-8 text-right">
                  <Link
                    href={`/merchant/orders/${order.id}`}
                    className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-navy-dark dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all active:scale-95 inline-block"
                  >
                    View Details
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
