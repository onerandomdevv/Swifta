"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getVerificationRequests, reviewVerificationRequest, VerificationRequestData } from "@/lib/api/admin.api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminVerificationQueuePage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<VerificationRequestData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Review Modal State
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequestData | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await getVerificationRequests({ status: "PENDING" });
      setRequests(Array.isArray(res) ? res : res.data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load verification requests");
    } finally {
      setLoading(false);
    }
  };

  const reviewMutation = useMutation({
    mutationFn: ({ id, dec, reason }: { id: string, dec: "APPROVED" | "REJECTED", reason?: string }) => 
      reviewVerificationRequest(id, { decision: dec, rejectionReason: reason }),
    onSuccess: () => {
      setSelectedRequest(null);
      setDecision(null);
      setRejectionReason("");
      fetchRequests(); // Reload list
    },
    onError: (err: any) => {
      alert(err?.message || "Failed to submit review");
    }
  });

  const handleReviewSubmit = () => {
    if (!selectedRequest || !decision) return;
    if (decision === "REJECTED" && !rejectionReason.trim()) {
      alert("Rejection reason is required");
      return;
    }
    
    reviewMutation.mutate({
      id: selectedRequest.id,
      dec: decision,
      reason: decision === "REJECTED" ? rejectionReason : undefined
    });
  };

  if (loading && requests.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
            Verification Queue
          </h1>
           <p className="text-slate-500 font-bold text-sm tracking-wide mt-1">
            Review merchant documents for tier upgrades.
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800">
          Pending: {requests.length}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-16 text-center shadow-sm">
           <div className="size-20 mx-auto bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-6">
            <span className="material-symbols-outlined text-4xl">inbox</span>
          </div>
          <h3 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-tight mb-2">
            No Pending Requests
          </h3>
          <p className="text-slate-500 font-medium">
            The verification queue is currently empty.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Merchant</th>
                  <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Submitted</th>
                  <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Target Tier</th>
                  <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-navy-dark dark:text-white capitalize">
                        {req.merchant?.businessName || req.merchantId}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">
                        Current: {req.merchant?.verificationTier}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }).format(new Date(req.createdAt))}
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider shadow-sm border",
                        req.targetTier === "TIER_3" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100"
                      )}>
                        {req.targetTier === "TIER_3" ? "Level 3: Business" : "Level 2: Identity"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(req);
                          setDecision(null);
                          setRejectionReason("");
                        }}
                        className="text-[10px] uppercase font-black tracking-widest bg-navy-dark text-white hover:bg-navy"
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-tight">
                Review {selectedRequest.targetTier === "TIER_3" ? "Business" : "Identity"} Verification
              </h2>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setDecision(null);
                  setRejectionReason("");
                }}
                className="size-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-8 max-h-[75vh] overflow-y-auto">
              {/* Merchant Context */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <div className="col-span-2 flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Business Information</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant Name</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 capitalize">
                    {selectedRequest.merchant?.businessName}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity Number (NIN)</p>
                   <p className="text-sm font-bold text-primary mt-1">
                    {selectedRequest.ninNumber || "Not Provided"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Upgrade</p>
                   <p className="text-sm font-bold text-emerald-600 mt-1 uppercase tracking-tight">
                    {selectedRequest.targetTier}
                  </p>
                </div>
                 <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</p>
                   <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1">
                    {selectedRequest.merchant?.user?.email}
                    <br/>
                    {selectedRequest.merchant?.user?.phone}
                  </p>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                  Verification Documents
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedRequest.governmentIdUrl && (
                    <DocumentLink 
                      url={selectedRequest.governmentIdUrl} 
                      label="Identity Document" 
                      subLabel={selectedRequest.idType} 
                      icon="badge"
                    />
                  )}
                  {selectedRequest.cacCertUrl && (
                    <DocumentLink 
                      url={selectedRequest.cacCertUrl} 
                      label="CAC Certificate" 
                      subLabel="Business Registration" 
                      icon="description"
                    />
                  )}
                  {selectedRequest.proofOfAddressUrl && (
                    <DocumentLink 
                      url={selectedRequest.proofOfAddressUrl} 
                      label="Proof of Address" 
                      subLabel="Utility Bill / Lease" 
                      icon="location_on"
                    />
                  )}
                </div>
              </div>

              {/* Decision */}
              <div className="space-y-4 pt-4">
                 <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                  Final Decision
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDecision("APPROVED")}
                    className={cn(
                      "p-5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-2",
                      decision === "APPROVED"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-md"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-200"
                    )}
                  >
                    <span className="material-symbols-outlined text-3xl">check_circle</span>
                    <span className="text-xs font-black uppercase tracking-widest">Approve Upgrade</span>
                  </button>
                   <button
                    onClick={() => setDecision("REJECTED")}
                    className={cn(
                      "p-5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-2",
                      decision === "REJECTED"
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 shadow-md"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-rose-200"
                    )}
                  >
                    <span className="material-symbols-outlined text-3xl">cancel</span>
                    <span className="text-xs font-black uppercase tracking-widest">Reject Request</span>
                  </button>
                </div>

                {decision === "REJECTED" && (
                  <div className="space-y-2 pt-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Reason for Rejection
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-rose-500 transition-all resize-none h-24"
                      placeholder="Explain what's missing or incorrect..."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRequest(null);
                  setDecision(null);
                  setRejectionReason("");
                }}
                className="text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-100"
              >
                Close
              </Button>
               <Button
                onClick={handleReviewSubmit}
                disabled={!decision || reviewMutation.isPending || (decision === "REJECTED" && !rejectionReason.trim())}
                className="text-xs font-black uppercase tracking-widest bg-navy-dark text-white hover:bg-navy rounded-xl px-8"
              >
                {reviewMutation.isPending ? "Processing..." : "Confirm Review"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentLink({ url, label, subLabel, icon }: { url: string, label: string, subLabel?: string, icon: string }) {
  // Protocol validation to prevent XSS (javascript: urls, etc.)
  const isSafeUrl = /^(https?|ipfs):\/\//i.test(url);

  return (
    <div className="flex items-center justify-between p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-background-secondary/50">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="size-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-slate-400 text-lg">{icon}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{label}</p>
          {subLabel && <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate">{subLabel}</p>}
        </div>
      </div>
      <a
        href={isSafeUrl ? url : "#"}
        target={isSafeUrl ? "_blank" : undefined}
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!isSafeUrl) {
            e.preventDefault();
            console.warn("Blocked potentially unsafe URL:", url);
          }
        }}
        className={cn(
          "size-9 rounded-lg flex items-center justify-center transition-all group shrink-0 ml-2",
          isSafeUrl 
            ? "hover:bg-primary/10 text-primary" 
            : "text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50"
        )}
        title={isSafeUrl ? "View Document" : "Unsafe or Invalid Link"}
      >
        <span className="material-symbols-outlined text-lg">open_in_new</span>
      </a>
    </div>
  );
}
