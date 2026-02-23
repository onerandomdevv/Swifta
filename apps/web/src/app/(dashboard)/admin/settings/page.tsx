"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/providers/toast-provider";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSettingsPage() {
  const toast = useToast();
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      apiClient.patch("/admin/change-password", payload),
    onSuccess: () => {
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast.error(
        error?.message ||
          "Failed to change password. Check your current password.",
      );
    },
  });

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("New password must differ from current password.");
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="space-y-8 animate-in mt-4 fade-in slide-in-from-bottom-4 max-w-2xl">
      <header>
        <h1 className="text-2xl md:text-3xl font-black text-navy-dark dark:text-white uppercase tracking-widest">
          Admin Settings
        </h1>
        <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">
          Account security & session management
        </p>
      </header>

      {/* Account Info Card */}
      <section className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm p-6 md:p-8">
        <h3 className="text-xs font-black text-neon-cyan uppercase tracking-widest mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">badge</span>
          Account Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Full Name
            </span>
            <span className="font-bold text-navy-dark dark:text-white">
              {user?.fullName || "Admin User"}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Email
            </span>
            <span className="font-bold text-navy-dark dark:text-white">
              {user?.email || "—"}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Role
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
              {user?.role}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Email Verified
            </span>
            <span className="font-bold text-navy-dark dark:text-white flex items-center gap-1.5">
              {user?.emailVerified ? (
                <>
                  <span className="material-symbols-outlined text-green-500 text-[16px]">
                    check_circle
                  </span>
                  Verified
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-orange-400 text-[16px]">
                    pending
                  </span>
                  Unverified
                </>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* Change Password Card */}
      <section className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm p-6 md:p-8">
        <h3 className="text-xs font-black text-brand uppercase tracking-widest mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">lock</span>
          Change Password
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
              Current Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10">
                key
              </span>
              <Input
                className="pl-10 bg-slate-50 dark:bg-slate-800 h-12 border-slate-200 dark:border-slate-700"
                type={showPasswords ? "text" : "password"}
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={changePasswordMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
              New Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10">
                lock
              </span>
              <Input
                className="pl-10 bg-slate-50 dark:bg-slate-800 h-12 border-slate-200 dark:border-slate-700"
                type={showPasswords ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={changePasswordMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10">
                lock
              </span>
              <Input
                className="pl-10 bg-slate-50 dark:bg-slate-800 h-12 border-slate-200 dark:border-slate-700"
                type={showPasswords ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={changePasswordMutation.isPending}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                {showPasswords ? "visibility_off" : "visibility"}
              </span>
              {showPasswords ? "Hide passwords" : "Show passwords"}
            </button>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              className="bg-brand hover:bg-neon-cyan text-navy-dark font-black tracking-widest uppercase shadow-lg shadow-brand/20 px-6"
              onClick={handlePasswordChange}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending
                ? "Updating..."
                : "Update Password"}
            </Button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white dark:bg-slate-900 border-2 border-red-100 dark:border-red-900/30 rounded-[2rem] shadow-sm p-6 md:p-8">
        <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">warning</span>
          Session Management
        </h3>
        <p className="text-sm font-medium text-slate-500 mb-6">
          Sign out of this admin session. You will be redirected to the login
          page and must re-authenticate to regain access.
        </p>
        <Button
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 font-black tracking-widest uppercase"
          onClick={() => {
            logout();
            toast.info("You have been signed out.");
          }}
        >
          <span className="material-symbols-outlined text-[16px] mr-1.5">
            logout
          </span>
          Sign Out
        </Button>
      </section>
    </div>
  );
}
