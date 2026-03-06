"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/button";

interface StaffUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN" | "OPERATOR" | "SUPPORT";
  emailVerified: boolean;
  createdAt: string;
  adminProfile?: {
    approvalStatus: string;
  };
}

interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, any> | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

const ROLE_STYLES: Record<
  string,
  { bg: string; text: string; border: string; icon: string }
> = {
  SUPER_ADMIN: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-900/50",
    icon: "admin_panel_settings",
  },
  OPERATOR: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-900/50",
    icon: "engineering",
  },
  SUPPORT: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-900/50",
    icon: "support_agent",
  },
};

const STATUS_STYLES: Record<string, string> = {
  APPROVED: "text-green-600 bg-green-500/10 border-green-200",
  PENDING: "text-amber-600 bg-amber-500/10 border-amber-200",
  SUSPENDED: "text-red-600 bg-red-500/10 border-red-200",
};

const ACTION_LABELS: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  APPROVE_STAFF: {
    label: "Approved staff member",
    icon: "check_circle",
    color: "text-green-600",
  },
  SUSPEND_STAFF: {
    label: "Suspended staff member",
    icon: "block",
    color: "text-red-500",
  },
  REACTIVATE_STAFF: {
    label: "Reactivated staff member",
    icon: "restart_alt",
    color: "text-blue-500",
  },
  VERIFY_MERCHANT: {
    label: "Verified merchant",
    icon: "verified",
    color: "text-green-600",
  },
  REJECT_MERCHANT: {
    label: "Rejected merchant",
    icon: "cancel",
    color: "text-red-500",
  },
  TOGGLE_MERCHANT_FLAG: {
    label: "Updated merchant flag",
    icon: "flag",
    color: "text-amber-500",
  },
  PROCESS_PAYOUT: {
    label: "Processed payout",
    icon: "payments",
    color: "text-brand",
  },
  PROMOTE_USER: {
    label: "Promoted user",
    icon: "shield_person",
    color: "text-purple-500",
  },
  DELETE_USER: {
    label: "Removed user",
    icon: "person_remove",
    color: "text-red-500",
  },
};

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function AdminStaffPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "reactivate" | "remove";
    user: StaffUser;
  } | null>(null);

  // Fetch pending staff
  const { data: pendingStaff, isLoading: isPendingLoading } = useQuery<
    StaffUser[]
  >({
    queryKey: ["admin", "staff", "pending"],
    queryFn: () => apiClient.get("/admin/users/pending"),
  });

  // Fetch all users, filter to staff roles client-side
  const { data: allUsers, isLoading: isUsersLoading } = useQuery<StaffUser[]>({
    queryKey: ["admin", "users"],
    queryFn: () => apiClient.get("/admin/users"),
  });

  // Fetch recent audit logs
  const { data: auditLogs } = useQuery<AuditEntry[]>({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => apiClient.get("/admin/audit-logs?limit=20"),
  });

  const activeStaff =
    allUsers?.filter(
      (u) =>
        ["OPERATOR", "SUPPORT"].includes(u.role) &&
        u.adminProfile?.approvalStatus === "APPROVED",
    ) || [];

  const suspendedStaff =
    allUsers?.filter(
      (u) =>
        ["OPERATOR", "SUPPORT"].includes(u.role) &&
        u.adminProfile?.approvalStatus === "SUSPENDED",
    ) || [];

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "staff", "pending"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
  };

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (userId: string) =>
      apiClient.patch(`/admin/staff/${userId}/approve`),
    onSuccess: () => {
      toast.success("Staff member approved. They can now log in.");
      invalidateAll();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to approve staff member.");
    },
  });

  // Suspend mutation
  const suspendMutation = useMutation({
    mutationFn: (userId: string) =>
      apiClient.patch(`/admin/staff/${userId}/suspend`),
    onSuccess: () => {
      toast.success("Staff member has been suspended.");
      invalidateAll();
      setConfirmAction(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to suspend staff member.");
    },
  });

  // Reactivate mutation
  const reactivateMutation = useMutation({
    mutationFn: (userId: string) =>
      apiClient.patch(`/admin/staff/${userId}/reactivate`),
    onSuccess: () => {
      toast.success("Staff member has been reactivated.");
      invalidateAll();
      setConfirmAction(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to reactivate staff member.");
    },
  });

  // Remove mutation
  const removeMutation = useMutation({
    mutationFn: (userId: string) => apiClient.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      toast.success("Staff member has been removed.");
      invalidateAll();
      setConfirmAction(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to remove staff member.");
    },
  });

  const isLoading = isPendingLoading || isUsersLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-neon-cyan">
          progress_activity
        </span>
      </div>
    );
  }

  const pendingCount = pendingStaff?.length || 0;
  const activeCount = activeStaff.length;
  const suspendedCount = suspendedStaff.length;

  return (
    <div className="space-y-8 animate-in mt-4 fade-in slide-in-from-bottom-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-navy-dark dark:text-white uppercase tracking-widest">
            Staff Management
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">
            Approve, manage, and monitor internal team members
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest">
          {pendingCount > 0 && (
            <span className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 animate-pulse">
              {pendingCount} Pending
            </span>
          )}
          <span className="px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50">
            {activeCount} Active
          </span>
          {suspendedCount > 0 && (
            <span className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
              {suspendedCount} Suspended
            </span>
          )}
        </div>
      </header>

      {/* ──── Pending Approvals Section ──── */}
      {pendingStaff && pendingStaff.length > 0 && (
        <section className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl">
                pending_actions
              </span>
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest">
                Pending Approvals
              </h2>
              <p className="text-xs font-bold text-amber-700/70 dark:text-amber-400/70 uppercase tracking-wider mt-0.5">
                {pendingCount} staff member{pendingCount !== 1 ? "s" : ""}{" "}
                awaiting access
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingStaff.map((staff) => {
              const roleStyle = ROLE_STYLES[staff.role] || ROLE_STYLES.SUPPORT;
              return (
                <div
                  key={staff.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-amber-100 dark:border-amber-800/50 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl ${roleStyle.bg} flex items-center justify-center shrink-0`}
                    >
                      <span
                        className={`material-symbols-outlined ${roleStyle.text} text-xl`}
                      >
                        {roleStyle.icon}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-navy-dark dark:text-white flex items-center gap-2 flex-wrap">
                        {staff.firstName} {staff.lastName}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                        >
                          {staff.role}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {staff.email}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-bold">
                        Registered{" "}
                        {new Date(staff.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-black tracking-widest uppercase text-xs"
                      onClick={() => approveMutation.mutate(staff.id)}
                      disabled={approveMutation.isPending}
                    >
                      <span className="material-symbols-outlined text-[16px] mr-1.5">
                        check_circle
                      </span>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 font-black tracking-widest uppercase text-xs"
                      onClick={() =>
                        setConfirmAction({ type: "remove", user: staff })
                      }
                    >
                      <span className="material-symbols-outlined text-[16px] mr-1.5">
                        close
                      </span>
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state for pending */}
      {(!pendingStaff || pendingStaff.length === 0) && (
        <section className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 mb-2 block">
            how_to_reg
          </span>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            No Pending Approvals
          </p>
          <p className="text-xs text-slate-400 mt-1">
            All staff registrations have been processed.
          </p>
        </section>
      )}

      {/* ──── Active Staff Section ──── */}
      <section className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl">
              verified_user
            </span>
          </div>
          <div>
            <h2 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-widest">
              Active Staff
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              {activeCount} approved team member{activeCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {activeStaff.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-100 dark:border-slate-800">
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Staff Member
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Role
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Joined
                  </th>
                  <th className="p-4 md:p-6 text-right text-xs font-black uppercase tracking-widest text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeStaff.map((staff) => {
                  const roleStyle =
                    ROLE_STYLES[staff.role] || ROLE_STYLES.SUPPORT;
                  return (
                    <tr
                      key={staff.id}
                      className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="p-4 md:p-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-xl ${roleStyle.bg} flex items-center justify-center shrink-0`}
                          >
                            <span
                              className={`material-symbols-outlined ${roleStyle.text} text-lg`}
                            >
                              {roleStyle.icon}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-navy-dark dark:text-white">
                              {staff.firstName} {staff.lastName}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {staff.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 md:p-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {roleStyle.icon}
                          </span>
                          {staff.role}
                        </span>
                      </td>
                      <td className="p-4 md:p-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_STYLES[staff.adminProfile?.approvalStatus || "APPROVED"]}`}
                        >
                          <span className="size-1.5 rounded-full bg-current"></span>
                          {staff.adminProfile?.approvalStatus || "APPROVED"}
                        </span>
                      </td>
                      <td className="p-4 md:p-6">
                        <span className="text-sm font-medium text-slate-500">
                          {new Date(staff.createdAt).toLocaleDateString(
                            "en-NG",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </span>
                      </td>
                      <td className="p-4 md:p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-bold tracking-wider uppercase text-xs"
                            onClick={() =>
                              setConfirmAction({ type: "suspend", user: staff })
                            }
                          >
                            <span className="material-symbols-outlined text-[16px] mr-1">
                              block
                            </span>
                            Suspend
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold tracking-wider uppercase text-xs"
                            onClick={() =>
                              setConfirmAction({ type: "remove", user: staff })
                            }
                          >
                            <span className="material-symbols-outlined text-[16px] mr-1">
                              person_remove
                            </span>
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4">
              group_off
            </span>
            <p className="text-lg font-bold text-navy-dark dark:text-white">
              No active staff
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Staff members will appear here after approval.
            </p>
          </div>
        )}
      </section>

      {/* ──── Suspended Staff Section ──── */}
      {suspendedStaff.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border-2 border-red-100 dark:border-red-900/30 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-red-100 dark:border-red-900/30 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 text-xl">
                block
              </span>
            </div>
            <div>
              <h2 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-widest">
                Suspended Staff
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                {suspendedCount} suspended member
                {suspendedCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="divide-y divide-red-50 dark:divide-red-900/20">
            {suspendedStaff.map((staff) => {
              const roleStyle = ROLE_STYLES[staff.role] || ROLE_STYLES.SUPPORT;
              return (
                <div
                  key={staff.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 hover:bg-red-50/30 dark:hover:bg-red-900/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 opacity-50">
                      <span className="material-symbols-outlined text-red-400 text-lg">
                        {roleStyle.icon}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400">
                        {staff.firstName} {staff.lastName}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {staff.email} · {staff.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold tracking-wider uppercase text-xs"
                      onClick={() =>
                        setConfirmAction({ type: "reactivate", user: staff })
                      }
                    >
                      <span className="material-symbols-outlined text-[16px] mr-1">
                        restart_alt
                      </span>
                      Reactivate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold tracking-wider uppercase text-xs"
                      onClick={() =>
                        setConfirmAction({ type: "remove", user: staff })
                      }
                    >
                      <span className="material-symbols-outlined text-[16px] mr-1">
                        delete
                      </span>
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ──── Recent Activity / Audit Trail ──── */}
      <section className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">
              history
            </span>
          </div>
          <div>
            <h2 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-widest">
              Recent Activity
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Audit trail of admin actions
            </p>
          </div>
        </div>

        {auditLogs && auditLogs.length > 0 ? (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {auditLogs.map((entry) => {
              const actionInfo = ACTION_LABELS[entry.action] || {
                label: entry.action,
                icon: "info",
                color: "text-slate-500",
              };
              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 p-4 md:px-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                >
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${actionInfo.color} bg-current/5`}
                  >
                    <span
                      className={`material-symbols-outlined text-lg ${actionInfo.color}`}
                    >
                      {actionInfo.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy-dark dark:text-white">
                      <span className="font-bold">
                        {entry.user.firstName} {entry.user.lastName}
                      </span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className={`font-semibold ${actionInfo.color}`}>
                        {actionInfo.label}
                      </span>
                      {entry.metadata && entry.metadata.flag && (
                        <span className="text-xs text-slate-400 ml-1">
                          ({entry.metadata.flag}:{" "}
                          {entry.metadata.value ? "✓" : "✗"})
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {entry.user.role}
                      </span>
                      <span>{timeAgo(entry.createdAt)}</span>
                      <span className="text-slate-300">·</span>
                      <span className="truncate max-w-[120px]">
                        {entry.targetType}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700 mb-3">
              timeline
            </span>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              No Activity Yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Admin actions will be logged here as they happen.
            </p>
          </div>
        )}
      </section>

      {/* ──── Confirmation Modal ──── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    confirmAction.type === "reactivate"
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-500"
                      : confirmAction.type === "suspend"
                        ? "bg-amber-50 dark:bg-amber-900/20 text-amber-500"
                        : "bg-red-50 dark:bg-red-900/20 text-red-500"
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">
                    {confirmAction.type === "reactivate"
                      ? "restart_alt"
                      : confirmAction.type === "suspend"
                        ? "block"
                        : "person_remove"}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-widest">
                    {confirmAction.type === "reactivate"
                      ? "Reactivate Staff"
                      : confirmAction.type === "suspend"
                        ? "Suspend Staff"
                        : "Remove Staff"}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    This action requires confirmation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmAction(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                disabled={
                  suspendMutation.isPending ||
                  reactivateMutation.isPending ||
                  removeMutation.isPending
                }
              >
                <span className="material-symbols-outlined text-slate-400">
                  close
                </span>
              </button>
            </div>

            {/* User info */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-6">
              <p className="font-bold text-navy-dark dark:text-white">
                {confirmAction.user.firstName} {confirmAction.user.lastName}
              </p>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                {confirmAction.user.email}
              </p>
              <span
                className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${ROLE_STYLES[confirmAction.user.role]?.bg} ${ROLE_STYLES[confirmAction.user.role]?.text} ${ROLE_STYLES[confirmAction.user.role]?.border}`}
              >
                {confirmAction.user.role}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">
              {confirmAction.type === "reactivate" ? (
                <>
                  This will <strong>reactivate</strong> this staff member. They
                  will regain access to the admin dashboard.
                </>
              ) : confirmAction.type === "suspend" ? (
                <>
                  This will <strong>suspend</strong> this staff member. They
                  will lose access until reactivated. This is reversible.
                </>
              ) : (
                <>
                  This will <strong>permanently remove</strong> this staff
                  member from the platform. Their account will be deactivated.
                </>
              )}
            </p>

            <div className="flex justify-end gap-4">
              <Button
                variant="ghost"
                className="font-bold tracking-widest uppercase hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                onClick={() => setConfirmAction(null)}
                disabled={
                  suspendMutation.isPending ||
                  reactivateMutation.isPending ||
                  removeMutation.isPending
                }
              >
                Cancel
              </Button>
              <Button
                className={`font-black tracking-widest uppercase shadow-lg px-6 ${
                  confirmAction.type === "reactivate"
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20"
                    : confirmAction.type === "suspend"
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                      : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                }`}
                onClick={() => {
                  if (confirmAction.type === "reactivate") {
                    reactivateMutation.mutate(confirmAction.user.id);
                  } else if (confirmAction.type === "suspend") {
                    suspendMutation.mutate(confirmAction.user.id);
                  } else {
                    removeMutation.mutate(confirmAction.user.id);
                  }
                }}
                disabled={
                  suspendMutation.isPending ||
                  reactivateMutation.isPending ||
                  removeMutation.isPending
                }
              >
                {suspendMutation.isPending ||
                reactivateMutation.isPending ||
                removeMutation.isPending
                  ? "Processing..."
                  : confirmAction.type === "reactivate"
                    ? "Reactivate"
                    : confirmAction.type === "suspend"
                      ? "Suspend"
                      : "Remove Staff"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
