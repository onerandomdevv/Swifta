import React from "react";
import Link from "next/link";
import { Money } from "@/components/ui/money";
import type { Order } from "@twizrr/shared";

interface Props {
  orders: Order[];
}

export function MerchantOrdersTable({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-surface border border-border rounded-[3rem] shadow-sm">
        <div className="size-24 rounded-[2rem] bg-background-secondary flex items-center justify-center border border-border-light">
          <span className="material-symbols-outlined text-4xl text-border">
            inventory_2
          </span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
            No Orders Yet
          </h3>
          <p className="text-[10px] font-black text-foreground-muted uppercase tracking-widest">
            Your orders will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] w-full overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-foreground">
              <th className="px-6 py-4 text-[10px] font-bold text-background uppercase tracking-widest border-r border-background/20">
                Order ID
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-background uppercase tracking-widest border-r border-background/20">
                Order Date
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-background uppercase tracking-widest border-r border-background/20">
                Amount
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-background uppercase tracking-widest border-r border-background/20">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-background uppercase tracking-widest text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-border">
            {orders?.map((order) => (
              <tr
                key={order.id}
                className="group hover:bg-background-secondary/50 transition-colors"
              >
                <td className="px-6 py-5 border-r border-border">
                  <p className="text-sm font-black text-foreground uppercase tracking-tight">
                    ORD-{order.id.slice(0, 6)}
                  </p>
                </td>
                <td className="px-6 py-5 border-r border-border">
                  <p className="text-xs font-bold text-foreground-muted uppercase tracking-widest">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-6 py-5 border-r border-border">
                  <div className="text-sm font-black text-foreground tracking-tight tabular-nums">
                    <Money amount={BigInt(order.totalAmountKobo)} />
                  </div>
                </td>
                <td className="px-6 py-5 border-r border-border">
                  <span
                    className={`inline-block px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${
                      order.status === "PENDING_PAYMENT"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : order.status === "PAID"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : order.status === "DISPATCHED"
                            ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    }`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <Link
                    href={`/merchant/orders/${order.id}`}
                    className="px-4 py-2 bg-background-secondary border-2 border-border text-foreground text-[10px] font-black uppercase tracking-widest hover:border-foreground transition-colors inline-flex items-center gap-2"
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
