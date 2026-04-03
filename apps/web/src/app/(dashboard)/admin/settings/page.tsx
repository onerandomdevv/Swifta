"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/providers/toast-provider";
import { useAuth } from "@/providers/auth-provider";
import { getDisplayName } from "@twizrr/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth.api";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function AdminSettingsPage() {
  const toast = useToast();
  const { user, refreshUser, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    }
  }, [user, reset]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => authApi.updateProfile(data),
    onSuccess: () => {
      toast.success("Profile updated successfully.");
      refreshUser();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update profile.");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      apiClient.patch("/admin/change-password", payload),
    onSuccess: () => {
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswords(false);
    },
    onError: (error: any) => {
      toast.error(
        error?.message ||
          "Failed to change password. Check your current password.",
      );
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

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
          Account security & profile management
        </p>
      </header>

      {/* Profile Information Card */}
      <section className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm p-6 md:p-8">
        <h3 className="text-xs font-black text-neon-cyan uppercase tracking-widest mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">person</span>
          Profile Information
        </h3>
        <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                First Name
              </label>
              <Input
                {...register("firstName")}
                className="bg-slate-50 dark:bg-slate-800 h-12 border-slate-200 dark:border-slate-700"
                placeholder="First Name"
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 font-bold">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                Last Name
              </label>
              <Input
                {...register("lastName")}
                className="bg-slate-50 dark:bg-slate-800 h-12 border-slate-200 dark:border-slate-700"
                placeholder="Last Name"
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 font-bold">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
              Email Address
            </label>
            <Input
              {...register("email")}
              className="bg-slate-50 dark:bg-slate-800 h-12 border-slate-200 dark:border-slate-700"
              placeholder="Email Address"
            />
            {errors.email && (
              <p className="text-xs text-red-500 font-bold">
                {errors.email.message}
              </p>
            )}
            {user?.emailVerified ? (
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  check_circle
                </span>
                Verified Email
              </p>
            ) : (
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  pending
                </span>
                Unverified Email
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="bg-neon-cyan hover:bg-brand text-navy-dark font-black tracking-widest uppercase shadow-lg shadow-neon-cyan/20 px-6"
              disabled={updateProfileMutation.isPending || !isDirty}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
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
