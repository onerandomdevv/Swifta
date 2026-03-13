"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth.api";
import { toast } from "sonner"; // Assuming sonner is used for toasts, or adapt to alert

interface WhatsAppLinkStatusProps {
  isLinked: boolean;
  onSuccess?: () => void;
  variant?: "default" | "sidebar";
}

export function WhatsAppLinkStatus({
  isLinked,
  onSuccess,
  variant = "default",
}: WhatsAppLinkStatusProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<"intro" | "phone" | "otp" | "success">("intro");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { refreshUser } = useAuth();

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setIsLoading(true);
    try {
      await authApi.initiateWhatsAppLink(phone);
      toast.success("Verification code sent!");
      setStep("otp");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setIsLoading(true);
    try {
      await authApi.verifyWhatsAppLink(phone, otp);
      setStep("success");
      await refreshUser();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlow = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setStep("intro");
      setPhone("");
      setOtp("");
    }, 300);
  };

  const renderModalContent = () => {
    switch (step) {
      case "intro":
        return (
          <div className="p-8 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-primary/10">
              <span className="material-symbols-outlined text-4xl text-primary font-variation-fill">chat</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight">Sync your store</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                Connect your WhatsApp to receive orders and manage inventory on the go.
              </p>
            </div>
            <div className="grid gap-3 py-4">
              {[
                { icon: "schedule", text: "Real-time order alerts" },
                { icon: "inventory_2", text: "Update stock via chat" },
                { icon: "support_agent", text: "Direct buyer communication" }
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-primary text-xl">{benefit.icon}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{benefit.text}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => setStep("phone")} className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20">
              Get Started
            </Button>
          </div>
        );
      case "phone":
        return (
          <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight">WhatsApp Number</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">We&apos;ll send a 6-digit code to this number.</p>
            </div>
            <form onSubmit={handleInitiate} className="space-y-6">
              <div className="group">
                <Input
                  type="tel"
                  placeholder="e.g. +234 801 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-16 text-lg font-bold border-2 rounded-2xl focus:border-primary transition-all"
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep("intro")} className="h-14 px-6 rounded-2xl border-2">
                  Back
                </Button>
                <Button type="submit" className="flex-1 h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Code"}
                </Button>
              </div>
            </form>
          </div>
        );
      case "otp":
        return (
          <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight">Verify Code</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Enter the code sent to <span className="text-primary font-bold">{phone}</span></p>
            </div>
            <form onSubmit={handleVerify} className="space-y-6">
              <Input
                type="text"
                placeholder="0 0 0 0 0 0"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="h-16 text-center text-3xl font-black tracking-[0.5em] border-2 rounded-2xl focus:border-primary transition-all"
                required
              />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep("phone")} className="h-14 px-6 rounded-2xl border-2">
                  Back
                </Button>
                <Button type="submit" className="flex-1 h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify & Link"}
                </Button>
              </div>
            </form>
          </div>
        );
      case "success":
        return (
          <div className="p-10 text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="size-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 scale-125 animate-bounce">
              <span className="material-symbols-outlined text-5xl text-white font-variation-fill">check_circle</span>
            </div>
            <div className="space-y-2 pt-4">
              <h3 className="text-3xl font-black text-[#0f172a] dark:text-white uppercase tracking-tighter">Connected!</h3>
              <p className="text-slate-500 text-sm mt-1">You&apos;re all set! Your WhatsApp is connected.</p>
            </div>
            <Button onClick={resetFlow} className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
              Go to Dashboard
            </Button>
          </div>
        );
    }
  };

  const renderModal = () => (
    <Modal
      isOpen={isModalOpen}
      onClose={resetFlow}
      hideHeader
      className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-2xl w-[400px] overflow-hidden animate-in zoom-in-95 duration-300"
    >
      {renderModalContent()}
    </Modal>
  );

  if (isLinked) {
    if (variant === "sidebar") {
      return (
        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl font-variation-fill">chat</span>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
            </div>
            <p className="text-[10px] font-black text-[#0f172a] dark:text-white tracking-[0.1em] uppercase">WhatsApp Linked</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-full text-emerald-700 dark:text-emerald-400 text-sm font-medium">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        WhatsApp Linked
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <>
        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 transition-all">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
              <span className="material-symbols-outlined text-slate-300">chat</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 tracking-[0.1em] uppercase leading-none mb-1">WhatsApp</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-[11px] font-bold text-primary hover:underline transition-all"
              >
                Connect Now
              </button>
            </div>
          </div>
        </div>
        {renderModal()}
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Link WhatsApp
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Receive orders, track deliveries, and manage stock via WhatsApp.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="bg-white dark:bg-slate-950 hover:bg-slate-50 border-slate-200 dark:border-slate-800"
        >
          Connect Now
        </Button>
      </div>
      {renderModal()}
    </>
  );
}
