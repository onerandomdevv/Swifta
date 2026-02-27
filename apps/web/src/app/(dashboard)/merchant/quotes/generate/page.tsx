"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createSharedQuote,
  type SharedQuoteItem,
} from "@/lib/api/shared-quote.api";

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function GenerateSharedQuotePage() {
  const router = useRouter();
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [note, setNote] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [expiryDays, setExpiryDays] = useState(7);
  const [items, setItems] = useState<
    { productName: string; quantity: string; unitPrice: string }[]
  >([{ productName: "", quantity: "", unitPrice: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ slug: string; link: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const addItem = () =>
    setItems([...items, { productName: "", quantity: "", unitPrice: "" }]);
  const removeItem = (i: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== i));
  };
  const updateItem = (i: number, field: string, value: string) => {
    const updated = [...items];
    (updated[i] as any)[field] = value;
    setItems(updated);
  };

  const parsedItems: SharedQuoteItem[] = items.map((item) => {
    const qty = parseInt(item.quantity) || 0;
    const unitKobo = Math.round((parseFloat(item.unitPrice) || 0) * 100);
    return {
      productName: item.productName,
      quantity: qty,
      unitPriceKobo: unitKobo,
      totalKobo: qty * unitKobo,
    };
  });

  const subtotalKobo = parsedItems.reduce((sum, i) => sum + i.totalKobo, 0);
  const deliveryFeeKobo = Math.round((parseFloat(deliveryFee) || 0) * 100);
  const totalKobo = subtotalKobo + deliveryFeeKobo;

  const handleSubmit = async () => {
    setError("");
    const validItems = parsedItems.filter(
      (i) => i.productName && i.quantity > 0 && i.unitPriceKobo > 0,
    );
    if (validItems.length === 0) {
      setError("Add at least one item with a name, quantity, and price.");
      return;
    }

    setSubmitting(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const res = await createSharedQuote({
        buyerName: buyerName || undefined,
        buyerPhone: buyerPhone || undefined,
        buyerEmail: buyerEmail || undefined,
        items: validItems,
        subtotalKobo,
        deliveryFeeKobo,
        totalKobo,
        note: note || undefined,
        expiresAt: expiresAt.toISOString(),
      });

      const link = `${window.location.origin}/quote/${res.slug}`;
      setResult({ slug: res.slug, link });
    } catch (err: any) {
      setError(err?.error || "Failed to create quote. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!result) return;
    const msg = encodeURIComponent(
      `Hi${buyerName ? ` ${buyerName}` : ""},\n\nI've prepared a quote for you on Hardware OS.\n\nView & pay securely here:\n${result.link}\n\nValid for ${expiryDays} days.`,
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  // ── Success View ──
  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
            <div className="bg-green-500 p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-white text-2xl">
                check_circle
              </span>
              <h2 className="text-sm font-black text-white uppercase tracking-[0.15em]">
                Quote Link Generated
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Shareable Link
                </p>
                <p className="text-sm font-mono text-slate-900 dark:text-white break-all">
                  {result.link}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopy}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 text-xs font-black uppercase tracking-[0.1em] hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">
                    {copied ? "done" : "content_copy"}
                  </span>
                  {copied ? "Copied!" : "Copy Link"}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="bg-green-500 text-white py-3 text-xs font-black uppercase tracking-[0.1em] hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">
                    share
                  </span>
                  WhatsApp
                </button>
              </div>
              <button
                onClick={() => {
                  setResult(null);
                  setItems([{ productName: "", quantity: "", unitPrice: "" }]);
                  setBuyerName("");
                  setBuyerPhone("");
                  setBuyerEmail("");
                  setNote("");
                  setDeliveryFee("");
                }}
                className="w-full border-2 border-slate-200 dark:border-slate-700 py-3 text-xs font-black uppercase tracking-[0.1em] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Create Another Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form View ──
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 animate-in fade-in duration-500">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Generate Quote Link
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Create a shareable quote to send via WhatsApp
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="border border-slate-200 dark:border-slate-700 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Back
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3 text-xs text-red-600 dark:text-red-400 font-bold">
            {error}
          </div>
        )}

        {/* Buyer Info (Optional) */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
            Buyer Info (Optional)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Name"
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-white"
            />
            <input
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="Phone"
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-white"
            />
            <input
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="Email"
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Line Items
            </h3>
            <button
              onClick={addItem}
              className="text-[10px] font-black uppercase tracking-widest text-green-500 hover:text-green-600 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span> Add
              Item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_80px_120px_32px] gap-3 items-center"
              >
                <input
                  value={item.productName}
                  onChange={(e) => updateItem(i, "productName", e.target.value)}
                  placeholder="Product name"
                  className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-white"
                />
                <input
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  placeholder="Qty"
                  type="number"
                  min="1"
                  className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-white text-center"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    ₦
                  </span>
                  <input
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                    placeholder="Unit price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-7 pr-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => removeItem(i)}
                  className="text-slate-300 hover:text-red-500 transition-colors flex items-center justify-center"
                  disabled={items.length === 1}
                >
                  <span className="material-symbols-outlined text-lg">
                    close
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Delivery Fee
            </h3>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                ₦
              </span>
              <input
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                placeholder="0.00"
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-7 pr-4 py-3 text-sm outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Expiry (days)
            </h3>
            <input
              value={expiryDays}
              onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
              type="number"
              min="1"
              max="30"
              className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
            Note to Buyer (Optional)
          </h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a personal message..."
            rows={3}
            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-white resize-none"
          />
        </div>

        {/* Summary */}
        <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-6">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
              Subtotal
            </span>
            <span className="font-mono font-bold text-sm">
              {formatNaira(subtotalKobo)}
            </span>
          </div>
          {deliveryFeeKobo > 0 && (
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                Delivery
              </span>
              <span className="font-mono font-bold text-sm">
                {formatNaira(deliveryFeeKobo)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-3 border-t border-white/20 dark:border-slate-200">
            <span className="text-sm font-black uppercase">Total</span>
            <span className="text-2xl font-black tracking-tight">
              {formatNaira(totalKobo)}
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-green-500 text-white py-4 text-sm font-black uppercase tracking-[0.2em] hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-900 dark:border-slate-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0.5 active:shadow-none"
        >
          {submitting ? "Generating..." : "Generate Quote Link"}
        </button>
      </div>
    </div>
  );
}
