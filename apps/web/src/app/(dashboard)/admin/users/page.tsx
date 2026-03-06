"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/button";

interface PlatformUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: "BUYER" | "MERCHANT" | "SUPER_ADMIN" | "OPERATOR" | "SUPPORT";
  emailVerified: boolean;
  createdAt: string;
  merchantProfile?: {
    verification: string;
  };
  adminProfile?: {
    approvalStatus: string;
  };
}

const VERIFICATION_COLORS: Record<string, string> = {
  VERIFIED: "text-green-500 bg-green-500/10",
  PENDING: "text-amber-500 bg-amber-500/10",
  UNVERIFIED: "text-slate-400 bg-slate-400/10",
  REJECTED: "text-red-500 bg-red-500/10",
  APPROVED: "text-green-500 bg-green-500/10",
};

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN:
    "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50",
  OPERATOR:
    "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
  SUPPORT:
    "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
  MERCHANT: "bg-brand/10 text-brand border-brand/20",
  BUYER:
    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmAction, setConfirmAction] = useState<{
    type: "promote" | "delete";
    user: PlatformUser;
  } | null>(null);
  const [selectedRole, setSelectedRole] = useState<
    "SUPER_ADMIN" | "OPERATOR" | "SUPPORT"
  >("OPERATOR");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "ALL" | "MERCHANT" | "BUYER" | "STAFF"
  >("ALL");

  const { data: users, isLoading } = useQuery<PlatformUser[]>({
    queryKey: ["admin", "users"],
    queryFn: () => apiClient.get("/admin/users"),
  });

  const promoteMutation = useMutation({
    mutationFn: (data: { userId: string; role: string }) =>
      apiClient.patch(`/admin/users/${data.userId}/promote`, {
        role: data.role,
      }),
    onSuccess: (_, variables) => {
      toast.success(`User has been granted the ${variables.role} role.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setConfirmAction(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to promote user.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => apiClient.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      toast.success("User has been removed from the platform.");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setConfirmAction(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete user.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-neon-cyan">
          progress_activity
        </span>
      </div>
    );
  }

  const adminCount = users?.filter((u) => u.role === "SUPER_ADMIN").length || 0;
  const staffCount =
    users?.filter((u) => ["OPERATOR", "SUPPORT"].includes(u.role)).length || 0;
  const merchantCount = users?.filter((u) => u.role === "MERCHANT").length || 0;
  const buyerCount = users?.filter((u) => u.role === "BUYER").length || 0;

  // Apply filters
  const filteredUsers = (users || []).filter((user) => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone?.includes(query);

    // Tab filter
    let matchesFilter = true;
    if (activeFilter === "MERCHANT") matchesFilter = user.role === "MERCHANT";
    else if (activeFilter === "BUYER") matchesFilter = user.role === "BUYER";
    else if (activeFilter === "STAFF")
      matchesFilter = ["SUPER_ADMIN", "OPERATOR", "SUPPORT"].includes(
        user.role,
      );

    return matchesSearch && matchesFilter;
  });

  const filterTabs = [
    { key: "ALL" as const, label: "All", count: users?.length || 0 },
    { key: "MERCHANT" as const, label: "Merchants", count: merchantCount },
    { key: "BUYER" as const, label: "Buyers", count: buyerCount },
    { key: "STAFF" as const, label: "Staff", count: adminCount + staffCount },
  ];

  return (
    <div className="space-y-8 animate-in mt-4 fade-in slide-in-from-bottom-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-navy-dark dark:text-white uppercase tracking-widest">
            User Management
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">
            Promote, audit, and manage all platform accounts
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest">
          <span className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
            {adminCount} Admins
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-brand/10 text-brand border border-brand/20">
            {merchantCount} Merchants
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {buyerCount} Buyers
          </span>
        </div>
      </header>

      {/* Search + Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, email, or phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-navy-dark dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              <span className="material-symbols-outlined text-slate-400 text-lg">
                close
              </span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                activeFilter === tab.key
                  ? "bg-white dark:bg-slate-900 text-navy-dark dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeFilter === tab.key
                    ? "bg-brand/10 text-brand"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <section className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-100 dark:border-slate-800">
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    User
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Contact
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Role
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
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="p-4 md:p-6">
                      <p className="font-bold text-navy-dark dark:text-white">
                        {user.firstName || user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : "Unnamed User"}
                      </p>
                      <p className="text-xs font-bold text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                        {/* Email Status */}
                        <span className="flex items-center gap-1">
                          {user.emailVerified ? (
                            <span className="material-symbols-outlined text-green-500 text-[14px]">
                              verified
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-orange-400 text-[14px]">
                              pending
                            </span>
                          )}
                          {user.emailVerified ? "Email OK" : "Email Pending"}
                        </span>

                        {/* Business/Staff Status */}
                        {(user.role === "MERCHANT" ||
                          user.role !== "BUYER") && (
                          <span className="text-[10px] text-slate-300">•</span>
                        )}

                        {user.role === "MERCHANT" && user.merchantProfile && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${VERIFICATION_COLORS[user.merchantProfile.verification] || "text-slate-400 bg-slate-400/10"}`}
                          >
                            Business: {user.merchantProfile.verification}
                          </span>
                        )}

                        {["SUPER_ADMIN", "OPERATOR", "SUPPORT"].includes(
                          user.role,
                        ) &&
                          user.adminProfile && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${VERIFICATION_COLORS[user.adminProfile.approvalStatus] || "text-slate-400 bg-slate-400/10"}`}
                            >
                              Access: {user.adminProfile.approvalStatus}
                            </span>
                          )}
                      </p>
                    </td>
                    <td className="p-4 md:p-6">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {user.email}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {user.phone}
                      </p>
                    </td>
                    <td className="p-4 md:p-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${ROLE_STYLES[user.role]}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 md:p-6">
                      <span className="text-sm font-medium text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4 md:p-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {user.role !== "SUPER_ADMIN" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-brand hover:bg-brand/10 font-bold tracking-wider uppercase text-xs"
                            onClick={() => {
                              setSelectedRole("OPERATOR");
                              setConfirmAction({ type: "promote", user });
                            }}
                          >
                            <span className="material-symbols-outlined text-[16px] mr-1">
                              shield_person
                            </span>
                            Assign Role
                          </Button>
                        )}
                        {user.role !== "SUPER_ADMIN" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold tracking-wider uppercase text-xs"
                            onClick={() =>
                              setConfirmAction({ type: "delete", user })
                            }
                          >
                            <span className="material-symbols-outlined text-[16px] mr-1">
                              person_remove
                            </span>
                            Remove
                          </Button>
                        )}
                        {user.role === "SUPER_ADMIN" && (
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Protected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4">
              group_off
            </span>
            <p className="text-lg font-bold text-navy-dark dark:text-white">
              No users found
            </p>
          </div>
        )}
      </section>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    confirmAction.type === "promote"
                      ? "bg-brand/10 text-brand"
                      : "bg-red-50 dark:bg-red-900/20 text-red-500"
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {confirmAction.type === "promote"
                      ? "shield_person"
                      : "person_remove"}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-widest">
                    {confirmAction.type === "promote"
                      ? "Assign Staff Role"
                      : "Remove User"}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Irreversible Action
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmAction(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                disabled={promoteMutation.isPending || deleteMutation.isPending}
              >
                <span className="material-symbols-outlined text-slate-400">
                  close
                </span>
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-6">
              <p className="font-bold text-navy-dark dark:text-white">
                {confirmAction.user.firstName || confirmAction.user.lastName
                  ? `${confirmAction.user.firstName} ${confirmAction.user.lastName}`
                  : "Unnamed User"}
              </p>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                {confirmAction.user.email}
              </p>
              <span
                className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${ROLE_STYLES[confirmAction.user.role]}`}
              >
                Current: {confirmAction.user.role}
              </span>
            </div>

            {confirmAction.type === "promote" ? (
              <div className="mb-6 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
                  Select the internal role to assign to this user. This grants
                  them access to the internal operations dashboard based on the
                  selected role's privileges.
                </p>
                <div className="space-y-3">
                  {(["SUPER_ADMIN", "OPERATOR", "SUPPORT"] as const).map(
                    (role) => (
                      <label
                        key={role}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                          selectedRole === role
                            ? "border-brand bg-brand/5 dark:bg-brand/10"
                            : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={selectedRole === role}
                          onChange={() => setSelectedRole(role)}
                          className="mt-1 text-brand focus:ring-brand w-4 h-4"
                        />
                        <div>
                          <p className="font-bold text-navy-dark dark:text-white uppercase tracking-wider text-sm">
                            {role.replace("_", " ")}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {role === "SUPER_ADMIN" &&
                              "Full administrative access. Analytics, User Management, Settings, etc."}
                            {role === "OPERATOR" &&
                              "Logistics and resolution. Can override orders and verify merchants."}
                            {role === "SUPPORT" &&
                              "View-only access to orders, users, and merchants for customer support."}
                          </p>
                        </div>
                      </label>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">
                This will <strong>permanently remove</strong> this user from the
                platform. Their orders, RFQs, and transaction history will be
                preserved for auditing, but their account will be deactivated.
              </p>
            )}

            <div className="flex justify-end gap-4">
              <Button
                variant="ghost"
                className="font-bold tracking-widest uppercase hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                onClick={() => setConfirmAction(null)}
                disabled={promoteMutation.isPending || deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className={`font-black tracking-widest uppercase shadow-lg px-6 ${
                  confirmAction.type === "promote"
                    ? "bg-brand hover:bg-neon-cyan text-navy-dark shadow-brand/20"
                    : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                }`}
                onClick={() => {
                  if (confirmAction.type === "promote") {
                    promoteMutation.mutate({
                      userId: confirmAction.user.id,
                      role: selectedRole,
                    });
                  } else {
                    deleteMutation.mutate(confirmAction.user.id);
                  }
                }}
                disabled={promoteMutation.isPending || deleteMutation.isPending}
              >
                {promoteMutation.isPending || deleteMutation.isPending
                  ? "Processing..."
                  : confirmAction.type === "promote"
                    ? "Assign Role"
                    : "Delete User"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
