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
  const [step, setStep] = useState<"phone" | "otp">("phone");
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
      toast.success("Verification code sent to WhatsApp!");
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
      toast.success("WhatsApp linked successfully!");
      setStep("phone");
      setPhone("");
      setOtp("");
      setIsModalOpen(false);
      await refreshUser(); // Refresh user state globally
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid or expired code");
    } finally {
      setIsLoading(false);
    }
  };

  const renderModal = () => (
    <Modal
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
        setStep("phone");
        setOtp("");
        setPhone("");
      }}
      title="Connect WhatsApp"
      description={
        step === "phone"
          ? "Enter your phone number to receive a verification code on WhatsApp."
          : "Enter the 6-digit code sent to your WhatsApp."
      }
    >
      <div className="mt-4">
        {step === "phone" ? (
          <form onSubmit={handleInitiate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                WhatsApp Number
              </label>
              <Input
                type="tel"
                placeholder="e.g. +2348012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Verification Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Verification Code
              </label>
              <Input
                type="text"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify & Link"}
            </Button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="w-full text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            >
              Change Number
            </button>
          </form>
        )}
      </div>
    </Modal>
  );

  if (isLinked) {
    if (variant === "sidebar") {
      return (
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="size-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.201-.242-.588-.487-.51-.669-.519-.173-.008-.371-.01-.57-.01-.197 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.41 0 .01 5.399 0 12.039c0 2.123.554 4.197 1.607 6.007L0 24l6.135-1.61a11.83 11.83 0 005.91 1.57h.005c6.637 0 12.037-5.402 12.04-12.042a11.85 11.85 0 00-3.483-8.522z" fill="#25D366"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-[#0F2B4C] dark:text-white leading-none">WhatsApp</p>
          </div>
          <button
            disabled
            className="px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800"
          >
            Connected
          </button>
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
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="size-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.201-.242-.588-.487-.51-.669-.519-.173-.008-.371-.01-.57-.01-.197 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.41 0 .01 5.399 0 12.039c0 2.123.554 4.197 1.607 6.007L0 24l6.135-1.61a11.83 11.83 0 005.91 1.57h.005c6.637 0 12.037-5.402 12.04-12.042a11.85 11.85 0 00-3.483-8.522z" fill="#CBD5E1"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-[#0F2B4C] dark:text-white leading-none">WhatsApp</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-1.5 rounded-full bg-[#0F2B4C] dark:bg-slate-100 text-white dark:text-[#0F2B4C] text-[11px] font-bold border border-[#0F2B4C]/20 dark:border-slate-300 hover:scale-105 transition-all shadow-md shadow-[#0F2B4C]/10"
          >
            Connect
          </button>
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
