"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth.api";
import { toast } from "sonner"; // Assuming sonner is used for toasts, or adapt to alert

interface WhatsAppLinkStatusProps {
  isLinked: boolean;
  onSuccess?: () => void;
}

export function WhatsAppLinkStatus({
  isLinked,
  onSuccess,
}: WhatsAppLinkStatusProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      setIsModalOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid or expired code");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLinked) {
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setStep("phone");
          setOtp("");
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
    </>
  );
}
