"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getVerificationRequests, reviewVerificationRequest } from "@/lib/api/admin.api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";


export default function AdminVerificationQueuePage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Review Modal State
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
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
                  <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tier</th>
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
                      <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
                        CAC: {req.merchant?.cacNumber || "N/A"}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }).format(new Date(req.createdAt))}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-black uppercase tracking-wider">
                        {req.merchant?.verificationTier || "UNVERIFIED"}
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
                Review Verification Request
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
            
            <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Merchant Context */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant Name</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 capitalize">
                    {selectedRequest.merchant?.businessName}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Tier</p>
                   <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {selectedRequest.merchant?.verificationTier || "UNVERIFIED"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deals Closed</p>
                   <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {selectedRequest.merchant?.dealsClosed || 0}
                  </p>
                </div>
                 <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dispute Rate</p>
                   <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {selectedRequest.merchant?.disputeRate || 0}%
                  </p>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                  Submitted Documents
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400">badge</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">Government ID</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase">{selectedRequest.idType}</p>
                      </div>
                    </div>
                    {(() => {
                      const isValidDocumentUrl = (url?: string): boolean => {
                        if (!url) return false;
                        try {
                          const parsed = new URL(url);
                          return (
                            parsed.protocol === "https:" &&
                            (parsed.hostname === "cloudinary.com" ||
                              parsed.hostname.endsWith(".cloudinary.com"))
                          );
                        } catch {
                          return false;
                        }
                      };
                      return isValidDocumentUrl(selectedRequest.governmentIdUrl) ? (
                      <a
                        href={selectedRequest.governmentIdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-black text-primary hover:underline uppercase tracking-widest"
                      >
                        View Document
                      </a>
                    ) : (
                      <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Invalid URL</span>
                    );
                    })()}
                  </div>

                  {selectedRequest.cacCertUrl && (
                    <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400">description</span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">CAC Certificate</p>
                           <p className="text-[10px] text-slate-500 font-medium uppercase">Optional but recommended</p>
                        </div>
                      </div>
                      {(() => {
                        const isValidDocumentUrl = (url?: string): boolean => {
                          if (!url) return false;
                          try {
                            const parsed = new URL(url);
                            return (
                              parsed.protocol === "https:" &&
                              (parsed.hostname === "cloudinary.com" ||
                                parsed.hostname.endsWith(".cloudinary.com"))
                            );
                          } catch {
                            return false;
                          }
                        };
                        return isValidDocumentUrl(selectedRequest.cacCertUrl) ? (
                        <a
                          href={selectedRequest.cacCertUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-black text-primary hover:underline uppercase tracking-widest"
                        >
                          View Document
                        </a>
                      ) : (
                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Invalid URL</span>
                      );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Decision */}
              <div className="space-y-4">
                 <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                  Admin Decision
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDecision("APPROVED")}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      decision === "APPROVED"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-green-200"
                    }`}
                  >
                    <span className="material-symbols-outlined block text-3xl mb-2">check_circle</span>
                    <span className="text-xs font-black uppercase tracking-widest">Approve</span>
                  </button>
                   <button
                    onClick={() => setDecision("REJECTED")}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      decision === "REJECTED"
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-red-200"
                    }`}
                  >
                    <span className="material-symbols-outlined block text-3xl mb-2">cancel</span>
                    <span className="text-xs font-black uppercase tracking-widest">Reject</span>
                  </button>
                </div>

                {decision === "REJECTED" && (
                  <div className="space-y-2 pt-4 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Rejection Reason (Required)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-red-500 transition-all resize-none h-24"
                      placeholder="e.g. ID document is blurry, please re-upload a clearer image."
                      required
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
                className="text-xs font-black uppercase tracking-widest"
              >
                Cancel
              </Button>
               <Button
                onClick={handleReviewSubmit}
                disabled={!decision || reviewMutation.isPending || (decision === "REJECTED" && !rejectionReason.trim())}
                className="text-xs font-black uppercase tracking-widest bg-navy-dark text-white hover:bg-navy"
              >
                {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
