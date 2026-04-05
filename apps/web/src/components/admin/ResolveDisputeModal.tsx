"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/button";

interface ResolveDisputeModalProps {
  orderId: string;
  onClose: () => void;
}

export function ResolveDisputeModal({ orderId, onClose }: ResolveDisputeModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [decision, setDecision] = useState<"BUYER" | "MERCHANT">("BUYER");
  const [notes, setNotes] = useState("");

  const resolveMutation = useMutation({
    mutationFn: (data: { decision: "BUYER" | "MERCHANT"; notes: string }) =>
      apiClient.post(`/admin/orders/${orderId}/resolve-dispute`, data),
    onSuccess: () => {
      toast.success(`Dispute resolved in favor of ${decision}.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to resolve dispute.");
    },
  });

  const handleResolve = () => {
    if (!notes.trim()) {
      toast.error("Please provide resolution notes for the audit trail.");
      return;
    }
    resolveMutation.mutate({ decision, notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl border-4 border-brand/20 animate-in zoom-in-95 duration-200">
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <span className="material-symbols-outlined font-black text-2xl">
                  gavel
                </span>
              </div>
              <div>
                <h2 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-widest">
                  Dispute Arbiter
                </h2>
                <p className="text-[10px] font-black text-slate-400 font-mono mt-0.5 tracking-tighter">
                  ORDER_REF: {orderId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Resolution Decision
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDecision("BUYER")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                    decision === "BUYER"
                      ? "bg-brand/5 border-brand text-brand shadow-lg shadow-brand/10"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                  }`}
                >
                  <span className="material-symbols-outlined text-3xl font-black">person</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Favor Buyer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDecision("MERCHANT")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                    decision === "MERCHANT"
                      ? "bg-neon-cyan/5 border-neon-cyan text-neon-cyan shadow-lg shadow-neon-cyan/10"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                  }`}
                >
                  <span className="material-symbols-outlined text-3xl font-black">storefront</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Favor Merchant</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Resolution Audit Notes
              </label>
              <textarea
                className="w-full h-32 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 font-bold text-navy-dark dark:text-white focus:border-brand focus:ring-0 outline-none transition-all placeholder:text-slate-300 resize-none"
                placeholder="Describe the reason for this decision (e.g., 'Evidence showed delivery was successful' or 'Merchant failed to provide tracking info')..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-100 dark:border-orange-800/30 p-5 rounded-2xl flex gap-4">
               <span className="material-symbols-outlined text-orange-500 font-black">warning</span>
               <p className="text-xs font-bold text-orange-800 dark:text-orange-300 leading-relaxed">
                  This action is permanent. Resolving for the <span className="underline italic text-orange-600 dark:text-orange-400">{decision}</span> will initiate an automated {decision === "BUYER" ? "Refund" : "Payout"} flow immediately.
               </p>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <Button
              variant="ghost"
              className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100"
              onClick={onClose}
              disabled={resolveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-[2] h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-navy-dark dark:bg-brand hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand/20 disabled:scale-100"
              onClick={handleResolve}
              disabled={resolveMutation.isPending}
            >
              {resolveMutation.isPending ? "Finalizing Arbitration..." : "Finalize Decision"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
