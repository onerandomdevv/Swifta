"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPayment } from "@/lib/api/payment.api";
import { formatKobo } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

// ── Particle Confetti System ──
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: {
      x: number; y: number; size: number;
      speedX: number; speedY: number;
      color: string; rotation: number; rotationSpeed: number;
    }[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function init() {
      particles = [];
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height - canvas!.height,
          size: Math.random() * 5 + 2,
          speedX: Math.random() * 2 - 1,
          speedY: Math.random() * 3 + 1,
          color: `hsla(${Math.random() * 360}, 60%, 70%, 0.3)`,
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 2,
        });
      }
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        if (p.y > canvas!.height) {
          p.y = -20;
          p.x = Math.random() * canvas!.width;
        }
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx!.restore();
      });
      animId = requestAnimationFrame(animate);
    }

    resize();
    init();
    animate();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
    />
  );
}

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const queryClient = useQueryClient();

  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    if (reference === "bypass_or_escrow") {
      setIsVerifying(false);
      return;
    }

    if (!reference) {
      setError("No transaction reference found.");
      setIsVerifying(false);
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        const result = await verifyPayment(reference as string);
        if (isMounted) {
          if (["success", "processing", "SUCCESS", "VERIFIED", "already_verified", "verified"].includes(result.status)) {
            setIsVerifying(false);
            queryClient.invalidateQueries({ queryKey: ["orders"] });
          } else {
            setError(`Payment verification returned unexpected status: ${result.status}`);
            setIsVerifying(false);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Failed to verify transaction.");
          setIsVerifying(false);
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [reference]);

  // ── Verifying State ──
  if (isVerifying) {
    return (
      <div className="bg-[#f8fafc] flex items-center justify-center min-h-screen p-4">
        <main className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center md:p-12">
            <div className="mb-8 flex justify-center">
              <div className="relative h-20 w-20 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                <span className="material-symbols-outlined text-3xl text-emerald-600">lock</span>
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Verifying your payment...
              </h1>
              <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                Please hold on while we securely confirm your transaction with Paystack.
              </p>
            </div>
            <div className="mt-8 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-1/3 animate-[slideBar_2s_ease-in-out_infinite]" />
            </div>
          </div>
          <div className="mt-12 text-center">
            <div className="flex flex-col items-center gap-2 opacity-60">
              <div className="flex items-center gap-2">
                <div className="bg-slate-800 p-1 rounded shadow-sm">
                  <span className="material-symbols-outlined text-white text-sm">bolt</span>
                </div>
                <span className="font-bold text-sm tracking-widest uppercase text-slate-800">twizrr</span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Secure Checkout</p>
            </div>
          </div>
        </main>
        <style jsx>{`
          @keyframes slideBar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="bg-[#f8fafc] flex items-center justify-center min-h-screen p-4">
        <main className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center md:p-12">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-red-500">error</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Failed</h1>
            <p className="text-red-500 text-sm font-semibold mb-8">{error}</p>
            <button
              onClick={() => router.push("/buyer/cart")}
              className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Return to Cart
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Success State ──
  return (
    <div className="bg-[#f8fafc] min-h-screen flex flex-col items-center justify-center p-4">
      <ConfettiCanvas />

      <main className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <section className="pt-12 pb-8 px-6 text-center border-b border-slate-50">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500">
              <span className="material-symbols-outlined text-5xl text-emerald-600">check</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
          <p className="text-slate-500 mb-6">Your order has been confirmed and is being processed.</p>

          {/* Order ID Chip */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-slate-200 bg-slate-50">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">Order ID</span>
            <span className="font-mono text-sm font-bold text-slate-700">
              {reference ? `#${reference.slice(0, 14).toUpperCase()}` : "#ST-ORDER"}
            </span>
          </div>
        </section>

        {/* Summary */}
        <section className="p-6 md:p-8 space-y-8">
          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Transaction Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Reference</span>
                  <span className="font-mono text-xs font-medium text-slate-700 truncate max-w-[160px]">
                    {reference || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-medium text-slate-700">Paystack / Card</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium text-slate-700">{orderDate}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center text-emerald-600">
                <span className="material-symbols-outlined text-sm mr-2">calendar_today</span>
                <span className="text-xs font-bold uppercase">Est. Delivery: 2-4 Business Days</span>
              </div>
            </div>

            {/* Total Paid */}
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-widest mb-1">
                Payment Confirmed
              </h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm">verified</span>
                <span className="text-xs text-emerald-600 font-semibold">Transaction Secured</span>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <footer className="p-6 md:p-8 bg-slate-50 flex flex-col sm:flex-row-reverse gap-4">
          <button
            onClick={() => router.push("/buyer/orders")}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-200 active:scale-[0.98]"
          >
            View Order Status
          </button>
          <button
            onClick={() => router.push("/buyer/catalogue")}
            className="flex-1 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-bold py-4 px-6 rounded-xl transition-all active:scale-[0.98]"
          >
            Continue Shopping
          </button>
        </footer>
      </main>

      {/* Powered By Footer */}
      <p className="mt-8 text-slate-400 text-sm font-medium opacity-75">
        Powered by <span className="text-slate-600 font-bold">twizrr Pay</span> · Fintech Secured
      </p>
    </div>
  );
}
